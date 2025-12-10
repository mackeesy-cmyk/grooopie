'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

// ============================================================================
// Typer
// ============================================================================

interface Business {
    id: string;
    name: string;
    category: string;
    imageUrl: string;
    location: string;
    originalPrice: number;
    groupPrice: number;
}

// ============================================================================
// Konstanter
// ============================================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const MOCK_BUSINESSES: Business[] = [
    {
        id: '1',
        name: 'Velocity Go-Karting',
        category: 'Gokart',
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
        location: 'Oslo',
        originalPrice: 599,
        groupPrice: 399,
    },
    {
        id: '2',
        name: 'Aker Brygge Seafood',
        category: 'Restaurant',
        imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
        location: 'Oslo',
        originalPrice: 450,
        groupPrice: 320,
    },
    {
        id: '3',
        name: 'Bergen Golf Club',
        category: 'Golf',
        imageUrl: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=300&fit=crop',
        location: 'Bergen',
        originalPrice: 800,
        groupPrice: 550,
    },
    {
        id: '4',
        name: 'Escape Room Oslo',
        category: 'Escape Room',
        imageUrl: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=300&fit=crop',
        location: 'Oslo',
        originalPrice: 350,
        groupPrice: 250,
    },
    {
        id: '5',
        name: 'Stratos Bowling',
        category: 'Bowling',
        imageUrl: 'https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=400&h=300&fit=crop',
        location: 'Trondheim',
        originalPrice: 280,
        groupPrice: 180,
    },
    {
        id: '6',
        name: 'Farris Bad Spa',
        category: 'Spa',
        imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop',
        location: 'Larvik',
        originalPrice: 950,
        groupPrice: 650,
    },
];

// ============================================================================
// Hovedside
// ============================================================================

export default function StartGroupPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Redirect til login hvis ikke innlogget
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    // Check if user has an active lobby they can update (as leader)
    const [activeLobbyCode, setActiveLobbyCode] = useState<string | null>(null);
    const [isLeaderOfLobby, setIsLeaderOfLobby] = useState(false);
    const [currentLobbyBusinessId, setCurrentLobbyBusinessId] = useState<string | null>(null);

    useEffect(() => {
        const checkActiveLobby = async () => {
            if (typeof window === 'undefined') return;

            const savedLobby = localStorage.getItem('groupie_active_lobby');
            if (savedLobby) {
                setActiveLobbyCode(savedLobby);

                // Check if lobby exists and user is leader
                try {
                    const response = await fetch(`${API_URL}/lobbies/${savedLobby}`);
                    if (response.ok) {
                        const data = await response.json();
                        // User is leader if their name matches
                        const isLeader = data.leader_name === user?.name;
                        setIsLeaderOfLobby(isLeader);
                        setCurrentLobbyBusinessId(data.business_id || null);
                    } else {
                        // Lobby doesn't exist anymore
                        localStorage.removeItem('groupie_active_lobby');
                        setActiveLobbyCode(null);
                        setIsLeaderOfLobby(false);
                    }
                } catch (err) {
                    console.error('Error checking lobby:', err);
                }
            } else {
                setActiveLobbyCode(null);
                setIsLeaderOfLobby(false);
            }
        };

        checkActiveLobby();
    }, [user]);

    const handleCreateGroup = async () => {
        if (!selectedBusiness || !user) return;

        setIsCreating(true);
        try {
            const response = await fetch(`${API_URL}/lobbies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    business_id: selectedBusiness.id,
                    leader_name: user.name,
                }),
            });

            if (!response.ok) {
                throw new Error('Kunne ikke opprette gruppe');
            }

            const data = await response.json();

            // Save to localStorage
            localStorage.setItem('groupie_active_lobby', data.lobby_code);
            localStorage.setItem('groupie_active_business_id', selectedBusiness.id);

            toast.success('Gruppe opprettet!');
            router.push(`/lobby/${data.lobby_code}`);
        } catch (err) {
            console.error('Feil ved opprettelse av gruppe:', err);
            toast.error('Kunne ikke opprette gruppe. Prøv igjen.');
        } finally {
            setIsCreating(false);
        }
    };

    // Attach or update business on an existing lobby
    const attachBusinessToLobby = async (businessId: string) => {
        if (!activeLobbyCode) return;

        // Note: No confirmation needed - button text clearly shows "🔄 Bytt"
        // and user can easily go back if they change their mind

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

            const newBusiness = MOCK_BUSINESSES.find(b => b.id === businessId);
            localStorage.setItem('groupie_active_business_id', businessId);
            toast.success(`Aktivitet oppdatert til ${newBusiness?.name}! 🎉`);
            router.push(`/lobby/${activeLobbyCode}`);
        } catch (err) {
            console.error('Error attaching business:', err);
            toast.error('Kunne ikke oppdatere aktivitet.');
        } finally {
            setIsCreating(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#FFFAF8] via-white to-[#CCFBF1]/30 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#FF6B5B] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FFFAF8] via-white to-[#CCFBF1]/30">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span className="font-medium">Tilbake</span>
                        </Link>

                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#FF6B5B] to-[#E85A4A] rounded-lg flex items-center justify-center">
                                <span className="text-sm">👥</span>
                            </div>
                            <span className="text-lg font-bold text-gray-900">Groupie</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* Title */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                        Start en gruppe 🎉
                    </h1>
                    <p className="text-gray-500">
                        Velg en aktivitet og inviter vennene dine
                    </p>
                </div>

                {/* Step 1: Select Business */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 bg-[#FF6B5B] text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                        Velg aktivitet
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {MOCK_BUSINESSES.map((business) => {
                            const isSelected = selectedBusiness?.id === business.id;
                            const savings = Math.round((1 - business.groupPrice / business.originalPrice) * 100);

                            return (
                                <button
                                    key={business.id}
                                    onClick={() => setSelectedBusiness(business)}
                                    className={`text-left p-4 rounded-2xl border-2 transition-all ${isSelected
                                        ? 'border-[#FF6B5B] bg-[#FF6B5B]/5 shadow-lg shadow-[#FF6B5B]/20'
                                        : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
                                        }`}
                                >
                                    <div className="flex gap-4">
                                        <img
                                            src={business.imageUrl}
                                            alt={business.name}
                                            className="w-24 h-24 rounded-xl object-cover"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs text-[#14B8A6] font-semibold bg-[#CCFBF1] px-2 py-0.5 rounded-full">
                                                    {business.category}
                                                </span>
                                                <span className="text-xs text-gray-400">📍 {business.location}</span>
                                            </div>
                                            <h3 className="font-semibold text-gray-900 mb-2">{business.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-bold text-[#FF6B5B]">{business.groupPrice} kr</span>
                                                <span className="text-sm text-gray-400 line-through">{business.originalPrice} kr</span>
                                                <span className="text-xs bg-[#FF6B5B] text-white px-2 py-0.5 rounded-full font-semibold">
                                                    -{savings}%
                                                </span>
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <div className="w-8 h-8 bg-[#FF6B5B] rounded-full flex items-center justify-center flex-shrink-0">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Step 2: Create Group */}
                {selectedBusiness && (
                    <div className="mb-8 animate-fade-in">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-[#14B8A6] text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                            Opprett gruppe
                        </h2>

                        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-lg">
                            <div className="flex items-center gap-4 mb-6">
                                <img
                                    src={selectedBusiness.imageUrl}
                                    alt={selectedBusiness.name}
                                    className="w-16 h-16 rounded-xl object-cover"
                                />
                                <div>
                                    <h3 className="font-semibold text-gray-900">{selectedBusiness.name}</h3>
                                    <p className="text-sm text-gray-500">{selectedBusiness.category} • {selectedBusiness.location}</p>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Gruppeleder</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-gradient-to-br from-[#14B8A6] to-[#0D9488] rounded-full flex items-center justify-center">
                                            <span className="text-white text-xs font-semibold">{user?.name.charAt(0)}</span>
                                        </div>
                                        <span className="font-semibold text-gray-900">{user?.name}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    if (isLeaderOfLobby && activeLobbyCode && selectedBusiness) {
                                        attachBusinessToLobby(selectedBusiness.id);
                                    } else {
                                        handleCreateGroup();
                                    }
                                }}
                                disabled={isCreating}
                                className={`w-full py-4 text-white rounded-xl font-semibold text-lg shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${isLeaderOfLobby && activeLobbyCode
                                    ? 'bg-gradient-to-r from-[#14B8A6] to-[#0D9488] hover:from-[#0D9488] hover:to-[#0F766E] shadow-[#14B8A6]/30'
                                    : 'bg-gradient-to-r from-[#FF6B5B] to-[#E85A4A] hover:from-[#E85A4A] hover:to-[#D64A3A] shadow-[#FF6B5B]/30'
                                    }`}
                            >
                                {isCreating ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        {isLeaderOfLobby ? 'Oppdaterer...' : 'Oppretter...'}
                                    </span>
                                ) : isLeaderOfLobby && activeLobbyCode ? (
                                    currentLobbyBusinessId && currentLobbyBusinessId !== selectedBusiness?.id
                                        ? '🔄 Bytt til denne aktiviteten'
                                        : '✓ Velg denne aktiviteten'
                                ) : (
                                    'Opprett gruppe og få kode →'
                                )}
                            </button>

                            <p className="text-xs text-gray-400 text-center mt-4">
                                Du vil få en unik kode som du kan dele med vennene dine
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
