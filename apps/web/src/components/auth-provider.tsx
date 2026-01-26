import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { hc } from "hono/client";
import type { AppType } from "@lin-fan/api";

type AuthContextType = {
    user: User | null;
    loading: boolean;
    dbUser: any | null; // Type this properly with shared types later
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    dbUser: null,
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [dbUser, setDbUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                try {
                    const token = await currentUser.getIdToken();
                    // Initialize API client with token
                    // Use /api prefix to trigger Vite proxy
                    // Workaround: Type assertion due to monorepo type resolution issue
                    // Use VITE_API_URL from environment or fallback to /api (for local proxy)
                    const apiUrl = import.meta.env.VITE_API_URL || '/api';
                    const client = hc<AppType>(apiUrl, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }) as any;

                    // Sync user with backend
                    const res = await client.users.sync.$post();
                    if (res.ok) {
                        const userData = await res.json();
                        console.log("Synced user:", userData);
                        setDbUser(userData);
                    } else {
                        console.error("Sync failed:", res.status, res.statusText);
                    }
                } catch (error) {
                    console.error("Failed to sync user:", error);
                }
            } else {
                setDbUser(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = () => signOut(auth);

    return (
        <AuthContext.Provider value={{ user, loading, dbUser, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
