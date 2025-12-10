"""
Pydantic schemas for API request/response validation.
Matches the JSON contract defined in api/examples/lobby_response.json
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from uuid import UUID


# ============================================================================
# NESTED SCHEMAS
# ============================================================================

class UserBrief(BaseModel):
    """Brief user info for member lists."""
    id: UUID
    first_name: str
    last_name: str  # Will be abbreviated in endpoint (e.g., "Smith" -> "S.")
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class LobbyMemberResponse(BaseModel):
    """A member in the lobby."""
    id: UUID
    user: UserBrief
    is_creator: bool
    spots_reserved: int
    status: str
    joined_at: datetime

    class Config:
        from_attributes = True


class MembersSection(BaseModel):
    """Members section of lobby response."""
    current_count: int
    max_capacity: int
    spots_remaining: int
    list: List[LobbyMemberResponse]


class ActivityResponse(BaseModel):
    """Activity details in lobby response."""
    id: UUID
    name: str
    description: Optional[str]
    category: str
    location_name: str
    address: str
    city: str
    duration_minutes: int
    image_url: Optional[str]
    min_participants: int
    max_participants: int

    class Config:
        from_attributes = True


class TimeSlotResponse(BaseModel):
    """Time slot info."""
    id: UUID
    start_time: datetime
    end_time: datetime

    class Config:
        from_attributes = True


class LobbyBasic(BaseModel):
    """Basic lobby info."""
    id: UUID
    name: Optional[str]
    description: Optional[str]
    status: str
    is_public: bool
    invite_code: Optional[str]
    created_at: datetime
    booking_deadline: Optional[datetime]

    class Config:
        from_attributes = True


class PricingSection(BaseModel):
    """Current pricing info."""
    currency: str
    base_price_per_person: float
    current_price_per_person: float
    current_discount_percentage: float
    total_savings_per_person: float


class DiscountTierItem(BaseModel):
    """Individual discount tier."""
    min_participants: int
    max_participants: Optional[int]
    discount_percentage: float
    price_per_person: float
    tier_name: Optional[str]
    is_current: bool
    is_unlocked: bool
    members_needed: Optional[int] = None


class NextTierInfo(BaseModel):
    """Info about the next achievable tier."""
    tier_name: Optional[str]
    discount_percentage: float
    price_per_person: float
    members_needed: int
    potential_savings: float


class DiscountTiersSection(BaseModel):
    """Discount tiers section."""
    current_tier_index: int
    tiers: List[DiscountTierItem]
    next_tier: Optional[NextTierInfo] = None


class CountdownSection(BaseModel):
    """Countdown timers."""
    booking_deadline: Optional[datetime]
    time_remaining_seconds: Optional[int]
    time_remaining_formatted: Optional[str]
    activity_starts_in_seconds: int
    activity_starts_formatted: str
    is_urgent: bool


class UserContextSection(BaseModel):
    """Context about the requesting user."""
    is_member: bool
    is_creator: bool
    can_join: bool
    membership: Optional[LobbyMemberResponse] = None


class ShareSection(BaseModel):
    """Sharing links."""
    invite_url: str
    deep_link: str


# ============================================================================
# MAIN RESPONSE SCHEMA
# ============================================================================

class LobbyDetailResponse(BaseModel):
    """
    Complete response for GET /lobby/{id}.
    Matches the JSON contract exactly.
    """
    lobby: LobbyBasic
    activity: ActivityResponse
    time_slot: TimeSlotResponse
    members: MembersSection
    pricing: PricingSection
    discount_tiers: DiscountTiersSection
    countdown: CountdownSection
    user_context: UserContextSection
    share: ShareSection
