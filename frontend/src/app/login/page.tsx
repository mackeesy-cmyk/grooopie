'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Redirect hvis allerede innlogget
    React.useEffect(() => {
        if (isAuthenticated) {
            router.push('/');
        }
    }, [isAuthenticated, router]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!displayName.trim()) {
            setError('Vennligst skriv inn et navn');
            return;
        }

        if (displayName.trim().length < 2) {
            setError('Navnet må være minst 2 tegn');
            return;
        }

        login(displayName.trim());
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FFFAF8] via-white to-[#CCFBF1]/30 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-20 right-10 w-72 h-72 bg-[#FF6B5B]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#14B8A6]/10 rounded-full blur-3xl" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-3 mb-6">
                        <div className="w-14 h-14 bg-gradient-to-br from-[#FF6B5B] to-[#E85A4A] rounded-2xl flex items-center justify-center shadow-xl shadow-[#FF6B5B]/30">
                            <span className="text-3xl">👥</span>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">Groupie</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 mt-4">Velkommen!</h1>
                    <p className="text-gray-500 mt-2">Opprett en gjesteprofil for å komme i gang</p>
                </div>

                {/* Innloggingskort */}
                <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xl shadow-gray-200/50">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label
                                htmlFor="displayName"
                                className="block text-sm font-semibold text-gray-700 mb-2"
                            >
                                Ditt visningsnavn
                            </label>
                            <input
                                id="displayName"
                                type="text"
                                value={displayName}
                                onChange={(e) => {
                                    setDisplayName(e.target.value);
                                    setError(null);
                                }}
                                placeholder="F.eks. Ola Nordmann"
                                maxLength={30}
                                className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FF6B5B] focus:ring-2 focus:ring-[#FF6B5B]/20 transition-all"
                            />
                            <p className="text-xs text-gray-400 mt-2">
                                Dette navnet vil være synlig for andre i gruppen
                            </p>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                                <p className="text-red-600 text-sm font-medium">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full py-4 bg-gradient-to-r from-[#FF6B5B] to-[#E85A4A] hover:from-[#E85A4A] hover:to-[#D64A3A] text-white rounded-xl font-semibold text-lg shadow-lg shadow-[#FF6B5B]/30 transition-all hover:shadow-xl hover:shadow-[#FF6B5B]/40 hover:-translate-y-0.5"
                        >
                            Fortsett som Gjest →
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <p className="text-center text-xs text-gray-400">
                            Ved å fortsette godtar du våre vilkår og betingelser.
                            <br />
                            Ingen konto er nødvendig – dataene lagres kun lokalt.
                        </p>
                    </div>
                </div>

                {/* Tilbake-lenke */}
                <div className="text-center mt-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#FF6B5B] transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Tilbake til forsiden
                    </Link>
                </div>
            </div>
        </div>
    );
}
