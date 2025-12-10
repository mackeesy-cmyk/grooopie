"""
Businesses API endpoints.
"""

from typing import List
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/businesses", tags=["businesses"])


# ============================================================================
# Response Schemas
# ============================================================================

class PricingTier(BaseModel):
    size: int
    pricePerPerson: int
    discountLabel: str


class BusinessResponse(BaseModel):
    id: str
    name: str
    category: str
    imageUrl: str
    maxDiscount: str
    minGroupSize: int
    currentlyActiveGroups: int
    description: str | None = None
    address: str | None = None
    pricingTiers: List[PricingTier] | None = None


# ============================================================================
# Mock Data (vil erstattes med database)
# ============================================================================

MOCK_BUSINESSES: List[BusinessResponse] = [
    BusinessResponse(
        id="1",
        name="Strike Zone Bowling",
        category="Aktivitet",
        imageUrl="https://placehold.co/600x400?text=Bowling",
        maxDiscount="Opptil 40% rabatt",
        minGroupSize=4,
        currentlyActiveGroups=2,
        description="Oslos beste bowlinghall med 24 baner, arkadespill og en fantastisk bar. Perfekt for vennegrupper, firmafester eller bursdager!",
        address="Storgata 123, 0182 Oslo",
        pricingTiers=[
            PricingTier(size=2, pricePerPerson=250, discountLabel="Standard"),
            PricingTier(size=4, pricePerPerson=200, discountLabel="20% rabatt"),
            PricingTier(size=6, pricePerPerson=175, discountLabel="30% rabatt"),
            PricingTier(size=8, pricePerPerson=150, discountLabel="Beste pris!"),
        ],
    ),
    BusinessResponse(
        id="2",
        name="Luigi's Wood Fired Pizza",
        category="Restaurant",
        imageUrl="https://placehold.co/600x400?text=Pizza",
        maxDiscount="Gratis forrett for grupper på 6+",
        minGroupSize=6,
        currentlyActiveGroups=0,
        description="Autentisk italiensk pizza bakt i steinovn. Vi bruker kun de beste ingrediensene importert direkte fra Italia.",
        address="Karl Johans gate 45, 0162 Oslo",
        pricingTiers=[
            PricingTier(size=2, pricePerPerson=350, discountLabel="Standard"),
            PricingTier(size=4, pricePerPerson=325, discountLabel="Gratis drikke"),
            PricingTier(size=6, pricePerPerson=300, discountLabel="Gratis forrett"),
            PricingTier(size=10, pricePerPerson=275, discountLabel="VIP-pakke!"),
        ],
    ),
    BusinessResponse(
        id="3",
        name="Velocity Go-Karting",
        category="Adrenalin",
        imageUrl="https://placehold.co/600x400?text=Go-Karts",
        maxDiscount="100 kr rabatt per person",
        minGroupSize=8,
        currentlyActiveGroups=5,
        description="Norges raskeste innendørs go-kart-bane! Opplev spenningen med profesjonelle elektriske go-karts som når 80 km/t.",
        address="Industriveien 55, 0579 Oslo",
        pricingTiers=[
            PricingTier(size=2, pricePerPerson=500, discountLabel="Standard"),
            PricingTier(size=4, pricePerPerson=450, discountLabel="50 kr rabatt"),
            PricingTier(size=8, pricePerPerson=400, discountLabel="100 kr rabatt"),
            PricingTier(size=12, pricePerPerson=350, discountLabel="Beste pris!"),
        ],
    ),
    BusinessResponse(
        id="4",
        name="The Escape Room Complex",
        category="Aktivitet",
        imageUrl="https://placehold.co/600x400?text=Escape+Room",
        maxDiscount="20% rabatt på hverdager",
        minGroupSize=3,
        currentlyActiveGroups=1,
        description="6 unike escape rooms med varierende vanskelighetsgrad. Kan du løse gåtene og rømme i tide?",
        address="Grünerløkka 78, 0552 Oslo",
        pricingTiers=[
            PricingTier(size=2, pricePerPerson=400, discountLabel="Standard"),
            PricingTier(size=3, pricePerPerson=350, discountLabel="12% rabatt"),
            PricingTier(size=5, pricePerPerson=320, discountLabel="20% rabatt"),
            PricingTier(size=6, pricePerPerson=300, discountLabel="Fullt rom-rabatt!"),
        ],
    ),
]


# ============================================================================
# Endpoints
# ============================================================================

@router.get("", response_model=List[BusinessResponse])
async def list_businesses() -> List[BusinessResponse]:
    """
    Hent alle tilgjengelige bedrifter.
    """
    return MOCK_BUSINESSES


@router.get("/{business_id}", response_model=BusinessResponse)
async def get_business(business_id: str) -> BusinessResponse:
    """
    Hent en spesifikk bedrift med ID.
    """
    for business in MOCK_BUSINESSES:
        if business.id == business_id:
            return business
    
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Bedrift ikke funnet")
