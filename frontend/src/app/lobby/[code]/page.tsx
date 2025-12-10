'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ConfirmedTicket from '@/components/ConfirmedTicket';
import ShareButton from '@/components/ShareButton';
import { toast } from 'sonner';
import { usePolling } from '@/hooks/usePolling';
import { useAuth } from '@/context/AuthContext';
import { getBusinessById } from '@/data/businesses';

// ============================================================================
// Typer
// ============================================================================

interface MemberInfo {
    user_name: string;
    is_ready: boolean;
}

interface LobbyData {
    lobby_id: string;
    lobby_code: string;
    business_id: string;
    leader_name: string;
    status: string;
    member_count: number;
    members: MemberInfo[];
    created_at: string;
    expires_at: string;
}

// ============================================================================
// Konstanter
// ============================================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const POLL_INTERVAL_MS = 3000;

const DISCOUNT_TIERS = [
    { size: 2, discount: 0, label: 'Standard' },
    { size: 4, discount: 20, label: '20% rabatt' },
    { size: 6, discount: 30, label: '30% rabatt' },
    { size: 8, discount: 40, label: 'Beste pris!' },
];

// ============================================================================
// Countdown Timer
// ============================================================================

interface CountdownTimerProps {
    expiresAt: string;
    onExpired?: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ expiresAt, onExpired }) => {
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!expiresAt) return;

        const calculateRemaining = () => {
            const expires = new Date(expiresAt).getTime();
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((expires - now) / 1000));

            setTimeRemaining(remaining);

            if (remaining === 0 && !isExpired) {
                setIsExpired(true);
                onExpired?.();
            }
        };

        calculateRemaining();
        const interval = setInterval(calculateRemaining, 1000);
        return () => clearInterval(interval);
    }, [expiresAt, isExpired, onExpired]);

    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const isUrgent = timeRemaining < 300;

    if (isExpired) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-100 border border-red-200 rounded-xl">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-red-600">Utløpt</span>
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${isUrgent
            ? 'bg-[#FF6B5B]/10 border-[#FF6B5B]/20'
            : 'bg-white border-gray-200'
            }`}>
            <svg className={`w-4 h-4 ${isUrgent ? 'text-[#FF6B5B]' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`text-sm font-mono font-bold ${isUrgent ? 'text-[#FF6B5B]' : 'text-gray-700'}`}>
                {formattedTime}
            </span>
        </div>
    );
};

// ============================================================================
// Share Card
// ============================================================================

const ShareCard: React.FC<{ code: string }> = ({ code }) => {
    const [copied, setCopied] = useState(false);

    const shareUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/lobby/${code}`
        : '';

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast.success('Lenke kopiert!');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Kunne ikke kopiere:', err);
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center shadow-lg shadow-gray-100/50">
            <p className="text-gray-400 text-sm uppercase tracking-wider mb-3 font-medium">Lobbykode</p>

            <div className="text-5xl md:text-6xl font-mono font-bold bg-gradient-to-r from-[#FF6B5B] to-[#14B8A6] bg-clip-text text-transparent tracking-widest mb-4">
                {code}
            </div>

            <p className="text-gray-500 text-sm mb-6">
                Del denne koden med vennene dine!
            </p>

            <button
                onClick={handleCopy}
                className={`w-full py-4 rounded-2xl font-semibold transition-all duration-200 ${copied
                    ? 'bg-[#14B8A6] text-white'
                    : 'bg-gradient-to-r from-[#FF6B5B] to-[#E85A4A] hover:from-[#E85A4A] hover:to-[#D64A3A] text-white shadow-lg shadow-[#FF6B5B]/30 hover:shadow-xl hover:-translate-y-0.5'
                    }`}
            >
                {copied ? '✓ Kopiert!' : '📋 Kopier Invitasjonslenke'}
            </button>
        </div>
    );
};

// ============================================================================
// Member List
// ============================================================================

interface MemberListProps {
    members: MemberInfo[];
    leaderName: string;
    currentUserName: string;
    lobbyCode: string;
    lobbyStatus: string;
    onReadyToggle: () => void;
}

const MemberList: React.FC<MemberListProps> = ({
    members,
    leaderName,
    currentUserName,
    lobbyCode,
    lobbyStatus,
    onReadyToggle
}) => {
    const [isToggling, setIsToggling] = useState(false);

    const handleReadyToggle = async () => {
        if (isToggling || lobbyStatus !== 'OPEN') return;

        setIsToggling(true);
        try {
            const response = await fetch(`${API_URL}/lobbies/${lobbyCode}/ready`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_name: currentUserName }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.all_ready) {
                    toast.success('Alle er klare! Gruppen låses...', { duration: 3000 });
                } else {
                    toast.success('Du er nå markert som klar!', { duration: 2000 });
                }
                onReadyToggle();
            }
        } catch (err) {
            console.error('Feil ved ready toggle:', err);
            toast.error('Kunne ikke oppdatere status');
        } finally {
            setIsToggling(false);
        }
    };

    const readyCount = members.filter(m => m.is_ready).length;

    return (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-lg shadow-gray-100/50">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="text-2xl">👥</span> Medlemmer
                </h2>
                <span className="px-3 py-1 bg-[#14B8A6]/10 text-[#14B8A6] text-sm font-semibold rounded-full">
                    {readyCount}/{members.length} klare
                </span>
            </div>

            <div className="space-y-3">
                {members.map((member, index) => {
                    const isCurrentUser = member.user_name === currentUserName;
                    const isReady = member.is_ready;

                    return (
                        <div
                            key={index}
                            className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${isReady
                                ? 'bg-gradient-to-r from-[#14B8A6]/10 to-[#CCFBF1]/30 border border-[#14B8A6]/20'
                                : 'bg-gray-50'
                                }`}
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${isReady
                                ? 'bg-gradient-to-br from-[#14B8A6] to-[#0D9488] shadow-[#14B8A6]/30'
                                : 'bg-gradient-to-br from-gray-700 to-gray-900 shadow-gray-500/30'
                                }`}>
                                <span className="text-white text-lg font-semibold">
                                    {member.user_name.charAt(0).toUpperCase()}
                                </span>
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900">{member.user_name}</span>
                                    {member.user_name === leaderName && (
                                        <span className="px-2 py-0.5 bg-[#FF6B5B] text-white text-xs font-semibold rounded-full">
                                            Arrangør
                                        </span>
                                    )}
                                    {isCurrentUser && (
                                        <span className="text-xs text-gray-400">(deg)</span>
                                    )}
                                </div>
                                <p className={`text-sm ${isReady ? 'text-[#14B8A6]' : 'text-gray-400'}`}>
                                    {isReady ? '✓ Klar' : 'Venter...'}
                                </p>
                            </div>

                            {isCurrentUser && lobbyStatus === 'OPEN' && !isReady && (
                                <button
                                    onClick={handleReadyToggle}
                                    disabled={isToggling}
                                    className="px-5 py-2.5 bg-gradient-to-r from-[#14B8A6] to-[#0D9488] hover:from-[#0D9488] hover:to-[#0F766E] text-white rounded-xl font-semibold text-sm shadow-lg shadow-[#14B8A6]/30 transition-all hover:shadow-xl hover:-translate-y-0.5"
                                >
                                    {isToggling ? '...' : 'Klar!'}
                                </button>
                            )}

                            {(!isCurrentUser || isReady) && (
                                isReady ? (
                                    <div className="w-8 h-8 bg-[#14B8A6] rounded-full flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                ) : (
                                    <div className="w-8 h-8 rounded-full border-2 border-gray-200" />
                                )
                            )}
                        </div>
                    );
                })}
            </div>

            {lobbyStatus === 'OPEN' && (
                <p className="text-xs text-gray-400 mt-4 text-center">
                    Når alle er klare, låses gruppen automatisk
                </p>
            )}
        </div>
    );
};

// ============================================================================
// Progress Bar
// ============================================================================

const ProgressBar: React.FC<{ currentCount: number }> = ({ currentCount }) => {
    const currentTier = DISCOUNT_TIERS.filter(t => currentCount >= t.size).pop() || DISCOUNT_TIERS[0];
    const nextTier = DISCOUNT_TIERS.find(t => t.size > currentCount);
    const maxSize = DISCOUNT_TIERS[DISCOUNT_TIERS.length - 1].size;
    const progress = Math.min((currentCount / maxSize) * 100, 100);

    return (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-lg shadow-gray-100/50">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Grupperabatt</h2>
                    <p className="text-gray-500 text-sm">Jo flere, jo billigere!</p>
                </div>
                <div className="text-right">
                    <span className="text-3xl font-bold text-[#FF6B5B]">{currentTier.discount}%</span>
                    <p className="text-sm text-gray-400">rabatt</p>
                </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-[#FF6B5B] to-[#14B8A6] rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Tier markers */}
            <div className="flex justify-between">
                {DISCOUNT_TIERS.map((tier, index) => {
                    const isActive = currentCount >= tier.size;
                    const isCurrent = tier.size === currentTier.size;

                    return (
                        <div key={index} className="text-center">
                            <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-1 ${isActive
                                ? 'bg-gradient-to-br from-[#14B8A6] to-[#0D9488] text-white shadow-lg shadow-[#14B8A6]/30'
                                : 'bg-gray-100 text-gray-400'
                                }`}>
                                <span className="text-xs font-bold">{tier.size}</span>
                            </div>
                            <p className={`text-xs font-semibold ${isCurrent ? 'text-[#FF6B5B]' : isActive ? 'text-[#14B8A6]' : 'text-gray-400'
                                }`}>
                                {tier.discount}%
                            </p>
                        </div>
                    );
                })}
            </div>

            {nextTier && (
                <div className="mt-4 p-3 bg-[#FF6B5B]/10 rounded-xl text-center">
                    <p className="text-sm text-[#E85A4A]">
                        <span className="font-semibold">{nextTier.size - currentCount}</span> mer til {nextTier.discount}% rabatt!
                    </p>
                </div>
            )}
        </div>
    );
};

// ============================================================================
// Join Gate Component
// ============================================================================

interface JoinGateProps {
    lobbyCode: string;
    leaderName?: string;
    businessName?: string;
    onJoinSuccess: (userName: string) => void;
    isLoggedIn: boolean;
    userName?: string;
}

const JoinGate: React.FC<JoinGateProps> = ({
    lobbyCode,
    leaderName,
    businessName,
    onJoinSuccess,
    isLoggedIn,
    userName,
}) => {
    const [displayName, setDisplayName] = useState(userName || '');
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { login } = useAuth();

    const handleJoin = async () => {
        const name = displayName.trim();
        if (!name) {
            setError('Vennligst skriv inn et navn');
            return;
        }

        setIsJoining(true);
        setError(null);

        try {
            // If not logged in, create a session first
            if (!isLoggedIn) {
                login(name);
            }

            // Join the lobby via API
            const response = await fetch(`${API_URL}/lobbies/${lobbyCode}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_name: name }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Kunne ikke bli med i gruppen');
            }

            toast.success('Du er nå med i gruppen! 🎉');
            onJoinSuccess(name);
        } catch (err) {
            console.error('Feil ved joining:', err);
            setError((err as Error).message || 'Kunne ikke bli med i gruppen');
            toast.error('Kunne ikke bli med');
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FFFAF8] via-white to-[#CCFBF1]/30 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#FF6B5B] to-[#E85A4A] rounded-2xl flex items-center justify-center shadow-xl shadow-[#FF6B5B]/30 mx-auto mb-4">
                        <span className="text-3xl">👥</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Groupie</h1>
                </div>

                {/* Join Card */}
                <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xl">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Bli med i gruppen!
                        </h2>
                        {leaderName && (
                            <p className="text-gray-500">
                                <span className="font-semibold text-[#FF6B5B]">{leaderName}</span> har invitert deg
                            </p>
                        )}
                        {businessName && (
                            <p className="text-sm text-gray-400 mt-1">
                                {businessName}
                            </p>
                        )}
                    </div>

                    {/* Lobby Code Display */}
                    <div className="bg-gray-50 rounded-2xl p-4 text-center mb-6">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Lobbykode</p>
                        <p className="text-2xl font-mono font-bold bg-gradient-to-r from-[#FF6B5B] to-[#14B8A6] bg-clip-text text-transparent tracking-widest">
                            {lobbyCode}
                        </p>
                    </div>

                    {/* Name Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Ditt navn
                        </label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                            placeholder="Skriv inn navnet ditt..."
                            className="w-full px-4 py-4 rounded-2xl border-2 border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-[#FF6B5B] focus:outline-none transition-colors text-lg"
                            disabled={isJoining}
                            autoFocus
                        />
                        {error && (
                            <p className="text-red-500 text-sm mt-2">{error}</p>
                        )}
                    </div>

                    {/* Join Button */}
                    <button
                        onClick={handleJoin}
                        disabled={isJoining || !displayName.trim()}
                        className="w-full py-4 bg-gradient-to-r from-[#FF6B5B] to-[#E85A4A] hover:from-[#E85A4A] hover:to-[#D64A3A] text-white rounded-2xl font-semibold text-lg shadow-lg shadow-[#FF6B5B]/30 transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {isJoining ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Blir med...
                            </>
                        ) : (
                            <>
                                <span>🚀</span>
                                Bli med i gruppen
                            </>
                        )}
                    </button>
                </div>

                {/* Back Link */}
                <div className="text-center mt-6">
                    <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors text-sm">
                        ← Tilbake til forsiden
                    </Link>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// Main Lobby Page
// ============================================================================

export default function LobbyPage() {
    const params = useParams();
    const router = useRouter();
    const { user, logout, isAuthenticated } = useAuth();
    const lobbyCode = (params.code as string)?.toUpperCase();

    const [lobby, setLobby] = useState<LobbyData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasJoined, setHasJoined] = useState(false);
    const prevMemberCountRef = useRef<number>(0);
    const prevStatusRef = useRef<string>('');

    const fetchLobbyData = useCallback(async () => {
        if (!lobbyCode) return;

        try {
            const response = await fetch(`${API_URL}/lobbies/${lobbyCode}`);

            if (!response.ok) {
                if (response.status === 404) {
                    setError('Lobbyen ble ikke funnet.');
                } else {
                    throw new Error('Kunne ikke hente lobby-data');
                }
                return;
            }

            const data = await response.json();

            if (prevMemberCountRef.current > 0 && data.member_count > prevMemberCountRef.current) {
                const newMemberName = data.members[data.members.length - 1]?.user_name;
                const currentTier = DISCOUNT_TIERS.filter(t => data.member_count >= t.size).pop();
                const discount = currentTier?.discount || 0;

                toast.success(
                    `🎉 ${newMemberName} ble med! Rabatt: ${discount}%`,
                    { duration: 4000 }
                );
            }

            if (prevStatusRef.current === 'OPEN' && data.status === 'LOCKED') {
                toast.success('Gruppen er låst! Klar for booking...', { duration: 3000 });
            }

            prevMemberCountRef.current = data.member_count;
            prevStatusRef.current = data.status;

            // Save active lobby to localStorage for navbar
            if (typeof window !== 'undefined' && data.status === 'OPEN') {
                localStorage.setItem('groupie_active_lobby', data.lobby_code);
                localStorage.setItem('groupie_active_business_id', data.business_id);
            }

            // Clear active lobby if expired or confirmed
            if (typeof window !== 'undefined' && (data.status === 'EXPIRED' || data.status === 'CONFIRMED')) {
                localStorage.removeItem('groupie_active_lobby');
                localStorage.removeItem('groupie_active_business_id');
            }

            setLobby(data);
            setError(null);
        } catch (err) {
            console.error('Feil ved henting av lobby:', err);
            setError('Kunne ikke koble til serveren.');
        } finally {
            setIsLoading(false);
        }
    }, [lobbyCode]);

    useEffect(() => {
        fetchLobbyData();
    }, [fetchLobbyData]);

    usePolling(() => {
        fetchLobbyData();
    }, isLoading ? null : POLL_INTERVAL_MS);

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#FFFAF8] via-white to-[#CCFBF1]/30 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#FF6B5B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Henter lobby...</p>
                </div>
            </div>
        );
    }

    // Error state - clear localStorage if lobby doesn't exist
    if (error || !lobby) {
        // Clear invalid lobby from localStorage
        if (typeof window !== 'undefined') {
            const savedLobby = localStorage.getItem('groupie_active_lobby');
            if (savedLobby === lobbyCode) {
                localStorage.removeItem('groupie_active_lobby');
                localStorage.removeItem('groupie_active_business_id');
            }
        }

        return (
            <div className="min-h-screen bg-gradient-to-br from-[#FFFAF8] via-white to-[#CCFBF1]/30 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-[#FF6B5B]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">🔍</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Gruppen finnes ikke</h1>
                    <p className="text-gray-500 mb-6">
                        Denne gruppen finnes ikke eller har utløpt. Start en ny gruppe for å komme i gang!
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={async () => {
                                if (!isAuthenticated || !user) {
                                    router.push('/login');
                                    return;
                                }
                                try {
                                    const response = await fetch(`${API_URL}/lobbies`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ leader_name: user.name }),
                                    });
                                    if (response.ok) {
                                        const data = await response.json();
                                        localStorage.setItem('groupie_active_lobby', data.lobby_code);
                                        router.push(`/lobby/${data.lobby_code}`);
                                    }
                                } catch (err) {
                                    console.error('Error creating lobby:', err);
                                }
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-[#FF6B5B] to-[#E85A4A] text-white rounded-xl font-semibold shadow-lg shadow-[#FF6B5B]/30 hover:shadow-xl transition-all"
                        >
                            Start ny gruppe
                        </button>
                        <Link href="/">
                            <button className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors w-full">
                                Tilbake til forsiden
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Check if user needs to join
    const isUserInLobby = user && lobby.members.some(m => m.user_name === user.name);
    const business = getBusinessById(lobby.business_id);

    // Show Join Gate if user is not logged in OR not in the member list
    if (!isUserInLobby && !hasJoined) {
        return (
            <JoinGate
                lobbyCode={lobbyCode}
                leaderName={lobby.leader_name}
                businessName={business?.name}
                isLoggedIn={isAuthenticated}
                userName={user?.name}
                onJoinSuccess={(_name) => {
                    setHasJoined(true);
                    // Refetch lobby data to get updated members list
                    fetchLobbyData();
                }}
            />
        );
    }

    // Confirmed state
    if (lobby.status === 'CONFIRMED') {
        const currentTier = DISCOUNT_TIERS.filter(t => lobby.member_count >= t.size).pop() || DISCOUNT_TIERS[0];
        const basePrice = 250;
        const currentPrice = Math.round(basePrice * (1 - currentTier.discount / 100));

        return (
            <div className="min-h-screen bg-gradient-to-br from-[#CCFBF1]/30 via-white to-[#FFFAF8] py-8">
                <header className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B5B] to-[#E85A4A] rounded-xl flex items-center justify-center">
                            <span className="text-xl">👥</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900">Groupie</span>
                    </Link>
                </header>

                <ConfirmedTicket
                    businessName="Velocity Go-Karting"
                    groupSize={lobby.member_count}
                    pricePerPerson={currentPrice}
                    originalPrice={basePrice}
                    lobbyCode={lobby.lobby_code}
                />

                <div className="text-center mt-8">
                    <Link href="/">
                        <button className="px-6 py-3 bg-gradient-to-r from-[#FF6B5B] to-[#E85A4A] hover:from-[#E85A4A] hover:to-[#D64A3A] text-white rounded-xl font-semibold shadow-lg shadow-[#FF6B5B]/30 transition-all">
                            Tilbake til forsiden
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    // Normal lobby view
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FFFAF8] via-white to-[#CCFBF1]/30">
            {/* Header */}
            <header className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-gray-100 z-50">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span className="font-medium">Tilbake</span>
                        </Link>

                        {lobby.expires_at && lobby.status === 'OPEN' && (
                            <CountdownTimer
                                expiresAt={lobby.expires_at}
                                onExpired={() => toast.error('Lobbyen har utløpt!')}
                            />
                        )}

                        {/* User Info + Logout */}
                        <div className="flex items-center gap-3">
                            {user && (
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 bg-gradient-to-br from-[#14B8A6] to-[#0D9488] rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">{user.name.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <span className="text-sm text-gray-600 hidden sm:block">{user.name}</span>
                                </div>
                            )}
                            <button
                                onClick={() => {
                                    logout();
                                    window.location.reload();
                                }}
                                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                                title="Logg ut og bytt bruker"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
                {/* Status Badge */}
                <div className="text-center">
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${lobby.status === 'OPEN'
                        ? 'bg-[#14B8A6]/10 text-[#14B8A6]'
                        : lobby.status === 'LOCKED'
                            ? 'bg-[#FF6B5B]/10 text-[#FF6B5B]'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                        <span className={`w-2 h-2 rounded-full ${lobby.status === 'OPEN' ? 'bg-[#14B8A6] animate-pulse' : 'bg-[#FF6B5B]'
                            }`} />
                        {lobby.status === 'OPEN' ? 'Åpen for flere' : lobby.status === 'LOCKED' ? 'Låst' : lobby.status}
                    </span>
                </div>

                <ShareCard code={lobby.lobby_code} />

                {/* Business/Offer Card OR Empty Lobby State */}
                {(() => {
                    const business = getBusinessById(lobby.business_id);

                    // Empty Lobby State - no business selected yet
                    if (!business) {
                        return (
                            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-lg shadow-gray-100/50 text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-[#FF6B5B]/20 to-[#14B8A6]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="text-4xl">🎯</span>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    Lobby opprettet!
                                </h2>
                                <p className="text-gray-500 mb-6">
                                    Venter på å velge aktivitet...
                                </p>
                                <p className="text-sm text-gray-400 mb-6">
                                    Samle vennene dine først, så kan dere bestemme hva dere skal gjøre sammen!
                                </p>
                                <Link href="/start">
                                    <button className="w-full py-4 bg-gradient-to-r from-[#FF6B5B] to-[#E85A4A] hover:from-[#E85A4A] hover:to-[#D64A3A] text-white rounded-2xl font-semibold text-lg shadow-lg shadow-[#FF6B5B]/30 transition-all hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-3">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        Finn aktiviteter
                                    </button>
                                </Link>
                            </div>
                        );
                    }

                    const currentTier = DISCOUNT_TIERS.filter(t => lobby.member_count >= t.size).pop() || DISCOUNT_TIERS[0];
                    const baseTier = business.pricingTiers?.[0];
                    const currentPriceTier = business.pricingTiers?.find(t => t.size <= lobby.member_count) || baseTier;

                    return (
                        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-lg shadow-gray-100/50">
                            <div className="relative h-32">
                                <img
                                    src={business.imageUrl}
                                    alt={business.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-3 left-4 right-4">
                                    <span className="inline-block px-2 py-0.5 bg-[#14B8A6] text-white text-xs font-semibold rounded-full mb-1">
                                        {business.category}
                                    </span>
                                    <h3 className="text-lg font-bold text-white">{business.name}</h3>
                                </div>
                                <div className="absolute top-3 right-3 px-3 py-1 bg-gradient-to-r from-[#FF6B5B] to-[#E85A4A] text-white text-sm font-bold rounded-lg shadow-lg">
                                    {currentTier.discount}% rabatt
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Gruppepris per person</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-bold text-[#FF6B5B]">
                                                {currentPriceTier?.pricePerPerson || '–'} kr
                                            </span>
                                            {baseTier && currentPriceTier && currentPriceTier.pricePerPerson < baseTier.pricePerPerson && (
                                                <span className="text-sm text-gray-400 line-through">
                                                    {baseTier.pricePerPerson} kr
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link href={`/business/${lobby.business_id}`}>
                                            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors">
                                                Se detaljer
                                            </button>
                                        </Link>
                                        {/* Change Activity button - only for leader */}
                                        {user && lobby.leader_name === user.name && (
                                            <Link href="/start">
                                                <button className="px-4 py-2 bg-[#14B8A6]/10 hover:bg-[#14B8A6]/20 text-[#14B8A6] rounded-xl text-sm font-medium transition-colors">
                                                    🔄 Bytt
                                                </button>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                <ProgressBar currentCount={lobby.member_count} />

                {/* Share Button */}
                {(() => {
                    const business = getBusinessById(lobby.business_id);
                    const nextTier = DISCOUNT_TIERS.find(t => t.size > lobby.member_count) || DISCOUNT_TIERS[DISCOUNT_TIERS.length - 1];
                    const lobbyUrl = typeof window !== 'undefined' ? `${window.location.origin}/lobby/${lobby.lobby_code}` : '';

                    return (
                        <ShareButton
                            businessName={business?.name || 'denne opplevelsen'}
                            lobbyUrl={lobbyUrl}
                            currentMembers={lobby.member_count}
                            nextTierSize={nextTier.size}
                            nextTierDiscount={nextTier.discount}
                        />
                    );
                })()}

                <MemberList
                    members={lobby.members}
                    leaderName={lobby.leader_name}
                    currentUserName={user?.name || ''}
                    lobbyCode={lobby.lobby_code}
                    lobbyStatus={lobby.status}
                    onReadyToggle={fetchLobbyData}
                />

                <p className="text-center text-xs text-gray-400">
                    Oppdateres automatisk hvert 3. sekund
                </p>

                {/* Leave Group Button */}
                <div className="pt-4 border-t border-gray-100">
                    <button
                        onClick={() => {
                            if (confirm('Er du sikker på at du vil forlate gruppen?')) {
                                localStorage.removeItem('groupie_active_lobby');
                                localStorage.removeItem('groupie_active_business_id');
                                toast.success('Du har forlatt gruppen');
                                router.push('/');
                            }
                        }}
                        className="w-full py-3 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl font-medium transition-all"
                    >
                        Forlat gruppe
                    </button>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-100 mt-16 bg-white">
                <div className="max-w-2xl mx-auto px-4 py-8 text-center">
                    <p className="text-sm text-gray-400">
                        © 2025 Groupie
                    </p>
                </div>
            </footer>
        </div>
    );
}
