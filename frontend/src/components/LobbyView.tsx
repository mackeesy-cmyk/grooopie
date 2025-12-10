'use client';

import React from 'react';
import { LobbyDetailResponse, LobbyMember, DiscountTier } from '../types/lobby';
import { mockLobbyData } from '../mocks/lobbyData';

/**
 * LobbyView Component
 * 
 * Displays a lobby with members list and discount tier progression.
 * Mobile-first design using Tailwind CSS.
 * Norwegian language.
 */

// ============================================================================
// Sub-Components
// ============================================================================

interface MemberAvatarProps {
    member: LobbyMember;
}

const MemberAvatar: React.FC<MemberAvatarProps> = ({ member }) => {
    const initials = `${member.user.first_name[0]}${member.user.last_name[0]}`;
    const statusColors = {
        confirmed: 'ring-emerald-500',
        pending: 'ring-amber-500',
        cancelled: 'ring-red-500',
    };

    return (
        <div className="relative">
            {member.user.avatar_url ? (
                <img
                    src={member.user.avatar_url}
                    alt={member.user.first_name}
                    className={`w-12 h-12 rounded-full ring-2 ${statusColors[member.status]} object-cover`}
                />
            ) : (
                <div
                    className={`w-12 h-12 rounded-full ring-2 ${statusColors[member.status]} bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm`}
                >
                    {initials}
                </div>
            )}
            {member.is_creator && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                    <span className="text-xs">👑</span>
                </div>
            )}
            {member.spots_reserved > 1 && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    +{member.spots_reserved - 1}
                </div>
            )}
        </div>
    );
};

interface MemberCardProps {
    member: LobbyMember;
}

const MemberCard: React.FC<MemberCardProps> = ({ member }) => {
    const statusLabels = {
        confirmed: 'Bekreftet',
        pending: 'Venter',
        cancelled: 'Avbestilt',
    };
    const statusBadgeColors = {
        confirmed: 'bg-emerald-500/20 text-emerald-400',
        pending: 'bg-amber-500/20 text-amber-400',
        cancelled: 'bg-red-500/20 text-red-400',
    };

    return (
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-200">
            <MemberAvatar member={member} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-white truncate">
                        {member.user.first_name} {member.user.last_name}
                    </span>
                    {member.is_creator && (
                        <span className="text-xs text-amber-400 font-medium">Vert</span>
                    )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadgeColors[member.status]}`}>
                        {statusLabels[member.status]}
                    </span>
                    {member.spots_reserved > 1 && (
                        <span className="text-xs text-gray-400">
                            +{member.spots_reserved - 1} gjest{member.spots_reserved > 2 ? 'er' : ''}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

interface DiscountProgressBarProps {
    tiers: DiscountTier[];
    currentCount: number;
    maxCapacity: number;
    nextTier: LobbyDetailResponse['discount_tiers']['next_tier'];
}

const DiscountProgressBar: React.FC<DiscountProgressBarProps> = ({
    tiers,
    currentCount,
    maxCapacity,
    nextTier,
}) => {
    // Calculate progress percentage
    const progressPercent = (currentCount / maxCapacity) * 100;

    // Find current tier
    const currentTier = tiers.find(t => t.is_current);

    return (
        <div className="space-y-4">
            {/* Progress Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white">Gruppefremgang</h3>
                    <p className="text-sm text-gray-400">
                        {currentCount} av {maxCapacity} plasser fylt
                    </p>
                </div>
                {currentTier && (
                    <div className="text-right">
                        <div className="text-2xl font-bold text-emerald-400">
                            {currentTier.discount_percentage}% RABATT
                        </div>
                        <div className="text-sm text-gray-400">{currentTier.tier_name}-nivå</div>
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            <div className="relative">
                {/* Background track */}
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                    {/* Filled progress */}
                    <div
                        className="h-full bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 rounded-full transition-all duration-500 ease-out relative"
                        style={{ width: `${progressPercent}%` }}
                    >
                        {/* Animated shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                    </div>
                </div>

                {/* Tier markers */}
                <div className="absolute top-0 left-0 right-0 h-3 flex items-center">
                    {tiers.map((tier, index) => {
                        const position = (tier.min_participants / maxCapacity) * 100;
                        return (
                            <div
                                key={index}
                                className="absolute transform -translate-x-1/2"
                                style={{ left: `${position}%` }}
                            >
                                <div
                                    className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${tier.is_unlocked
                                        ? 'bg-emerald-500 border-emerald-400'
                                        : 'bg-gray-700 border-gray-600'
                                        }`}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Tier Labels */}
            <div className="flex justify-between text-xs">
                {tiers.map((tier, index) => (
                    <div
                        key={index}
                        className={`text-center transition-all duration-300 ${tier.is_current
                            ? 'text-violet-400 font-semibold scale-110'
                            : tier.is_unlocked
                                ? 'text-gray-400'
                                : 'text-gray-600'
                            }`}
                    >
                        <div>{tier.tier_name}</div>
                        <div className="font-medium">{tier.discount_percentage}%</div>
                    </div>
                ))}
            </div>

            {/* Next Tier CTA */}
            {nextTier && (
                <div className="mt-4 p-4 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 rounded-xl border border-violet-500/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-300">
                                <span className="text-white font-semibold">{nextTier.members_needed} til</span>
                                {' '}for å låse opp{' '}
                                <span className="text-violet-400 font-semibold">{nextTier.tier_name}</span>
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Spar {nextTier.potential_savings} kr ekstra per person!
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-xl font-bold text-violet-400">
                                {nextTier.discount_percentage}%
                            </div>
                            <div className="text-xs text-gray-400">rabatt</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================================================
// Main Component
// ============================================================================

interface LobbyViewProps {
    data?: LobbyDetailResponse;
}

const LobbyView: React.FC<LobbyViewProps> = ({ data = mockLobbyData }) => {
    const { lobby, activity, members, pricing, discount_tiers, countdown, user_context } = data;

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('nb-NO', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900">
            {/* Hero Section */}
            <div className="relative h-64 overflow-hidden">
                {activity.image_url && (
                    <img
                        src={activity.image_url}
                        alt={activity.name}
                        className="w-full h-full object-cover"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />

                {/* Status Badge */}
                <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm ${lobby.status === 'open'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                        {lobby.status === 'open' ? 'Åpen' : lobby.status === 'full' ? 'Full' : lobby.status === 'confirmed' ? 'Bekreftet' : lobby.status}
                    </span>
                </div>

                {/* Countdown Badge */}
                {countdown.is_urgent && (
                    <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                            ⏰ {countdown.time_remaining_formatted} igjen
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="px-4 -mt-16 relative z-10 pb-24">
                {/* Activity Info Card */}
                <div className="bg-gray-800/80 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-xl">
                    <h1 className="text-2xl font-bold text-white mb-1">{activity.name}</h1>
                    <p className="text-gray-400 text-sm mb-3">{activity.location_name} • {activity.city}</p>

                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-gray-300">
                            <span>📅</span>
                            <span>{formatDate(data.time_slot.start_time)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-300">
                            <span>⏱️</span>
                            <span>{activity.duration_minutes} min</span>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-end justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Pris per person</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-white">
                                    {pricing.current_price_per_person}
                                </span>
                                <span className="text-gray-400">kr</span>
                                {pricing.current_discount_percentage > 0 && (
                                    <span className="text-sm text-gray-500 line-through">
                                        {pricing.base_price_per_person}
                                    </span>
                                )}
                            </div>
                        </div>
                        {pricing.current_discount_percentage > 0 && (
                            <div className="px-3 py-1 bg-emerald-500/20 rounded-lg">
                                <span className="text-emerald-400 font-bold">
                                    -{pricing.current_discount_percentage}%
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Discount Progress */}
                <div className="mt-6 bg-gray-800/60 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                    <DiscountProgressBar
                        tiers={discount_tiers.tiers}
                        currentCount={members.current_count}
                        maxCapacity={members.max_capacity}
                        nextTier={discount_tiers.next_tier}
                    />
                </div>

                {/* Members Section */}
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white">
                            Medlemmer ({members.current_count}/{members.max_capacity})
                        </h2>
                        <span className="text-sm text-violet-400">
                            {members.spots_remaining} plasser igjen
                        </span>
                    </div>

                    <div className="space-y-3">
                        {members.list.map((member) => (
                            <MemberCard key={member.id} member={member} />
                        ))}

                        {/* Empty spots */}
                        {Array.from({ length: members.spots_remaining }).map((_, i) => (
                            <div
                                key={`empty-${i}`}
                                className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-dashed border-white/10"
                            >
                                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                                    <span className="text-gray-600 text-xl">+</span>
                                </div>
                                <span className="text-gray-500">Venter på noen...</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Share Section */}
                <div className="mt-6 p-4 bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-white/10">
                    <p className="text-sm text-gray-400 mb-2">Inviter venner med kode:</p>
                    <div className="flex items-center gap-3">
                        <code className="flex-1 px-4 py-2 bg-gray-900 rounded-lg text-violet-400 font-mono text-lg">
                            {lobby.invite_code}
                        </code>
                        <button className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition-colors">
                            Kopier
                        </button>
                    </div>
                </div>
            </div>

            {/* Fixed Bottom CTA */}
            {user_context.can_join && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-900 via-gray-900 to-transparent">
                    <button className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-violet-500/25 transition-all duration-200 active:scale-[0.98]">
                        Bli Med • {pricing.current_price_per_person} kr
                    </button>
                </div>
            )}

            {/* Custom CSS for shimmer animation */}
            <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
        </div>
    );
};

export default LobbyView;
