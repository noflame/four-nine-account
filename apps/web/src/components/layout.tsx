import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { Button } from "@/components/ui/button";
import { Plus, Menu, ArrowRightLeft } from "lucide-react";
import { TransactionDialog } from "./transaction-dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "./auth-provider";
import { useLedger } from "./ledger-provider";

export default function Layout() {
    const { dbUser } = useAuth();
    const { currentLedger } = useLedger();
    const navigate = useNavigate();
    const [isTransactionOpen, setIsTransactionOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden relative">
            {/* Sidebar - hidden on mobile by default (TODO: Add mobile menu) */}
            <aside className="hidden md:flex h-full">
                <Sidebar />
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Header */}
                <header className="flex items-center justify-between border-b px-6 py-4 bg-card">
                    <div className="flex items-center gap-4">
                        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                            <SheetTrigger asChild className="md:hidden">
                                <Button variant="ghost" size="icon">
                                    <Menu className="h-6 w-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 border-r-0">
                                <Sidebar onItemClick={() => setIsMobileMenuOpen(false)} />
                            </SheetContent>
                        </Sheet>
                        <div>
                            <h1 className="text-lg font-bold">Family Asset</h1>
                            {currentLedger && <span className="text-xs text-muted-foreground">{currentLedger.name}</span>}
                        </div>
                    </div>

                    <Button variant="outline" size="sm" onClick={() => navigate('/ledgers')}>
                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                        Switch Ledger
                    </Button>
                </header>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-auto p-6 md:p-8 pb-24">
                    <Outlet />
                </div>

                {/* FAB: Floating Action Button for Transactions */}
                {dbUser?.role !== 'child' && (
                    <div className="fixed bottom-8 right-6 z-50">
                        <Button
                            size="icon"
                            className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-transform hover:scale-105 active:scale-95"
                            onClick={() => setIsTransactionOpen(true)}
                        >
                            <Plus className="h-8 w-8 text-white" />
                            <span className="sr-only">New Transaction</span>
                        </Button>
                    </div>
                )}
            </main>

            <TransactionDialog
                open={isTransactionOpen}
                onOpenChange={setIsTransactionOpen}
                onSuccess={() => {
                    // Ideally trigger a refresh of data here
                    // For now, page reload or context update is needed
                    window.dispatchEvent(new Event('transaction-updated'));
                }}
            />
        </div>
    );
}
