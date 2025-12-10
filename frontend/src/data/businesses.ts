/**
 * Delt mock-data for Groupie-applikasjonen
 * Brukes av både landingsside og bedriftsdetaljside
 */

// ============================================================================
// Datastrukturer
// ============================================================================

export interface PricingTier {
    size: number;
    pricePerPerson: number;
    discountLabel: string;
}

export interface BusinessListing {
    id: string;
    name: string;
    category: string;
    imageUrl: string;
    maxDiscount: string;
    minGroupSize: number;
    currentlyActiveGroups: number;
    description?: string;
    address?: string;
    pricingTiers?: PricingTier[];
}

// ============================================================================
// Mock Data
// ============================================================================

export const MOCK_BUSINESSES: BusinessListing[] = [
    {
        id: '1',
        name: 'Strike Zone Bowling',
        category: 'Aktivitet',
        imageUrl: 'https://placehold.co/600x400?text=Bowling',
        maxDiscount: 'Opptil 40% rabatt',
        minGroupSize: 4,
        currentlyActiveGroups: 2,
        description: 'Oslos beste bowlinghall med 24 baner, arkadespill og en fantastisk bar. Perfekt for vennegrupper, firmafester eller bursdager!',
        address: 'Storgata 123, 0182 Oslo',
        pricingTiers: [
            { size: 2, pricePerPerson: 250, discountLabel: 'Standard' },
            { size: 4, pricePerPerson: 200, discountLabel: '20% rabatt' },
            { size: 6, pricePerPerson: 175, discountLabel: '30% rabatt' },
            { size: 8, pricePerPerson: 150, discountLabel: 'Beste pris!' },
        ],
    },
    {
        id: '2',
        name: "Luigi's Wood Fired Pizza",
        category: 'Restaurant',
        imageUrl: 'https://placehold.co/600x400?text=Pizza',
        maxDiscount: 'Gratis forrett for grupper på 6+',
        minGroupSize: 6,
        currentlyActiveGroups: 0,
        description: 'Autentisk italiensk pizza bakt i steinovn. Vi bruker kun de beste ingrediensene importert direkte fra Italia.',
        address: 'Karl Johans gate 45, 0162 Oslo',
        pricingTiers: [
            { size: 2, pricePerPerson: 350, discountLabel: 'Standard' },
            { size: 4, pricePerPerson: 325, discountLabel: 'Gratis drikke' },
            { size: 6, pricePerPerson: 300, discountLabel: 'Gratis forrett' },
            { size: 10, pricePerPerson: 275, discountLabel: 'VIP-pakke!' },
        ],
    },
    {
        id: '3',
        name: 'Velocity Go-Karting',
        category: 'Adrenalin',
        imageUrl: 'https://placehold.co/600x400?text=Go-Karts',
        maxDiscount: '100 kr rabatt per person',
        minGroupSize: 8,
        currentlyActiveGroups: 5,
        description: 'Norges raskeste innendørs go-kart-bane! Opplev spenningen med profesjonelle elektriske go-karts som når 80 km/t.',
        address: 'Industriveien 55, 0579 Oslo',
        pricingTiers: [
            { size: 2, pricePerPerson: 500, discountLabel: 'Standard' },
            { size: 4, pricePerPerson: 450, discountLabel: '50 kr rabatt' },
            { size: 8, pricePerPerson: 400, discountLabel: '100 kr rabatt' },
            { size: 12, pricePerPerson: 350, discountLabel: 'Beste pris!' },
        ],
    },
    {
        id: '4',
        name: 'The Escape Room Complex',
        category: 'Aktivitet',
        imageUrl: 'https://placehold.co/600x400?text=Escape+Room',
        maxDiscount: '20% rabatt på hverdager',
        minGroupSize: 3,
        currentlyActiveGroups: 1,
        description: '6 unike escape rooms med varierende vanskelighetsgrad. Kan du løse gåtene og rømme i tide?',
        address: 'Grünerløkka 78, 0552 Oslo',
        pricingTiers: [
            { size: 2, pricePerPerson: 400, discountLabel: 'Standard' },
            { size: 3, pricePerPerson: 350, discountLabel: '12% rabatt' },
            { size: 5, pricePerPerson: 320, discountLabel: '20% rabatt' },
            { size: 6, pricePerPerson: 300, discountLabel: 'Fullt rom-rabatt!' },
        ],
    },
];

// ============================================================================
// Hjelpefunksjoner
// ============================================================================

export function getBusinessById(id: string): BusinessListing | undefined {
    return MOCK_BUSINESSES.find((business) => business.id === id);
}

// ============================================================================
// Kategorifiltre
// ============================================================================

export const CATEGORIES = [
    { key: 'All', label: 'Alle' },
    { key: 'Aktivitet', label: 'Aktivitet' },
    { key: 'Restaurant', label: 'Restaurant' },
    { key: 'Adrenalin', label: 'Adrenalin' },
];
