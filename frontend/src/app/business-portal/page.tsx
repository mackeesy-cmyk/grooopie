'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// ============================================================================
// Typer
// ============================================================================

interface DiscountRule {
    id: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    minGroupSize: number;
    discountPercent: number;
}

interface Booking {
    id: string;
    date: string;
    time: string;
    groupName: string;
    groupSize: number;
    status: 'confirmed' | 'pending';
}

// ============================================================================
// Konstanter
// ============================================================================

const DAYS_OF_WEEK = [
    { value: 'monday', label: 'Mandag' },
    { value: 'tuesday', label: 'Tirsdag' },
    { value: 'wednesday', label: 'Onsdag' },
    { value: 'thursday', label: 'Torsdag' },
    { value: 'friday', label: 'Fredag' },
    { value: 'saturday', label: 'Lørdag' },
    { value: 'sunday', label: 'Søndag' },
];

const DAY_LABELS: Record<string, string> = {
    monday: 'Mandag',
    tuesday: 'Tirsdag',
    wednesday: 'Onsdag',
    thursday: 'Torsdag',
    friday: 'Fredag',
    saturday: 'Lørdag',
    sunday: 'Søndag',
};

const MOCK_BOOKINGS: Booking[] = [
    { id: '1', date: '2025-12-09', time: '18:00', groupName: 'Olas Bursdag', groupSize: 6, status: 'confirmed' },
    { id: '2', date: '2025-12-10', time: '19:30', groupName: 'Firmafest AS', groupSize: 8, status: 'confirmed' },
    { id: '3', date: '2025-12-11', time: '17:00', groupName: 'Vennegruppen', groupSize: 4, status: 'pending' },
    { id: '4', date: '2025-12-12', time: '20:00', groupName: 'Juleavslutning', groupSize: 10, status: 'confirmed' },
    { id: '5', date: '2025-12-13', time: '16:00', groupName: 'Studentgjengen', groupSize: 5, status: 'pending' },
];

// ============================================================================
// Kalender-komponent
// ============================================================================

const BookingCalendar: React.FC<{ bookings: Booking[] }> = ({ bookings }) => {
    const days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        return {
            date: date.toISOString().split('T')[0],
            dayName: date.toLocaleDateString('nb-NO', { weekday: 'short' }),
            dayNum: date.getDate(),
        };
    });

    return (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-lg shadow-gray-100/50">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">📅</span> Kommende Bookinger
            </h2>

            {/* Ukevisning */}
            <div className="grid grid-cols-7 gap-2 mb-6">
                {days.map((day) => (
                    <div
                        key={day.date}
                        className="text-center p-3 rounded-xl bg-gradient-to-b from-gray-50 to-white border border-gray-100"
                    >
                        <p className="text-xs text-gray-500 uppercase font-medium">{day.dayName}</p>
                        <p className="text-lg font-bold text-gray-900">{day.dayNum}</p>
                        <p className="text-xs text-[#14B8A6] font-semibold mt-1">
                            {bookings.filter(b => b.date === day.date).length || '—'}
                        </p>
                    </div>
                ))}
            </div>

            {/* Booking-liste */}
            <div className="space-y-3">
                {bookings.map((booking) => (
                    <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 hover:shadow-md transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className="text-center bg-[#14B8A6]/10 px-3 py-2 rounded-xl">
                                <p className="text-sm font-bold text-[#14B8A6]">{booking.time}</p>
                                <p className="text-xs text-gray-400">
                                    {new Date(booking.date).toLocaleDateString('nb-NO', {
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">{booking.groupName}</p>
                                <p className="text-sm text-gray-500">{booking.groupSize} personer</p>
                            </div>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-xs font-semibold ${booking.status === 'confirmed'
                                ? 'bg-[#14B8A6]/10 text-[#14B8A6]'
                                : 'bg-[#FF6B5B]/10 text-[#FF6B5B]'
                            }`}>
                            {booking.status === 'confirmed' ? '✓ Bekreftet' : '⏳ Venter'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ============================================================================
// Yield Manager-komponent
// ============================================================================

interface YieldManagerProps {
    rules: DiscountRule[];
    onAddRule: (rule: Omit<DiscountRule, 'id'>) => void;
    onDeleteRule: (id: string) => void;
}

const YieldManager: React.FC<YieldManagerProps> = ({ rules, onAddRule, onDeleteRule }) => {
    const [dayOfWeek, setDayOfWeek] = useState('monday');
    const [startTime, setStartTime] = useState('18:00');
    const [endTime, setEndTime] = useState('21:00');
    const [minGroupSize, setMinGroupSize] = useState(4);
    const [discountPercent, setDiscountPercent] = useState(20);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddRule({
            dayOfWeek,
            startTime,
            endTime,
            minGroupSize,
            discountPercent,
        });
        setMinGroupSize(4);
        setDiscountPercent(20);
    };

    return (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-lg shadow-gray-100/50">
            <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Yield Manager
            </h2>
            <p className="text-gray-500 text-sm mb-6">
                Opprett dynamiske rabatter basert på tid og gruppestørrelse
            </p>

            {/* Skjema */}
            <form onSubmit={handleSubmit} className="space-y-4 mb-8">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Dag</label>
                        <select
                            value={dayOfWeek}
                            onChange={(e) => setDayOfWeek(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/20"
                        >
                            {DAYS_OF_WEEK.map((day) => (
                                <option key={day.value} value={day.value}>{day.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Min. gruppe</label>
                        <input
                            type="number"
                            min="2"
                            max="20"
                            value={minGroupSize}
                            onChange={(e) => setMinGroupSize(parseInt(e.target.value))}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/20"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Fra</label>
                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/20"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Til</label>
                        <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/20"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Rabatt %</label>
                        <input
                            type="number"
                            min="5"
                            max="50"
                            step="5"
                            value={discountPercent}
                            onChange={(e) => setDiscountPercent(parseInt(e.target.value))}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/20"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-[#14B8A6] to-[#0D9488] hover:from-[#0D9488] hover:to-[#0F766E] text-white rounded-xl font-semibold shadow-lg shadow-[#14B8A6]/30 transition-all hover:shadow-xl hover:-translate-y-0.5"
                >
                    Legg til Rabattregel →
                </button>
            </form>

            {/* Aktive regler */}
            <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Aktive Regler</h3>
                {rules.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-6">Ingen regler opprettet ennå</p>
                ) : (
                    <div className="space-y-2">
                        {rules.map((rule) => (
                            <div
                                key={rule.id}
                                className="flex items-center justify-between p-4 bg-gradient-to-r from-[#FF6B5B] to-[#E85A4A] rounded-2xl text-white"
                            >
                                <div>
                                    <p className="font-semibold">
                                        {DAY_LABELS[rule.dayOfWeek]} {rule.startTime}-{rule.endTime}
                                    </p>
                                    <p className="text-sm text-white/80">
                                        {rule.minGroupSize}+ personer får {rule.discountPercent}% rabatt
                                    </p>
                                </div>
                                <button
                                    onClick={() => onDeleteRule(rule.id)}
                                    className="p-2 text-white/60 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================================================
// Hovedside
// ============================================================================

export default function BusinessPortalPage() {
    const [rules, setRules] = useState<DiscountRule[]>([
        {
            id: '1',
            dayOfWeek: 'tuesday',
            startTime: '18:00',
            endTime: '21:00',
            minGroupSize: 4,
            discountPercent: 20,
        },
        {
            id: '2',
            dayOfWeek: 'wednesday',
            startTime: '16:00',
            endTime: '19:00',
            minGroupSize: 6,
            discountPercent: 30,
        },
    ]);

    const handleAddRule = (rule: Omit<DiscountRule, 'id'>) => {
        const newRule: DiscountRule = {
            ...rule,
            id: `rule_${Date.now()}`,
        };
        setRules([...rules, newRule]);
    };

    const handleDeleteRule = (id: string) => {
        setRules(rules.filter(r => r.id !== id));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FFFAF8] via-white to-[#CCFBF1]/20">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B5B] to-[#E85A4A] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF6B5B]/20">
                                    <span className="text-xl">👥</span>
                                </div>
                                <span className="text-xl font-bold text-gray-900">Groupie</span>
                            </Link>
                            <span className="px-3 py-1 bg-[#14B8A6]/10 text-[#14B8A6] text-sm font-semibold rounded-full">
                                Bedriftsportal
                            </span>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500">Velocity Go-Karting</span>
                            <div className="w-10 h-10 bg-gradient-to-br from-[#14B8A6] to-[#0D9488] rounded-full flex items-center justify-center shadow-lg">
                                <span className="text-white font-bold">V</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hovedinnhold */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {/* Statistikk */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Bookinger denne uken', value: '12', icon: '📅', color: 'coral' },
                        { label: 'Gjennomsnittlig gruppe', value: '5.4', icon: '👥', color: 'teal' },
                        { label: 'Inntekt denne uken', value: '24 500 kr', icon: '💰', color: 'coral' },
                        { label: 'Aktive rabattregler', value: rules.length.toString(), icon: '⚡', color: 'teal' },
                    ].map((stat, index) => (
                        <div
                            key={index}
                            className={`bg-white rounded-2xl border border-gray-100 p-6 shadow-lg ${stat.color === 'coral' ? 'shadow-[#FF6B5B]/10' : 'shadow-[#14B8A6]/10'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-gray-500">{stat.label}</p>
                                <span className="text-2xl">{stat.icon}</span>
                            </div>
                            <p className={`text-3xl font-bold ${stat.color === 'coral' ? 'text-[#FF6B5B]' : 'text-[#14B8A6]'
                                }`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* To-kolonne layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <BookingCalendar bookings={MOCK_BOOKINGS} />
                    <YieldManager
                        rules={rules}
                        onAddRule={handleAddRule}
                        onDeleteRule={handleDeleteRule}
                    />
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-100 mt-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                    <p className="text-sm text-gray-400 text-center">
                        © 2025 Groupie Bedriftsportal
                    </p>
                </div>
            </footer>
        </div>
    );
}
