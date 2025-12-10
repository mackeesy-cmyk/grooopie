'use client';

import React from 'react';

// ============================================================================
// Typer
// ============================================================================

interface ConfirmedTicketProps {
    businessName: string;
    groupSize: number;
    pricePerPerson: number;
    originalPrice: number;
    lobbyCode: string;
    bookingDate?: string;
}

// ============================================================================
// ConfirmedTicket-komponent
// ============================================================================

const ConfirmedTicket: React.FC<ConfirmedTicketProps> = ({
    businessName,
    groupSize,
    pricePerPerson,
    originalPrice,
    lobbyCode,
    bookingDate = new Date().toLocaleDateString('nb-NO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }),
}) => {
    const totalSaved = (originalPrice - pricePerPerson) * groupSize;
    const discountPercent = Math.round((1 - pricePerPerson / originalPrice) * 100);

    return (
        <div className="animate-slide-up">
            {/* Billett-container */}
            <div className="bg-white rounded-3xl shadow-2xl shadow-[#14B8A6]/20 overflow-hidden mx-4 max-w-md mx-auto border border-gray-100">
                {/* Header med gradient */}
                <div className="bg-gradient-to-r from-[#14B8A6] to-[#0D9488] p-8 text-center relative overflow-hidden">
                    {/* Decorative circles */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full" />
                    <div className="absolute -bottom-5 -left-5 w-20 h-20 bg-white/10 rounded-full" />

                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                            <svg className="w-12 h-12 text-[#14B8A6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-1">Booking Bekreftet!</h1>
                        <p className="text-teal-100 text-sm">Din gruppebooking er klar</p>
                    </div>
                </div>

                {/* Billett-innhold */}
                <div className="p-6">
                    {/* QR-kode */}
                    <div className="flex justify-center mb-6">
                        <div className="w-48 h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center border border-gray-200 p-2">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${lobbyCode}&color=0D9488`}
                                alt="QR Kode"
                                className="w-40 h-40 rounded-lg"
                            />
                        </div>
                    </div>

                    {/* Booking-kode */}
                    <div className="text-center mb-6">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Referansekode</p>
                        <p className="text-3xl font-mono font-bold text-gray-900 tracking-widest">{lobbyCode}</p>
                    </div>

                    {/* Stiplet linje med hull */}
                    <div className="relative my-6">
                        <div className="border-t-2 border-dashed border-gray-200" />
                        <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-[#FFFAF8] to-white rounded-full" />
                        <div className="absolute -right-10 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-[#FFFAF8] to-white rounded-full" />
                    </div>

                    {/* Detaljer */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">Aktivitet</span>
                            <span className="font-semibold text-gray-900">{businessName}</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">Gruppestørrelse</span>
                            <span className="font-semibold text-gray-900">{groupSize} personer</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">Dato</span>
                            <span className="font-semibold text-gray-900">{bookingDate}</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">Pris per person</span>
                            <div className="text-right">
                                <span className="font-semibold text-gray-900">{pricePerPerson} kr</span>
                                <span className="text-sm text-gray-400 line-through ml-2">{originalPrice} kr</span>
                            </div>
                        </div>
                    </div>

                    {/* Stiplet linje med hull */}
                    <div className="relative my-6">
                        <div className="border-t-2 border-dashed border-gray-200" />
                        <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-[#FFFAF8] to-white rounded-full" />
                        <div className="absolute -right-10 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-[#FFFAF8] to-white rounded-full" />
                    </div>

                    {/* Besparelser */}
                    <div className="bg-gradient-to-r from-[#FF6B5B]/10 to-[#E85A4A]/5 rounded-2xl p-5 text-center border border-[#FF6B5B]/20">
                        <p className="text-sm text-[#E85A4A] font-medium mb-1">Du sparte</p>
                        <div className="flex items-center justify-center gap-3">
                            <span className="text-4xl font-bold text-[#FF6B5B]">{totalSaved} kr</span>
                            <span className="px-3 py-1.5 bg-gradient-to-r from-[#FF6B5B] to-[#E85A4A] text-white text-sm font-bold rounded-lg shadow-lg shadow-[#FF6B5B]/30">
                                -{discountPercent}%
                            </span>
                        </div>
                        <p className="text-xs text-[#E85A4A]/70 mt-2">Total besparelse for hele gruppen</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 text-center border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                        Vis denne billetten ved ankomst
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ConfirmedTicket;
