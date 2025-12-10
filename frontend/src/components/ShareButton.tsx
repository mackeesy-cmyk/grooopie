'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';

interface ShareButtonProps {
    businessName: string;
    lobbyUrl: string;
    currentMembers: number;
    nextTierSize: number;
    nextTierDiscount: number;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
    businessName,
    lobbyUrl,
    currentMembers,
    nextTierSize,
    nextTierDiscount,
}) => {
    const [isSharing, setIsSharing] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const membersNeeded = Math.max(0, nextTierSize - currentMembers);

    const shareTitle = `Bli med i min Groupie hos ${businessName}!`;
    const shareText = membersNeeded > 0
        ? `Vi trenger ${membersNeeded} til for å få ${nextTierDiscount}% rabatt! Bli med her:`
        : `Vi har allerede ${nextTierDiscount}% rabatt! Bli med for å beholde den:`;

    // Copy to clipboard with feedback
    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(lobbyUrl);
            setIsCopied(true);
            toast.success('Lenke kopiert! 📋', {
                description: 'Send den til vennene dine',
                duration: 3000,
            });

            // Reset "Copied!" text after 2 seconds
            setTimeout(() => {
                setIsCopied(false);
            }, 2000);

            return true;
        } catch {
            toast.error('Kunne ikke kopiere lenken');
            return false;
        }
    };

    // Main share button - uses native share or falls back to copy
    const handleShare = async () => {
        setIsSharing(true);

        try {
            // Check if Web Share API is supported (mainly mobile)
            if (navigator.share) {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: lobbyUrl,
                });
                toast.success('Delt!');
            } else {
                // Fallback: Copy to clipboard (desktop)
                await copyToClipboard();
            }
        } catch (err) {
            // User cancelled share or error occurred
            if ((err as Error).name !== 'AbortError') {
                // Fallback to clipboard
                await copyToClipboard();
            }
        } finally {
            setIsSharing(false);
        }
    };

    // Dedicated copy button handler
    const handleCopy = async () => {
        await copyToClipboard();
    };

    return (
        <div className="space-y-3">
            {/* Main Share/Invite Button Row */}
            <div className="flex gap-2">
                {/* Primary Share Button */}
                <button
                    onClick={handleShare}
                    disabled={isSharing}
                    className="flex-1 py-4 bg-gradient-to-r from-[#FF6B5B] to-[#E85A4A] hover:from-[#E85A4A] hover:to-[#D64A3A] text-white rounded-2xl font-semibold text-lg shadow-lg shadow-[#FF6B5B]/30 transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 flex items-center justify-center gap-3"
                >
                    {isSharing ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Deler...
                        </>
                    ) : (
                        <>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            Inviter venner
                            {membersNeeded > 0 && (
                                <span className="px-2 py-0.5 bg-white/20 rounded-full text-sm">
                                    +{membersNeeded} for {nextTierDiscount}%
                                </span>
                            )}
                        </>
                    )}
                </button>

                {/* Copy Link Icon Button */}
                <button
                    onClick={handleCopy}
                    className={`px-4 py-4 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 ${isCopied
                            ? 'bg-[#14B8A6] text-white shadow-lg shadow-[#14B8A6]/30'
                            : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-[#FF6B5B] hover:text-[#FF6B5B]'
                        }`}
                    title="Kopier lenke"
                >
                    {isCopied ? (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Link Preview */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                <div className="flex-1 truncate text-sm text-gray-500 font-mono">
                    {lobbyUrl}
                </div>
                <button
                    onClick={handleCopy}
                    className={`text-sm font-semibold transition-colors ${isCopied ? 'text-[#14B8A6]' : 'text-[#FF6B5B] hover:text-[#E85A4A]'
                        }`}
                >
                    {isCopied ? 'Kopiert!' : 'Kopier'}
                </button>
            </div>
        </div>
    );
};

export default ShareButton;
