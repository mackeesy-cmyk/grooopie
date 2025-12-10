/**
 * TypeScript types matching the JSON contract for lobby responses.
 */

export interface UserBrief {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
}

export interface LobbyMember {
    id: string;
    user: UserBrief;
    is_creator: boolean;
    spots_reserved: number;
    status: 'pending' | 'confirmed' | 'cancelled';
    joined_at: string;
}

export interface MembersSection {
    current_count: number;
    max_capacity: number;
    spots_remaining: number;
    list: LobbyMember[];
}

export interface Activity {
    id: string;
    name: string;
    description: string | null;
    category: string;
    location_name: string;
    address: string;
    city: string;
    duration_minutes: number;
    image_url: string | null;
    min_participants: number;
    max_participants: number;
}

export interface TimeSlot {
    id: string;
    start_time: string;
    end_time: string;
}

export interface LobbyBasic {
    id: string;
    name: string | null;
    description: string | null;
    status: 'open' | 'full' | 'confirmed' | 'completed' | 'cancelled';
    is_public: boolean;
    invite_code: string | null;
    created_at: string;
    booking_deadline: string | null;
}

export interface PricingSection {
    currency: string;
    base_price_per_person: number;
    current_price_per_person: number;
    current_discount_percentage: number;
    total_savings_per_person: number;
}

export interface DiscountTier {
    min_participants: number;
    max_participants: number | null;
    discount_percentage: number;
    price_per_person: number;
    tier_name: string | null;
    is_current: boolean;
    is_unlocked: boolean;
    members_needed?: number;
}

export interface NextTierInfo {
    tier_name: string | null;
    discount_percentage: number;
    price_per_person: number;
    members_needed: number;
    potential_savings: number;
}

export interface DiscountTiersSection {
    current_tier_index: number;
    tiers: DiscountTier[];
    next_tier: NextTierInfo | null;
}

export interface CountdownSection {
    booking_deadline: string | null;
    time_remaining_seconds: number | null;
    time_remaining_formatted: string | null;
    activity_starts_in_seconds: number;
    activity_starts_formatted: string;
    is_urgent: boolean;
}

export interface UserContextSection {
    is_member: boolean;
    is_creator: boolean;
    can_join: boolean;
    membership: LobbyMember | null;
}

export interface ShareSection {
    invite_url: string;
    deep_link: string;
}

export interface LobbyDetailResponse {
    lobby: LobbyBasic;
    activity: Activity;
    time_slot: TimeSlot;
    members: MembersSection;
    pricing: PricingSection;
    discount_tiers: DiscountTiersSection;
    countdown: CountdownSection;
    user_context: UserContextSection;
    share: ShareSection;
}
