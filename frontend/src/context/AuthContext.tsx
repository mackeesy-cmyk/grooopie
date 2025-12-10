'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ============================================================================
// Typer
// ============================================================================

export interface User {
    id: string;
    name: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (name: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

// ============================================================================
// Kontekst
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'groupie_user';

// ============================================================================
// Hjelpefunksjoner
// ============================================================================

function generateUserId(): string {
    // Use timestamp + random string for truly unique IDs
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `user_${timestamp}_${randomPart}`;
}

// ============================================================================
// Provider-komponent
// ============================================================================

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Hent bruker fra localStorage ved oppstart
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsedUser = JSON.parse(stored) as User;
                setUser(parsedUser);
            }
        } catch (err) {
            console.error('Feil ved lesing av bruker fra localStorage:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const login = (name: string) => {
        const newUser: User = {
            id: generateUserId(),
            name: name.trim(),
        };

        setUser(newUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    };

    const logout = () => {
        setUser(null);
        // Clear all Groupie-related localStorage
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('groupie_active_lobby');
        localStorage.removeItem('groupie_active_business_id');
    };

    const value: AuthContextType = {
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// ============================================================================
// Hook for å bruke auth-kontekst
// ============================================================================

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth må brukes innenfor en AuthProvider');
    }
    return context;
}
