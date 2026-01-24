import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, getIdToken } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { hc } from "hono/client";
import type { AppType } from "@lin-fan/api";

type AuthContextType = {
    user: User | null;
    loading: boolean;
    dbUser: any | null; // Type this properly with shared types later
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    dbUser: null,
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
                    const client = hc<AppType>('/', {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });

                    // Sync user with backend
                    const res = await client.users.sync.$post();
                    if (res.ok) {
                        const userData = await res.json();
                        setDbUser(userData);
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

    return (
        <AuthContext.Provider value={{ user, loading, dbUser }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
