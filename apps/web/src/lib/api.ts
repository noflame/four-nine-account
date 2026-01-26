
import { hc } from "hono/client";
import { AppType } from "@lin-fan/api";
import { useAuth } from "@/components/auth-provider";
import { useEffect, useState } from "react";

export function useApiClient() {
    const { user } = useAuth();
    // We can't use useLedger here if useLedger uses useApiClient (cycle).
    // LedgerProvider will manage the ledger ID state.
    // So we should retrieve ledgerId from localStorage or pass it in?
    // Better: useApiClient returns a client that dynamically attaches headers.

    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            user.getIdToken().then(setToken);
        }
    }, [user]);

    const apiUrl = import.meta.env.VITE_API_URL || '/api';

    // We can't easily wait for token in a sync return.
    // But hc returns a proxy. We can wrap the fetch?
    // Hono client allows passing headers.

    const getClient = async () => {
        const currentToken = token || (user ? await user.getIdToken() : null);
        const ledgerId = localStorage.getItem('ledgerId');

        const headers: Record<string, string> = {};
        if (currentToken) {
            headers['Authorization'] = `Bearer ${currentToken}`;
        }
        if (ledgerId) {
            headers['X-Ledger-Id'] = ledgerId;
        }

        return hc<AppType>(apiUrl, { headers }) as any; // Type workaround
    };

    return { getClient };
}
