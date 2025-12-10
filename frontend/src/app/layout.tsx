import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Groupie - Spar sammen, opplev sammen",
  description: "Finn grupperabatter på aktiviteter, restauranter og opplevelser. Jo flere som blir med, jo mer sparer alle!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no">
      <body
        className={`${plusJakarta.variable} font-sans antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#FF6B5B',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
            },
          }}
        />
      </body>
    </html>
  );
}
