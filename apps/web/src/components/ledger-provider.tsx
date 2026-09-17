
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
    const ledgerRequestVersion = useRef(0);

    const apiUrl = import.meta.env.VITE_API_URL || '/';

    const fetchLedgers = async () => {
        const requestVersion = ++ledgerRequestVersion.current;

        if (!user) {
            setLedgers([]);
            setCurrentLedgerId(null);
            localStorage.removeItem('ledgerId');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const token = await user.getIdToken();
            const client = hc<AppType>(apiUrl, {
                headers: { Authorization: `Bearer ${token}` }
            }) as any;

            const res = await client.api.ledgers.$get();
            if (res.ok) {
                const data = await res.json();
                if (requestVersion !== ledgerRequestVersion.current) return;

                setLedgers(data);

                setCurrentLedgerId((selectedLedgerId) => {
                    const stillExists = selectedLedgerId && data.some(
                        (ledger: Ledger) => ledger.id === selectedLedgerId
                    );

                    if (!stillExists) {
                        localStorage.removeItem('ledgerId');
                        return null;
                    }

                    return selectedLedgerId;
                });
            }
        } catch (err) {
            if (requestVersion === ledgerRequestVersion.current) {
                console.error(err);
            }
        } finally {
            if (requestVersion === ledgerRequestVersion.current) {
                setIsLoading(false);
            }
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
            ledgerRequestVersion.current += 1;
            setLedgers([]);
            setCurrentLedgerId(null);
            localStorage.removeItem('ledgerId');
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
