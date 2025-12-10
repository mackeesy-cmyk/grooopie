'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getBusinessById, PricingTier } from '@/data/businesses';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

// ============================================================================
// Konstanter
// ============================================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ============================================================================
// Rabattstige-komponent (Discount Ladder)
// ============================================================================

interface DiscountLadderProps {
    tiers: PricingTier[];
    selectedIndex: number;
    onSelect: (index: number) => void;
}

const DiscountLadder: React.FC<DiscountLadderProps> = ({ tiers, selectedIndex, onSelect }) => {
    const maxPrice = Math.max(...tiers.map(t => t.pricePerPerson));

    return (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-lg shadow-gray-100/50">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Rabattstigen</h2>
            <p className="text-gray-500 text-sm mb-6">Jo flere som blir med, jo mindre betaler alle!</p>

            <div className="space-y-3">
                {tiers.map((tier, index) => {
                    const isSelected = index === selectedIndex;
                    const isBestValue = index === tiers.length - 1;
                    const barWidth = (tier.pricePerPerson / maxPrice) * 100;
                    const savings = Math.round((1 - tier.pricePerPerson / maxPrice) * 100);

                    return (
                        <button
                            key={tier.size}
                            onClick={() => onSelect(index)}
                            className={`w-full text-left transition-all duration-300 ${isSelected ? 'scale-[1.02]' : 'hover:scale-[1.01]'}`}
                        >
                            <div className={`relative p-4 rounded-2xl border-2 transition-all ${isSelected
                                ? 'border-[#FF6B5B] bg-gradient-to-r from-[#FF6B5B] to-[#E85A4A] text-white shadow-lg shadow-[#FF6B5B]/30'
                                : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
                                }`}>
                                {isBestValue && (
                                    <div className={`absolute -top-2.5 right-4 px-3 py-0.5 text-xs font-bold rounded-full ${isSelected ? 'bg-white text-[#FF6B5B]' : 'bg-[#14B8A6] text-white'
                                        }`}>
                                        🏆 Beste pris!
                                    </div>
                                )}

                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-white/20' : 'bg-[#14B8A6]/10'
                                            }`}>
                                            <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-[#14B8A6]'}`}>
                                                {tier.size}
                                            </span>
                                        </div>
                                        <span className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                            {tier.size} personer
                                        </span>
                                    </div>

                                    <div className="text-right">
                                        <span className={`text-2xl font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                            {tier.pricePerPerson} kr
                                        </span>
                                        <span className={`text-xs ml-1 ${isSelected ? 'text-white/70' : 'text-gray-500'}`}>
                                            /pers
                                        </span>
                                    </div>
                                </div>

                                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${isSelected ? 'bg-white' : 'bg-gradient-to-r from-[#FF6B5B] to-[#14B8A6]'
                                            }`}
                                        style={{ width: `${barWidth}%` }}
                                    />
                                </div>

                                <div className="flex justify-between mt-2">
                                    <span className={`text-sm ${isSelected ? 'text-white/70' : 'text-gray-500'}`}>
                                        {tier.discountLabel}
                                    </span>
                                    {savings > 0 && (
                                        <span className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-[#14B8A6]'
                                            }`}>
                                            Spar {savings}%
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// ============================================================================
// Bedriftsdetaljside
// ============================================================================

export default function BusinessDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const businessId = params.id as string;
    const business = getBusinessById(businessId);

    const [selectedTierIndex, setSelectedTierIndex] = useState(0);
    const [isCreating, setIsCreating] = useState(false);
    const [activeLobbyCode, setActiveLobbyCode] = useState<string | null>(null);
    const [activeLobbyBusinessId, setActiveLobbyBusinessId] = useState<string | null>(null);
    const [isLeaderOfEmptyLobby, setIsLeaderOfEmptyLobby] = useState(false);

    // Check for active lobby and whether it's empty and user is leader
    useEffect(() => {
        const checkActiveLobby = async () => {
            if (typeof window === 'undefined') return;

            const savedLobby = localStorage.getItem('groupie_active_lobby');
            const savedBusinessId = localStorage.getItem('groupie_active_business_id');

            if (savedLobby) {
                setActiveLobbyCode(savedLobby);
                setActiveLobbyBusinessId(savedBusinessId);

                // Fetch lobby details to check if user is leader
                try {
                    const response = await fetch(`${API_URL}/lobbies/${savedLobby}`);
                    if (response.ok) {
                        const lobbyData = await response.json();
                        // Check if user is leader (allow switching even with existing business)
                        const isLeader = lobbyData.leader_name === user?.name;
                        setIsLeaderOfEmptyLobby(isLeader); // Renamed but now means "is leader of active lobby"
                        // Store current business for confirmation dialog
                        if (lobbyData.business_id) {
                            setActiveLobbyBusinessId(lobbyData.business_id);
                        }
                    }
                } catch (err) {
                    console.error('Error fetching lobby:', err);
                }
            }
        };

        checkActiveLobby();
    }, [user]);

    // Update/attach business to an existing lobby (works for empty or switching)
    const attachBusinessToLobby = async () => {
        if (!activeLobbyCode) return;

        // If lobby already has a different business, confirm switch
        if (activeLobbyBusinessId && activeLobbyBusinessId !== businessId) {
            const existingBusiness = getBusinessById(activeLobbyBusinessId);
            const confirmSwitch = confirm(
                `Bytte fra "${existingBusiness?.name || 'gjeldende aktivitet'}" til "${business?.name}"?`
            );
            if (!confirmSwitch) return;
        }

        setIsCreating(true);
        try {
            const response = await fetch(`${API_URL}/lobbies/${activeLobbyCode}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ business_id: businessId }),
            });

            if (!response.ok) {
                throw new Error('Kunne ikke oppdatere aktivitet');
            }

            localStorage.setItem('groupie_active_business_id', businessId);
            toast.success(`Aktivitet oppdatert til ${business?.name}! 🎉`);
            router.push(`/lobby/${activeLobbyCode}`);
        } catch (err) {
            console.error('Feil ved oppdatering av lobby:', err);
            toast.error('Kunne ikke oppdatere aktivitet. Prøv igjen.');
        } finally {
            setIsCreating(false);
        }
    };

    const createNewGroup = async () => {
        if (!user) return;

        setIsCreating(true);
        try {
            const response = await fetch(`${API_URL}/lobbies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    business_id: businessId,
                    leader_name: user.name,
                }),
            });

            if (!response.ok) {
                throw new Error('Kunne ikke opprette gruppe');
            }

            const data = await response.json();
            localStorage.setItem('groupie_active_lobby', data.lobby_code);
            localStorage.setItem('groupie_active_business_id', businessId);
            toast.success('Gruppe opprettet!');
            router.push(`/lobby/${data.lobby_code}`);
        } catch (err) {
            console.error('Feil ved opprettelse av gruppe:', err);
            toast.error('Kunne ikke opprette gruppe. Prøv igjen.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleStartGroup = async () => {
        if (!isAuthenticated || !user) {
            router.push('/login');
            return;
        }

        // If already have a group for THIS business, go to it
        if (activeLobbyCode && activeLobbyBusinessId === businessId) {
            router.push(`/lobby/${activeLobbyCode}`);
            return;
        }

        // If have a group for a DIFFERENT business, ask to replace
        if (activeLobbyCode && activeLobbyBusinessId && activeLobbyBusinessId !== businessId) {
            const existingBusiness = getBusinessById(activeLobbyBusinessId);
            const confirmReplace = confirm(
                `Du har allerede en aktiv gruppe for "${existingBusiness?.name || 'annet tilbud'}".\n\nVil du erstatte den med "${business?.name}"?`
            );

            if (confirmReplace) {
                // Clear old lobby and create new one
                localStorage.removeItem('groupie_active_lobby');
                localStorage.removeItem('groupie_active_business_id');
                setActiveLobbyCode(null);
                setActiveLobbyBusinessId(null);
                await createNewGroup();
            } else {
                // Go to existing group
                router.push(`/lobby/${activeLobbyCode}`);
            }
            return;
        }

        // No existing group, create new one
        await createNewGroup();
    };

    if (!business) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#FFFAF8] via-white to-[#CCFBF1]/30 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-20 h-20 bg-[#FF6B5B]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">😕</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Bedrift ikke funnet</h1>
                    <p className="text-gray-500 mb-6">Vi kunne ikke finne bedriften du leter etter.</p>
                    <Link href="/">
                        <button className="px-6 py-3 bg-gradient-to-r from-[#FF6B5B] to-[#E85A4A] text-white rounded-xl font-semibold shadow-lg shadow-[#FF6B5B]/30">
                            Tilbake til forsiden
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    const pricingTiers = business.pricingTiers || [];
    const selectedTier = pricingTiers[selectedTierIndex];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FFFAF8] via-white to-[#CCFBF1]/30 pb-28">
            {/* Header */}
            <header className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-gray-100 z-50">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span className="font-medium">Tilbake</span>
                        </Link>

                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#FF6B5B] to-[#E85A4A] rounded-lg flex items-center justify-center shadow-lg shadow-[#FF6B5B]/20">
                                <span className="text-sm">👥</span>
                            </div>
                            <span className="text-lg font-bold text-gray-900">Groupie</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Image */}
            <div className="relative h-72 md:h-96 overflow-hidden">
                <img
                    src={business.imageUrl}
                    alt={business.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                {/* Discount Badge */}
                <div className="absolute top-4 right-4">
                    <div className="px-4 py-2 bg-gradient-to-r from-[#FF6B5B] to-[#E85A4A] text-white font-bold rounded-xl shadow-lg shadow-[#FF6B5B]/30">
                        {business.maxDiscount}
                    </div>
                </div>

                {/* Title */}
                <div className="absolute bottom-6 left-4 right-4 max-w-4xl mx-auto">
                    <span className="inline-block px-3 py-1 bg-[#14B8A6] text-white text-sm font-semibold rounded-full mb-3">
                        {business.category}
                    </span>
                    <h1 className="text-4xl md:text-5xl font-bold text-white">
                        {business.name}
                    </h1>

                    {business.currentlyActiveGroups > 0 && (
                        <div className="flex items-center gap-2 mt-3">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-white/80 text-sm">
                                {business.currentlyActiveGroups} grupper samler seg nå
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="grid md:grid-cols-5 gap-8">
                    {/* Left Column */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg shadow-gray-100/50">
                            <h2 className="text-xl font-bold text-gray-900 mb-3">Om opplevelsen</h2>
                            <p className="text-gray-600 leading-relaxed">
                                {business.description}
                            </p>
                        </div>

                        {business.address && (
                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg shadow-gray-100/50">
                                <h2 className="text-lg font-bold text-gray-900 mb-3">Beliggenhet</h2>
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-[#14B8A6]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5 text-[#14B8A6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <span className="text-gray-600">{business.address}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column */}
                    <div className="md:col-span-3">
                        <DiscountLadder
                            tiers={pricingTiers}
                            selectedIndex={selectedTierIndex}
                            onSelect={setSelectedTierIndex}
                        />

                        {selectedTier && (
                            <div className="mt-6 bg-white rounded-3xl p-6 border border-gray-100 shadow-lg shadow-gray-100/50">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <span className="text-gray-500">Totalt for</span>
                                        <span className="text-gray-900 font-semibold ml-1">{selectedTier.size} personer</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-3xl font-bold text-[#FF6B5B]">
                                            {selectedTier.pricePerPerson * selectedTier.size} kr
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 mt-2">
                                    {selectedTier.pricePerPerson} kr per person × {selectedTier.size} personer
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Sticky Bottom CTA */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 p-4 z-50">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                    <div className="hidden sm:block">
                        {selectedTier && (
                            <>
                                <span className="text-gray-500">Total: </span>
                                <span className="text-2xl font-bold text-gray-900">
                                    {selectedTier.pricePerPerson * selectedTier.size} kr
                                </span>
                                <span className="text-gray-500 ml-1">for {selectedTier.size} pers.</span>
                            </>
                        )}
                    </div>

                    <button
                        onClick={isLeaderOfEmptyLobby ? attachBusinessToLobby : handleStartGroup}
                        disabled={isCreating}
                        className={`flex-1 sm:flex-none sm:px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 disabled:opacity-50 ${isLeaderOfEmptyLobby
                            ? 'bg-gradient-to-r from-[#14B8A6] to-[#0D9488] hover:from-[#0D9488] hover:to-[#0F766E] text-white shadow-lg shadow-[#14B8A6]/30'
                            : activeLobbyCode
                                ? 'bg-gradient-to-r from-[#14B8A6] to-[#0D9488] hover:from-[#0D9488] hover:to-[#0F766E] text-white shadow-lg shadow-[#14B8A6]/30'
                                : 'bg-gradient-to-r from-[#FF6B5B] to-[#E85A4A] hover:from-[#E85A4A] hover:to-[#D64A3A] text-white shadow-lg shadow-[#FF6B5B]/30'
                            }`}
                    >
                        {isCreating ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                {isLeaderOfEmptyLobby ? 'Oppdaterer...' : 'Oppretter...'}
                            </span>
                        ) : isLeaderOfEmptyLobby ? (
                            activeLobbyBusinessId && activeLobbyBusinessId !== businessId
                                ? '🔄 Bytt til denne aktiviteten'
                                : activeLobbyBusinessId === businessId
                                    ? '✓ Allerede valgt'
                                    : '✓ Velg denne aktiviteten'
                        ) : activeLobbyCode ? (
                            'Min gruppe →'
                        ) : (
                            'Start en Gruppe →'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
