import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/components/auth-provider';
import Login from '@/pages/login';
import Layout from '@/components/layout';
import AssetsPage from '@/pages/assets';
import ColorPreview from '@/pages/color-preview';
import SettingsPage from '@/pages/settings';
import TransactionsPage from '@/pages/transactions';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;

    return <>{children}</>;
}

function Dashboard() {
    const { dbUser } = useAuth();
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Dashboard</h1>
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">User Profile</h2>
                    <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-sm overflow-auto text-gray-700 dark:text-gray-300">
                        {JSON.stringify(dbUser, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
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
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/assets" element={<AssetsPage />} />
                        <Route path="/transactions" element={<TransactionsPage />} />
                        <Route path="/color-preview" element={<ColorPreview />} />
                        <Route path="/cards" element={<div>Credit Cards (Coming Soon)</div>} />
                        <Route path="/stocks" element={<div>Investments (Coming Soon)</div>} />
                        <Route path="/settings" element={<SettingsPage />} />
                    </Route>
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;


