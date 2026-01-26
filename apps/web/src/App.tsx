import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/components/auth-provider';
import { LedgerProvider, useLedger } from '@/components/ledger-provider';
import Login from '@/pages/login';
import Layout from '@/components/layout';
import AssetsPage from '@/pages/assets';
import ColorPreview from '@/pages/color-preview';
import SettingsPage from '@/pages/settings';
import TransactionsPage from '@/pages/transactions';
import CardsPage from '@/pages/cards';
import DashboardPage from '@/pages/dashboard';
import StocksPage from '@/pages/stocks';
import LedgerSelectionPage from '@/pages/ledger-selection';
import { Toaster } from "@/components/ui/sonner";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const { currentLedgerId, isLoading: ledgerLoading } = useLedger();
    const location = useLocation();

    if (loading || ledgerLoading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;

    // If no ledger selected and not on selection page, redirect
    if (!currentLedgerId && location.pathname !== '/ledgers') {
        return <Navigate to="/ledgers" />;
    }

    // If ledger selected and trying to go to /ledgers, allowing it (switch ledger) or redirect?
    // Usually allow it so they can switch.

    return <>{children}</>;
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <LedgerProvider>
                    <Routes>
                        <Route path="/login" element={<Login />} />

                        <Route path="/ledgers" element={
                            <ProtectedRoute>
                                <LedgerSelectionPage />
                            </ProtectedRoute>
                        } />

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
                </LedgerProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;


