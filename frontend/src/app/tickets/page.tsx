'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ConfirmedTicket from '@/components/ConfirmedTicket';
import BottomNav from '@/components/BottomNav';
// Business lookup moved to API - keep for future use
// import { getBusinessById } from '@/data/businesses';

// ============================================================================
// Typer
// ============================================================================

interface Ticket {
    id: string;
    lobbyCode: string;
    businessId: string;
    businessName: string;
    businessImage: string;
    date: string;
    time: string;
    groupSize: number;
    pricePerPerson: number;
    originalPrice: number;
    savings: number;
}

// ============================================================================
// Mock Data (vil bli erstattet med API-kall)
// ============================================================================

const MOCK_TICKETS: Ticket[] = [
    {
        id: '1',
        lobbyCode: 'ABC123',
        businessId: '1',
        businessName: 'Strike Zone Bowling',
        businessImage: 'https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=400&h=300&fit=crop',
        date: '2025-12-15',
        time: '18:00',
        groupSize: 6,
        pricePerPerson: 175,
        originalPrice: 250,
        savings: 75,
    },
    {
        id: '2',
        lobbyCode: 'XYZ789',
        businessId: '3',
        businessName: 'Velocity Go-Karting',
        businessImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
        date: '2025-12-20',
        time: '14:00',
        groupSize: 8,
        pricePerPerson: 400,
        originalPrice: 500,
        savings: 100,
    },
];

// ============================================================================
// Animated Counter Component
// ============================================================================

interface AnimatedCounterProps {
    value: number;
    duration?: number;
    suffix?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
    value,
    duration = 1500,
    suffix = ''
}) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        if (value === 0) {
            setDisplayValue(0);
            return;
        }

        const startTime = Date.now();
        const startValue = 0;

        const animate = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out cubic)
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(startValue + (value - startValue) * eased);

            setDisplayValue(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setDisplayValue(value);
            }
        };

        requestAnimationFrame(animate);
    }, [value, duration]);

    return (
        <span className="tabular-nums">
            {displayValue.toLocaleString('nb-NO')}{suffix}
        </span>
    );
};

// ============================================================================
// Calculate Lifetime Savings
// ============================================================================

const calculateLifetimeSavings = (tickets: Ticket[]): number => {
    return tickets.reduce((total, ticket) => {
        // (Standard_Price - Discounted_Price) * Group_Size
        const savingsPerPerson = ticket.originalPrice - ticket.pricePerPerson;
        const totalSavings = savingsPerPerson * ticket.groupSize;
        return total + totalSavings;
    }, 0);
};

// ============================================================================
// Ticket Card
// ============================================================================

interface TicketCardProps {
    ticket: Ticket;
    onClick: () => void;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket, onClick }) => {
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('nb-NO', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        });
    };

    return (
        <button
            onClick={onClick}
            className="w-full bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-lg shadow-gray-100/50 hover:shadow-xl transition-all text-left"
        >
            <div className="flex">
                {/* Image */}
                <div className="w-28 h-28 flex-shrink-0">
                    <img
                        src={ticket.businessImage}
                        alt={ticket.businessName}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Content */}
                <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-1">{ticket.businessName}</h3>
                            <p className="text-sm text-gray-500">
                                {formatDate(ticket.date)} • {ticket.time}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                {ticket.groupSize} personer
                            </p>
                        </div>

                        {/* Savings Badge */}
                        <div className="text-right">
                            <span className="text-xl font-bold text-[#14B8A6]">
                                -{ticket.savings} kr
                            </span>
                            <p className="text-xs text-[#14B8A6]">spart</p>
                        </div>
                    </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center pr-4">
                    <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>
        </button>
    );
};

// ============================================================================
// Empty State
// ============================================================================

const EmptyState: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-24 h-24 bg-[#FF6B5B]/10 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-[#FF6B5B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">Ingen billetter ennå</h2>
            <p className="text-gray-500 mb-8 max-w-xs">
                Finn en gruppeopplevelse og spar penger sammen med venner!
            </p>

            <Link href="/start">
                <button className="px-8 py-4 bg-gradient-to-r from-[#FF6B5B] to-[#E85A4A] hover:from-[#E85A4A] hover:to-[#D64A3A] text-white rounded-2xl font-semibold shadow-lg shadow-[#FF6B5B]/30 transition-all hover:shadow-xl hover:-translate-y-0.5">
                    Finn en gruppeopplevelse →
                </button>
            </Link>
        </div>
    );
};

// ============================================================================
// Main Page
// ============================================================================

export default function TicketsPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    // Fetch tickets (mock for now)
    useEffect(() => {
        if (isAuthenticated) {
            // TODO: Replace with actual API call
            // GET /api/bookings?user_id={userId}&status=CONFIRMED
            setTimeout(() => {
                // Sort by date (upcoming first)
                const sortedTickets = [...MOCK_TICKETS].sort(
                    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                );
                setTickets(sortedTickets);
                setIsLoading(false);
            }, 500);
        }
    }, [isAuthenticated]);

    // Loading state
    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#FFFAF8] via-white to-[#CCFBF1]/30 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#FF6B5B] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Show full ticket view
    if (selectedTicket) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#CCFBF1]/30 via-white to-[#FFFAF8] py-8">
                <header className="text-center mb-4 px-4">
                    <button
                        onClick={() => setSelectedTicket(null)}
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="font-medium">Tilbake til billetter</span>
                    </button>
                </header>

                <ConfirmedTicket
                    businessName={selectedTicket.businessName}
                    groupSize={selectedTicket.groupSize}
                    pricePerPerson={selectedTicket.pricePerPerson}
                    originalPrice={selectedTicket.originalPrice}
                    lobbyCode={selectedTicket.lobbyCode}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FFFAF8] via-white to-[#CCFBF1]/30 pb-24">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-lg mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">Mine Billetter</h1>

                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#FF6B5B] to-[#E85A4A] rounded-lg flex items-center justify-center shadow-lg shadow-[#FF6B5B]/20">
                                <span className="text-sm">👥</span>
                            </div>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-lg mx-auto px-4 py-6">
                {tickets.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="space-y-4">
                        {/* Lifetime Savings Card */}
                        <div className="bg-gradient-to-r from-[#14B8A6] to-[#0D9488] rounded-3xl p-6 text-white mb-6 shadow-xl shadow-[#14B8A6]/30">
                            <div className="text-center mb-4">
                                <p className="text-sm text-white/80 mb-1">🎉 Du har spart totalt</p>
                                <p className="text-5xl font-bold">
                                    <AnimatedCounter
                                        value={calculateLifetimeSavings(tickets)}
                                        duration={2000}
                                        suffix=" kr"
                                    />
                                </p>
                                <p className="text-sm text-white/80 mt-2">med Groupie!</p>
                            </div>

                            {/* Stats Row */}
                            <div className="flex justify-around pt-4 border-t border-white/20">
                                <div className="text-center">
                                    <p className="text-2xl font-bold">{tickets.length}</p>
                                    <p className="text-xs text-white/70">bookinger</p>
                                </div>
                                <div className="w-px bg-white/20" />
                                <div className="text-center">
                                    <p className="text-2xl font-bold">
                                        {tickets.reduce((sum, t) => sum + t.groupSize, 0)}
                                    </p>
                                    <p className="text-xs text-white/70">opplevelser delt</p>
                                </div>
                            </div>
                        </div>

                        {/* Upcoming Label */}
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                            Kommende opplevelser
                        </h2>

                        {/* Ticket Cards */}
                        {tickets.map((ticket) => (
                            <TicketCard
                                key={ticket.id}
                                ticket={ticket}
                                onClick={() => setSelectedTicket(ticket)}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    );
}
