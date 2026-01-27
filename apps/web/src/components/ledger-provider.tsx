
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth-provider';
import { hc } from 'hono/client';
import { AppType } from '@lin-fan/api';

type Ledger = {
    id: number;
    name: string;
    role: 'owner' | 'editor' | 'viewer';
    hasPassword?: boolean;
};

type LedgerContextType = {
    ledgers: Ledger[];
    currentLedger: Ledger | null;
    currentLedgerId: number | null;
    isLoading: boolean;
    refreshLedgers: () => Promise<void>;
    selectLedger: (ledgerId: number) => void;
};

const LedgerContext = createContext<LedgerContextType>({
    ledgers: [],
    currentLedger: null,
    currentLedgerId: null,
    isLoading: true,
    refreshLedgers: async () => { },
    selectLedger: () => { },
});

export function useLedger() {
    return useContext(LedgerContext);
}

export function LedgerProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [ledgers, setLedgers] = useState<Ledger[]>([]);
    const [currentLedgerId, setCurrentLedgerId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const apiUrl = import.meta.env.VITE_API_URL || '/';

    const fetchLedgers = async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const client = hc<AppType>(apiUrl, {
                headers: { Authorization: `Bearer ${token}` }
            }) as any;

            const res = await client.api.ledgers.$get();
            if (res.ok) {
                const data = await res.json();
                setLedgers(data);

                // If currentLedgerId is set but not in list (revoked?), clear it
                if (currentLedgerId) {
                    const stillExists = data.find((l: Ledger) => l.id === currentLedgerId);
                    if (!stillExists) {
                        setCurrentLedgerId(null);
                        localStorage.removeItem('ledgerId');
                    }
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Load initial state from local storage
        const savedId = localStorage.getItem('ledgerId');
        if (savedId) {
            setCurrentLedgerId(parseInt(savedId));
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchLedgers();
        } else {
            setLedgers([]);
            setIsLoading(false);
        }
    }, [user]);

    const selectLedger = (ledgerId: number) => {
        setCurrentLedgerId(ledgerId);
        localStorage.setItem('ledgerId', ledgerId.toString());
    };

    const currentLedger = ledgers.find(l => l.id === currentLedgerId) || null;

    return (
        <LedgerContext.Provider value={{
            ledgers,
            currentLedger,
            currentLedgerId,
            isLoading,
            refreshLedgers: fetchLedgers,
            selectLedger
        }}>
            {children}
        </LedgerContext.Provider>
    );
}
