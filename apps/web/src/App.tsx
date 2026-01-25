import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/components/auth-provider';
import Login from '@/pages/login';
import Layout from '@/components/layout';
import AssetsPage from '@/pages/assets';
import ColorPreview from '@/pages/color-preview';
import SettingsPage from '@/pages/settings';
import TransactionsPage from '@/pages/transactions';
import CardsPage from '@/pages/cards';
import DashboardPage from '@/pages/dashboard';
import StocksPage from '@/pages/stocks';
import { Toaster } from "@/components/ui/sonner";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;

    return <>{children}</>;
}



function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    {/* Protected Routes wrapped in Layout */}
                    <Route element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }>
                        <Route path="/" element={<DashboardPage />} />
                        <Route path="/assets" element={<AssetsPage />} />
                        <Route path="/transactions" element={<TransactionsPage />} />
                        <Route path="/color-preview" element={<ColorPreview />} />
                        <Route path="/cards" element={<CardsPage />} />
                        <Route path="/stocks" element={<StocksPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                    </Route>
                </Routes>
                <Toaster />
            </AuthProvider>
        </Router>
    );
}

export default App;


