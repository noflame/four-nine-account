import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";
// import { useAuth } from "./auth-provider"; // TODO: Use for user-specific UI

export default function Layout() {

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden">
            {/* Sidebar - hidden on mobile by default (TODO: Add mobile menu) */}
            <aside className="hidden md:flex h-full">
                <Sidebar />
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Header */}
                <header className="flex items-center justify-between border-b px-6 py-4 bg-card md:hidden">
                    <h1 className="text-lg font-bold">Family Asset</h1>
                    {/* Mobile Menu Trigger would go here */}
                </header>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-auto p-6 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
