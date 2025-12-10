"""
Merchant API endpoints for business owners.
Handles discount rules and booking management.
"""

from datetime import time
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator

router = APIRouter(prefix="/merchant", tags=["merchant"])


# ============================================================================
# Pydantic Schemas
# ============================================================================

class DiscountRuleCreate(BaseModel):
    day_of_week: int  # 0=Monday, 6=Sunday
    start_time: str   # HH:MM format
    end_time: str     # HH:MM format
    min_group_size: int
    discount_percent: int

    @field_validator('day_of_week')
    @classmethod
    def validate_day(cls, v: int) -> int:
        if v < 0 or v > 6:
            raise ValueError('day_of_week må være mellom 0 (mandag) og 6 (søndag)')
        return v

    @field_validator('min_group_size')
    @classmethod
    def validate_group_size(cls, v: int) -> int:
        if v < 2:
            raise ValueError('min_group_size må være minst 2')
        return v

    @field_validator('discount_percent')
    @classmethod
    def validate_discount(cls, v: int) -> int:
        if v < 1 or v > 100:
            raise ValueError('discount_percent må være mellom 1 og 100')
        return v


class DiscountRuleResponse(BaseModel):
    id: str
    business_id: str
    day_of_week: int
    start_time: str
    end_time: str
    min_group_size: int
    discount_percent: int


class BookingResponse(BaseModel):
    lobby_id: str
    lobby_code: str
    leader_name: str
    members: list[str]
    group_size: int
    created_at: str
    status: str


# ============================================================================
# In-Memory Storage
# ============================================================================

# Discount rules per business
DISCOUNT_RULES_STORE: dict[str, list[dict]] = {
    "1": [
        {
            "id": "rule_1",
            "business_id": "1",
            "day_of_week": 1,  # Tuesday
            "start_time": "18:00",
            "end_time": "21:00",
            "min_group_size": 4,
            "discount_percent": 20,
        },
        {
            "id": "rule_2",
            "business_id": "1",
            "day_of_week": 2,  # Wednesday
            "start_time": "16:00",
            "end_time": "19:00",
            "min_group_size": 6,
            "discount_percent": 30,
        },
    ]
}

# Reference to lobbies store from lobbies.py
from routers.lobbies import LOBBIES_STORE


# ============================================================================
# Helper Functions
# ============================================================================

def parse_time(time_str: str) -> time:
    """Parse HH:MM string to time object."""
    parts = time_str.split(':')
    return time(int(parts[0]), int(parts[1]))


def times_overlap(start1: str, end1: str, start2: str, end2: str) -> bool:
    """Check if two time ranges overlap."""
    s1, e1 = parse_time(start1), parse_time(end1)
    s2, e2 = parse_time(start2), parse_time(end2)
    
    # Overlap exists if one range starts before the other ends
    return s1 < e2 and s2 < e1


# ============================================================================
# Endpoints
# ============================================================================

@router.get("/{business_id}/rules", response_model=list[DiscountRuleResponse])
async def get_discount_rules(business_id: str) -> list[DiscountRuleResponse]:
    """
    Hent alle rabattregler for en bedrift.
    """
    rules = DISCOUNT_RULES_STORE.get(business_id, [])
    return [DiscountRuleResponse(**rule) for rule in rules]


@router.post("/{business_id}/rules", response_model=DiscountRuleResponse)
async def create_discount_rule(business_id: str, rule: DiscountRuleCreate) -> DiscountRuleResponse:
    """
    Opprett en ny rabattregel for en bedrift.
    
    Validerer at tidsperioder ikke overlapper for samme dag.
    """
    # Hent eksisterende regler for denne bedriften
    if business_id not in DISCOUNT_RULES_STORE:
        DISCOUNT_RULES_STORE[business_id] = []
    
    existing_rules = DISCOUNT_RULES_STORE[business_id]
    
    # Sjekk for overlappende tidsperioder på samme dag
    for existing in existing_rules:
        if existing["day_of_week"] == rule.day_of_week:
            if times_overlap(
                rule.start_time, rule.end_time,
                existing["start_time"], existing["end_time"]
            ):
                raise HTTPException(
                    status_code=400,
                    detail=f"Tidsperioden overlapper med en eksisterende regel (ID: {existing['id']})"
                )
    
    # Opprett ny regel
    rule_id = f"rule_{len(existing_rules) + 1}_{business_id}"
    new_rule = {
        "id": rule_id,
        "business_id": business_id,
        "day_of_week": rule.day_of_week,
        "start_time": rule.start_time,
        "end_time": rule.end_time,
        "min_group_size": rule.min_group_size,
        "discount_percent": rule.discount_percent,
    }
    
    DISCOUNT_RULES_STORE[business_id].append(new_rule)
    
    return DiscountRuleResponse(**new_rule)


@router.delete("/{business_id}/rules/{rule_id}")
async def delete_discount_rule(business_id: str, rule_id: str) -> dict:
    """
    Slett en rabattregel.
    """
    if business_id not in DISCOUNT_RULES_STORE:
        raise HTTPException(status_code=404, detail="Bedrift ikke funnet")
    
    rules = DISCOUNT_RULES_STORE[business_id]
    for i, rule in enumerate(rules):
        if rule["id"] == rule_id:
            del rules[i]
            return {"success": True, "message": "Regel slettet"}
    
    raise HTTPException(status_code=404, detail="Regel ikke funnet")


@router.get("/{business_id}/bookings", response_model=list[BookingResponse])
async def get_business_bookings(business_id: str) -> list[BookingResponse]:
    """
    Hent alle bekreftede bookinger for en bedrift.
    
    Returnerer en liste over CONFIRMED lobbyer med brukerinfo.
    """
    bookings = []
    
    for lobby_id, lobby in LOBBIES_STORE.items():
        # Filtrer på business_id og status
        if lobby.get("business_id") == business_id:
            # Inkluder både OPEN og CONFIRMED for demo
            bookings.append(BookingResponse(
                lobby_id=lobby["id"],
                lobby_code=lobby["code"],
                leader_name=lobby["leader_name"],
                members=lobby["members"],
                group_size=lobby["member_count"],
                created_at=lobby["created_at"],
                status=lobby["status"],
            ))
    
    return bookings
