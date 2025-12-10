'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import BottomNav from '@/components/BottomNav';
import { API_BASE_URL } from '@/config';

// ============================================================================
// Design Tokens
// ============================================================================

// Design tokens - available for future use
// const COLORS = {
//     coral: '#FF6B5B',
//     coralDark: '#E85A4A',
//     coralLight: '#FFE8E5',
//     teal: '#14B8A6',
//     tealDark: '#0D9488',
//     tealLight: '#CCFBF1',
//     warmWhite: '#FFFAF8',
//     warmGray: '#6B7280',
// };

// ============================================================================
// Typer
// ============================================================================

interface Category {
    id: string;
    name: string;
    emoji: string;
    count: number;
}

interface Deal {
    id: string;
    name: string;
    category: string;
    imageUrl: string;
    location: string;
    originalPrice: number;
    groupPrice: number;
    minGroup: number;
    activeGroups: number;
}

// ============================================================================
// Mock Data
// ============================================================================

const CATEGORIES: Category[] = [
    { id: 'restaurant', name: 'Restauranter', emoji: '🍽️', count: 24 },
    { id: 'bowling', name: 'Bowling', emoji: '🎳', count: 8 },
    { id: 'golf', name: 'Golf', emoji: '⛳', count: 12 },
    { id: 'karting', name: 'Gokart', emoji: '🏎️', count: 6 },
    { id: 'escape', name: 'Escape Room', emoji: '🔐', count: 15 },
    { id: 'spa', name: 'Spa & Velvære', emoji: '💆', count: 10 },
    { id: 'concert', name: 'Konserter', emoji: '🎵', count: 18 },
    { id: 'sports', name: 'Sport', emoji: '⚽', count: 22 },
];

const FEATURED_DEALS: Deal[] = [
    {
        id: '1',
        name: 'Velocity Go-Karting',
        category: 'Gokart',
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
        location: 'Oslo',
        originalPrice: 599,
        groupPrice: 399,
        minGroup: 4,
        activeGroups: 3,
    },
    {
        id: '2',
        name: 'Aker Brygge Seafood',
        category: 'Restaurant',
        imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
        location: 'Oslo',
        originalPrice: 450,
        groupPrice: 320,
        minGroup: 6,
        activeGroups: 5,
    },
    {
        id: '3',
        name: 'Bergen Golf Club',
        category: 'Golf',
        imageUrl: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=300&fit=crop',
        location: 'Bergen',
        originalPrice: 800,
        groupPrice: 550,
        minGroup: 4,
        activeGroups: 2,
    },
    {
        id: '4',
        name: 'Escape Room Oslo',
        category: 'Escape Room',
        imageUrl: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=300&fit=crop',
        location: 'Oslo',
        originalPrice: 350,
        groupPrice: 250,
        minGroup: 4,
        activeGroups: 7,
    },
    {
        id: '5',
        name: 'Stratos Bowling',
        category: 'Bowling',
        imageUrl: 'https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=400&h=300&fit=crop',
        location: 'Trondheim',
        originalPrice: 280,
        groupPrice: 180,
        minGroup: 4,
        activeGroups: 4,
    },
    {
        id: '6',
        name: 'Farris Bad Spa',
        category: 'Spa',
        imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop',
        location: 'Larvik',
        originalPrice: 950,
        groupPrice: 650,
        minGroup: 3,
        activeGroups: 2,
    },
];

// ============================================================================
// Komponenter
// ============================================================================

const Navbar: React.FC = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const router = useRouter();
    // Menu state - for future mobile menu implementation
    // const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeLobbyCode, setActiveLobbyCode] = useState<string | null>(null);
    const [isValidLobby, setIsValidLobby] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);

    // Check for active lobby in localStorage and validate with API
    useEffect(() => {
        setHasMounted(true);

        const validateLobby = async (code: string) => {
            try {
                const response = await fetch(`${API_BASE_URL}/lobbies/${code}`);
                if (!response.ok) {
                    // Lobby doesn't exist - silently clear localStorage
                    localStorage.removeItem('groupie_active_lobby');
                    localStorage.removeItem('groupie_active_business_id');
                    setActiveLobbyCode(null);
                    setIsValidLobby(false);
                    return false;
                }
                setIsValidLobby(true);
                return true;
            } catch {
                // Network error - keep the code but mark as unvalidated
                setIsValidLobby(false);
                return false;
            }
        };

        const checkActiveLobby = async () => {
            const savedLobby = localStorage.getItem('groupie_active_lobby');
            if (savedLobby) {
                setActiveLobbyCode(savedLobby);
                await validateLobby(savedLobby);
            } else {
                setActiveLobbyCode(null);
                setIsValidLobby(false);
            }
        };

        checkActiveLobby();

        // Poll every 5 seconds to catch updates (reduced frequency)
        const interval = setInterval(checkActiveLobby, 5000);

        // Also listen for storage events from other tabs
        window.addEventListener('storage', checkActiveLobby);

        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', checkActiveLobby);
        };
    }, []);

    return (
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B5B] to-[#E85A4A] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF6B5B]/20">
                            <span className="text-white text-xl">👥</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900">Groupie</span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        <Link href="#categories" className="text-gray-600 hover:text-gray-900 transition-colors">
                            Kategorier
                        </Link>
                        <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">
                            Hvordan det fungerer
                        </Link>
                        <Link href="/business-portal" className="text-gray-600 hover:text-gray-900 transition-colors">
                            For bedrifter
                        </Link>
                    </nav>

                    {/* CTA Buttons */}
                    <div className="flex items-center gap-3">
                        {isAuthenticated && user ? (
                            <div className="flex items-center gap-3">
                                <div className="hidden md:flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-[#14B8A6] to-[#0D9488] rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm font-semibold">{user.name.charAt(0)}</span>
                                    </div>
                                    <span className="text-sm text-gray-600">{user.name}</span>
                                </div>
                                <button
                                    onClick={logout}
                                    className="text-sm text-gray-500 hover:text-gray-900"
                                >
                                    Logg ut
                                </button>
                            </div>
                        ) : (
                            <Link href="/login">
                                <button className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium">
                                    Logg inn
                                </button>
                            </Link>
                        )}

                        {/* Show "Min gruppe" if user has VALID active lobby, otherwise show "Start en gruppe" */}
                        {hasMounted && activeLobbyCode && isValidLobby ? (
                            <Link href={`/lobby/${activeLobbyCode}`}>
                                <button className="relative px-5 py-2.5 bg-gradient-to-r from-[#14B8A6] to-[#0D9488] hover:from-[#0D9488] hover:to-[#0F766E] text-white rounded-xl font-semibold shadow-lg shadow-[#14B8A6]/25 transition-all hover:shadow-xl hover:shadow-[#14B8A6]/30 hover:-translate-y-0.5 flex items-center gap-2">
                                    {/* Green pulsing dot */}
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                    </span>
                                    Min gruppe →
                                </button>
                            </Link>
                        ) : (
                            <button
                                onClick={async () => {
                                    if (!isAuthenticated || !user) {
                                        router.push('/login');
                                        return;
                                    }

                                    try {
                                        const response = await fetch(`${API_BASE_URL}/lobbies`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ leader_name: user.name }),
                                        });

                                        if (!response.ok) throw new Error('Failed to create lobby');

                                        const data = await response.json();
                                        localStorage.setItem('groupie_active_lobby', data.lobby_code);
                                        router.push(`/lobby/${data.lobby_code}`);
                                    } catch (err) {
                                        console.error('Error creating lobby:', err);
                                    }
                                }}
                                className="px-5 py-2.5 bg-gradient-to-r from-[#FF6B5B] to-[#E85A4A] hover:from-[#E85A4A] hover:to-[#D64A3A] text-white rounded-xl font-semibold shadow-lg shadow-[#FF6B5B]/25 transition-all hover:shadow-xl hover:shadow-[#FF6B5B]/30 hover:-translate-y-0.5"
                            >
                                Start en gruppe
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

const HeroSection: React.FC = () => (
    <section className="relative bg-gradient-to-br from-[#FFFAF8] via-white to-[#CCFBF1]/30 pt-16 pb-24 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-[#FF6B5B]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#14B8A6]/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFE8E5] rounded-full mb-6">
                    <span className="text-[#FF6B5B] text-sm font-semibold">🎉 Nytt</span>
                    <span className="text-gray-600 text-sm">Over 500 bedrifter nå tilgjengelig</span>
                </div>

                {/* Headline */}
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                    Spar mer når du
                    <span className="bg-gradient-to-r from-[#FF6B5B] to-[#14B8A6] bg-clip-text text-transparent"> opplever sammen</span>
                </h1>

                {/* Subheadline */}
                <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                    Finn venner, få grupperabatter, og oppdag fantastiske opplevelser.
                    Jo flere som blir med, jo mer sparer alle!
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/start">
                        <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#FF6B5B] to-[#E85A4A] hover:from-[#E85A4A] hover:to-[#D64A3A] text-white text-lg rounded-2xl font-semibold shadow-xl shadow-[#FF6B5B]/30 transition-all hover:shadow-2xl hover:shadow-[#FF6B5B]/40 hover:-translate-y-1">
                            Finn en opplevelse →
                        </button>
                    </Link>
                    <Link href="#how-it-works">
                        <button className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-gray-200 hover:border-[#14B8A6] text-gray-700 hover:text-[#14B8A6] text-lg rounded-2xl font-semibold transition-all">
                            Hvordan fungerer det?
                        </button>
                    </Link>
                </div>

                {/* Social Proof */}
                <div className="flex items-center justify-center gap-8 mt-12 pt-8 border-t border-gray-100">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-gray-900">12,000+</p>
                        <p className="text-sm text-gray-500">Fornøyde brukere</p>
                    </div>
                    <div className="w-px h-12 bg-gray-200" />
                    <div className="text-center">
                        <p className="text-3xl font-bold text-gray-900">500+</p>
                        <p className="text-sm text-gray-500">Partnerbedrifter</p>
                    </div>
                    <div className="w-px h-12 bg-gray-200" />
                    <div className="text-center">
                        <p className="text-3xl font-bold text-[#FF6B5B]">2.3M kr</p>
                        <p className="text-sm text-gray-500">Spart i 2024</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const CategorySection: React.FC = () => (
    <section id="categories" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    Utforsk kategorier
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Fra romantiske middager til adrenalin-opplevelser – finn din neste gruppeavtale
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {CATEGORIES.map((category) => (
                    <Link key={category.id} href={`/category/${category.id}`}>
                        <div className="group p-6 bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl hover:border-[#FF6B5B]/30 hover:shadow-xl hover:shadow-[#FF6B5B]/10 transition-all cursor-pointer hover:-translate-y-1">
                            <span className="text-4xl mb-3 block">{category.emoji}</span>
                            <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                            <p className="text-sm text-gray-500">{category.count} tilbud</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    </section>
);

const FeaturedDeals: React.FC = () => (
    <section className="py-20 bg-gradient-to-b from-white to-[#FFFAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-12">
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Populære tilbud 🔥
                    </h2>
                    <p className="text-gray-600">
                        Opplevelser med aktive grupper du kan bli med i nå
                    </p>
                </div>
                <Link href="/deals" className="hidden md:block text-[#FF6B5B] font-semibold hover:underline">
                    Se alle tilbud →
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {FEATURED_DEALS.map((deal) => {
                    const savings = Math.round((1 - deal.groupPrice / deal.originalPrice) * 100);

                    return (
                        <Link key={deal.id} href={`/business/${deal.id}`}>
                            <div className="group bg-white rounded-3xl overflow-hidden border border-gray-100 hover:shadow-2xl hover:shadow-[#FF6B5B]/10 transition-all hover:-translate-y-2">
                                {/* Image */}
                                <div className="relative h-48 overflow-hidden">
                                    <img
                                        src={deal.imageUrl}
                                        alt={deal.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    {/* Savings Badge */}
                                    <div className="absolute top-4 left-4 px-3 py-1 bg-[#FF6B5B] text-white text-sm font-bold rounded-full">
                                        Spar {savings}%
                                    </div>
                                    {/* Active Groups */}
                                    {deal.activeGroups > 0 && (
                                        <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur rounded-full flex items-center gap-2">
                                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                            <span className="text-sm font-medium text-gray-700">
                                                {deal.activeGroups} aktive grupper
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs text-[#14B8A6] font-semibold bg-[#CCFBF1] px-2 py-0.5 rounded-full">
                                            {deal.category}
                                        </span>
                                        <span className="text-xs text-gray-400">📍 {deal.location}</span>
                                    </div>

                                    <h3 className="font-bold text-lg text-gray-900 mb-3">{deal.name}</h3>

                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-sm text-gray-400 line-through">{deal.originalPrice} kr</p>
                                            <p className="text-2xl font-bold text-[#FF6B5B]">{deal.groupPrice} kr</p>
                                            <p className="text-xs text-gray-500">per person ({deal.minGroup}+ pers)</p>
                                        </div>
                                        <button className="px-4 py-2 bg-gradient-to-r from-[#14B8A6] to-[#0D9488] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-[#14B8A6]/30 transition-all">
                                            Bli med →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            <div className="text-center mt-10 md:hidden">
                <Link href="/deals" className="text-[#FF6B5B] font-semibold hover:underline">
                    Se alle tilbud →
                </Link>
            </div>
        </div>
    </section>
);

const HowItWorks: React.FC = () => (
    <section id="how-it-works" className="py-20 bg-gradient-to-br from-[#14B8A6] to-[#0D9488] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Hvordan det fungerer
                </h2>
                <p className="text-teal-100 max-w-2xl mx-auto">
                    Tre enkle steg til grupperabatt
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    {
                        step: '01',
                        title: 'Finn en opplevelse',
                        description: 'Bla gjennom hundrevis av aktiviteter og restauranter med grupperabatter.',
                        icon: '🔍',
                    },
                    {
                        step: '02',
                        title: 'Start eller bli med',
                        description: 'Opprett din egen gruppe eller bli med i en eksisterende. Del koden med venner!',
                        icon: '👥',
                    },
                    {
                        step: '03',
                        title: 'Spar penger',
                        description: 'Når gruppen fyller opp, låses prisen og alle sparer. Enkelt og greit!',
                        icon: '💰',
                    },
                ].map((item, index) => (
                    <div key={index} className="relative">
                        {/* Connector Line */}
                        {index < 2 && (
                            <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-teal-400/30" />
                        )}

                        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 text-center hover:bg-white/20 transition-all">
                            <div className="w-16 h-16 bg-white text-[#14B8A6] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-xl">
                                {item.icon}
                            </div>
                            <span className="text-xs font-bold text-teal-200 tracking-wider">STEG {item.step}</span>
                            <h3 className="text-xl font-bold mt-2 mb-3">{item.title}</h3>
                            <p className="text-teal-100">{item.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

const BusinessCTA: React.FC = () => (
    <section className="py-20 bg-[#FFFAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2rem] p-8 md:p-12 lg:p-16 text-white overflow-hidden relative">
                {/* Decorative */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF6B5B]/20 rounded-full blur-3xl" />

                <div className="relative z-10 max-w-3xl">
                    <span className="inline-block px-4 py-1 bg-[#FF6B5B] text-white text-sm font-semibold rounded-full mb-6">
                        For bedrifter
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                        Fyll ledige plasser med grupperabatter
                    </h2>
                    <p className="text-gray-300 text-lg mb-8 max-w-2xl">
                        Bli partner og tilby dynamiske rabatter. Optimaliser kapasiteten din,
                        tiltrekk nye kunder, og øk inntektene på rolige dager.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link href="/business-portal">
                            <button className="px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-all">
                                Bli partner →
                            </button>
                        </Link>
                        <button className="px-8 py-4 border border-gray-600 text-white rounded-xl font-semibold hover:bg-white/10 transition-all">
                            Lær mer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const Footer: React.FC = () => (
    <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                <div className="col-span-2 md:col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B5B] to-[#E85A4A] rounded-xl flex items-center justify-center">
                            <span className="text-white text-xl">👥</span>
                        </div>
                        <span className="text-xl font-bold">Groupie</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                        Spar mer når du opplever sammen. Grupperabatter for alle.
                    </p>
                </div>

                <div>
                    <h4 className="font-semibold mb-4">Produkt</h4>
                    <ul className="space-y-2 text-gray-400 text-sm">
                        <li><Link href="/deals" className="hover:text-white">Tilbud</Link></li>
                        <li><Link href="/categories" className="hover:text-white">Kategorier</Link></li>
                        <li><Link href="/how-it-works" className="hover:text-white">Hvordan det fungerer</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold mb-4">Bedrifter</h4>
                    <ul className="space-y-2 text-gray-400 text-sm">
                        <li><Link href="/business-portal" className="hover:text-white">Bli partner</Link></li>
                        <li><Link href="/pricing" className="hover:text-white">Priser</Link></li>
                        <li><Link href="/resources" className="hover:text-white">Ressurser</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-semibold mb-4">Selskap</h4>
                    <ul className="space-y-2 text-gray-400 text-sm">
                        <li><Link href="/about" className="hover:text-white">Om oss</Link></li>
                        <li><Link href="/contact" className="hover:text-white">Kontakt</Link></li>
                        <li><Link href="/privacy" className="hover:text-white">Personvern</Link></li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-gray-500 text-sm">
                    © 2025 Groupie. Alle rettigheter reservert.
                </p>
                <div className="flex gap-4">
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                        <span className="sr-only">Instagram</span>
                        📸
                    </a>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                        <span className="sr-only">Twitter</span>
                        🐦
                    </a>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                        <span className="sr-only">LinkedIn</span>
                        💼
                    </a>
                </div>
            </div>
        </div>
    </footer>
);

// ============================================================================
// Hovedkomponent
// ============================================================================

const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-white font-sans">
            <Navbar />
            <HeroSection />
            <CategorySection />
            <FeaturedDeals />
            <HowItWorks />
            <BusinessCTA />
            <Footer />
            <BottomNav />
        </div>
    );
};

export default LandingPage;
