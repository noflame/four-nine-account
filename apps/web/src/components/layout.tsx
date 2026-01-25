import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { Button } from "@/components/ui/button";
import { Plus, Menu } from "lucide-react";
import { TransactionDialog } from "./transaction-dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
// import { useAuth } from "./auth-provider"; // TODO: Use for user-specific UI

export default function Layout() {
    const [isTransactionOpen, setIsTransactionOpen] = useState(false);

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden relative">
            {/* Sidebar - hidden on mobile by default (TODO: Add mobile menu) */}
            <aside className="hidden md:flex h-full">
                <Sidebar />
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Header */}
                {/* Header */}
                <header className="flex items-center justify-between border-b px-6 py-4 bg-card md:hidden">
                    <h1 className="text-lg font-bold">Family Asset</h1>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 border-r-0">
                            <Sidebar />
                        </SheetContent>
                    </Sheet>
                </header>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-auto p-6 md:p-8 pb-24">
                    <Outlet />
                </div>

                {/* FAB: Floating Action Button for Transactions */}
                <div className="absolute bottom-6 right-6 z-50">
                    <Button
                        size="icon"
                        className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-transform hover:scale-105 active:scale-95"
                        onClick={() => setIsTransactionOpen(true)}
                    >
                        <Plus className="h-8 w-8 text-white" />
                        <span className="sr-only">New Transaction</span>
                    </Button>
                </div>
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
