import { useState } from "react";
import { Outlet } from "react-router-dom";
import { TopAppBar } from "./dashboard/TopAppBar";
import { BottomNavBar } from "./dashboard/BottomNavBar";
import { FAB } from "./dashboard/FAB";
import { TransactionDialog } from "./transaction-dialog";
import { useAuth } from "./auth-provider";

export default function Layout() {
    const { dbUser } = useAuth();
    const [isTransactionOpen, setIsTransactionOpen] = useState(false);

    return (
        <div className="flex flex-col min-h-screen bg-surface font-manrope text-on-surface">
            {/* Top App Bar */}
            <TopAppBar />

            {/* Main Content Area */}
            <main className="flex-1 pb-32">
                <Outlet />
            </main>

            {/* Bottom Nav Bar */}
            <BottomNavBar />

            {/* FAB: Floating Action Button for Transactions */}
            {dbUser?.role !== 'child' && (
                <FAB onClick={() => setIsTransactionOpen(true)} />
            )}

            <TransactionDialog
                open={isTransactionOpen}
                onOpenChange={setIsTransactionOpen}
                onSuccess={() => {
                    window.dispatchEvent(new Event('transaction-updated'));
                }}
            />
        </div>
    );
}
