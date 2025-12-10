"""
Lobby API endpoints.
"""

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Lobby, LobbyMember, Activity, TimeSlot, DiscountTier, User, LobbyStatus
from ..schemas import (
    LobbyDetailResponse,
    LobbyBasic,
    ActivityResponse,
    TimeSlotResponse,
    MembersSection,
    LobbyMemberResponse,
    UserBrief,
    PricingSection,
    DiscountTiersSection,
    DiscountTierItem,
    NextTierInfo,
    CountdownSection,
    UserContextSection,
    ShareSection,
)

router = APIRouter(prefix="/lobby", tags=["lobbies"])

# Configuration
BASE_URL = "https://groupie.app"
DEEP_LINK_SCHEME = "groupie"


def format_time_remaining(seconds: int) -> str:
    """Format seconds into human-readable string like '6d 1h 27m'."""
    if seconds <= 0:
        return "Expired"
    
    days = seconds // 86400
    hours = (seconds % 86400) // 3600
    minutes = (seconds % 3600) // 60
    
    parts = []
    if days > 0:
        parts.append(f"{days}d")
    if hours > 0:
        parts.append(f"{hours}h")
    if minutes > 0 or not parts:
        parts.append(f"{minutes}m")
    
    return " ".join(parts)


def get_current_tier(tiers: list[DiscountTier], member_count: int) -> Optional[DiscountTier]:
    """Find the discount tier that applies for the current member count."""
    applicable_tier = None
    for tier in sorted(tiers, key=lambda t: t.min_participants):
        if member_count >= tier.min_participants:
            if tier.max_participants is None or member_count <= tier.max_participants:
                applicable_tier = tier
    return applicable_tier


def abbreviate_last_name(last_name: str) -> str:
    """Abbreviate last name for privacy (e.g., 'Smith' -> 'S.')."""
    if last_name:
        return f"{last_name[0]}."
    return ""


@router.get("/{lobby_id}", response_model=LobbyDetailResponse)
async def get_lobby(
    lobby_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: Optional[UUID] = None,  # Would come from auth middleware
) -> LobbyDetailResponse:
    """
    Get detailed information about a lobby.
    
    Returns all data needed to render the lobby screen including:
    - Lobby details and status
    - Activity information
    - Current members
    - Discount tier progression
    - Countdown timers
    """
    
    # Query lobby with all related data
    lobby = db.query(Lobby).options(
        joinedload(Lobby.time_slot).joinedload(TimeSlot.activity).joinedload(Activity.discount_tiers),
        joinedload(Lobby.members).joinedload(LobbyMember.user),
        joinedload(Lobby.creator),
    ).filter(Lobby.id == lobby_id).first()
    
    if not lobby:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lobby with id {lobby_id} not found"
        )
    
    time_slot = lobby.time_slot
    activity = time_slot.activity
    discount_tiers = sorted(activity.discount_tiers, key=lambda t: t.min_participants)
    members = lobby.members
    
    # Calculate current member count (including spots_reserved)
    current_count = sum(m.spots_reserved for m in members if m.status.value != "cancelled")
    
    # Find current discount tier
    current_tier = get_current_tier(discount_tiers, current_count)
    current_discount = float(current_tier.discount_percentage) if current_tier else 0
    base_price = float(activity.base_price)
    current_price = base_price * (1 - current_discount / 100)
    
    # Build members list
    members_list = []
    for member in members:
        if member.status.value == "cancelled":
            continue
        members_list.append(LobbyMemberResponse(
            id=member.id,
            user=UserBrief(
                id=member.user.id,
                first_name=member.user.first_name,
                last_name=abbreviate_last_name(member.user.last_name),
                avatar_url=member.user.avatar_url,
            ),
            is_creator=member.user_id == lobby.creator_id,
            spots_reserved=member.spots_reserved,
            status=member.status.value,
            joined_at=member.joined_at,
        ))
    
    # Build discount tiers with current state
    tiers_list = []
    current_tier_index = 0
    for i, tier in enumerate(discount_tiers):
        is_unlocked = current_count >= tier.min_participants
        is_current = (
            current_count >= tier.min_participants and
            (tier.max_participants is None or current_count <= tier.max_participants)
        )
        if is_current:
            current_tier_index = i
        
        tier_price = base_price * (1 - float(tier.discount_percentage) / 100)
        members_needed = max(0, tier.min_participants - current_count) if not is_unlocked else None
        
        tiers_list.append(DiscountTierItem(
            min_participants=tier.min_participants,
            max_participants=tier.max_participants,
            discount_percentage=float(tier.discount_percentage),
            price_per_person=round(tier_price, 2),
            tier_name=tier.tier_name,
            is_current=is_current,
            is_unlocked=is_unlocked,
            members_needed=members_needed,
        ))
    
    # Find next tier
    next_tier = None
    for i, tier in enumerate(discount_tiers):
        if current_count < tier.min_participants:
            tier_price = base_price * (1 - float(tier.discount_percentage) / 100)
            next_tier = NextTierInfo(
                tier_name=tier.tier_name,
                discount_percentage=float(tier.discount_percentage),
                price_per_person=round(tier_price, 2),
                members_needed=tier.min_participants - current_count,
                potential_savings=round(current_price - tier_price, 2),
            )
            break
    
    # Calculate countdowns
    now = datetime.now(timezone.utc)
    
    booking_deadline = lobby.booking_deadline
    time_remaining_seconds = None
    time_remaining_formatted = None
    if booking_deadline:
        # Ensure booking_deadline is timezone-aware
        if booking_deadline.tzinfo is None:
            booking_deadline = booking_deadline.replace(tzinfo=timezone.utc)
        time_remaining_seconds = max(0, int((booking_deadline - now).total_seconds()))
        time_remaining_formatted = format_time_remaining(time_remaining_seconds)
    
    # Ensure start_time is timezone-aware
    start_time = time_slot.start_time
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)
    activity_starts_in = max(0, int((start_time - now).total_seconds()))
    
    is_urgent = (
        time_remaining_seconds is not None and 
        time_remaining_seconds < 86400  # Less than 24 hours
    )
    
    # User context
    user_membership = None
    is_member = False
    is_creator = False
    if current_user_id:
        for member in members:
            if member.user_id == current_user_id:
                user_membership = LobbyMemberResponse(
                    id=member.id,
                    user=UserBrief(
                        id=member.user.id,
                        first_name=member.user.first_name,
                        last_name=abbreviate_last_name(member.user.last_name),
                        avatar_url=member.user.avatar_url,
                    ),
                    is_creator=member.user_id == lobby.creator_id,
                    spots_reserved=member.spots_reserved,
                    status=member.status.value,
                    joined_at=member.joined_at,
                )
                is_member = True
                is_creator = member.user_id == lobby.creator_id
                break
    
    can_join = (
        not is_member and 
        lobby.status == LobbyStatus.OPEN and
        current_count < activity.max_participants
    )
    
    # Build share links
    invite_code = lobby.invite_code or str(lobby.id)
    
    return LobbyDetailResponse(
        lobby=LobbyBasic(
            id=lobby.id,
            name=lobby.name,
            description=lobby.description,
            status=lobby.status.value,
            is_public=lobby.is_public,
            invite_code=lobby.invite_code,
            created_at=lobby.created_at,
            booking_deadline=lobby.booking_deadline,
        ),
        activity=ActivityResponse(
            id=activity.id,
            name=activity.name,
            description=activity.description,
            category=activity.category,
            location_name=activity.location_name,
            address=activity.address,
            city=activity.city,
            duration_minutes=activity.duration_minutes,
            image_url=activity.image_url,
            min_participants=activity.min_participants,
            max_participants=activity.max_participants,
        ),
        time_slot=TimeSlotResponse(
            id=time_slot.id,
            start_time=time_slot.start_time,
            end_time=time_slot.end_time,
        ),
        members=MembersSection(
            current_count=current_count,
            max_capacity=activity.max_participants,
            spots_remaining=activity.max_participants - current_count,
            list=members_list,
        ),
        pricing=PricingSection(
            currency=activity.currency,
            base_price_per_person=base_price,
            current_price_per_person=round(current_price, 2),
            current_discount_percentage=current_discount,
            total_savings_per_person=round(base_price - current_price, 2),
        ),
        discount_tiers=DiscountTiersSection(
            current_tier_index=current_tier_index,
            tiers=tiers_list,
            next_tier=next_tier,
        ),
        countdown=CountdownSection(
            booking_deadline=lobby.booking_deadline,
            time_remaining_seconds=time_remaining_seconds,
            time_remaining_formatted=time_remaining_formatted,
            activity_starts_in_seconds=activity_starts_in,
            activity_starts_formatted=format_time_remaining(activity_starts_in),
            is_urgent=is_urgent,
        ),
        user_context=UserContextSection(
            is_member=is_member,
            is_creator=is_creator,
            can_join=can_join,
            membership=user_membership,
        ),
        share=ShareSection(
            invite_url=f"{BASE_URL}/join/{invite_code}",
            deep_link=f"{DEEP_LINK_SCHEME}://lobby/{lobby.id}",
        ),
    )
