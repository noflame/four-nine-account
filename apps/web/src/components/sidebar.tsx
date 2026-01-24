import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Wallet, CreditCard, TrendingUp, Settings, LogOut, ArrowRightLeft } from "lucide-react";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";

const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Wallet, label: "Assets", href: "/assets" },
    { icon: ArrowRightLeft, label: "Transactions", href: "/transactions" },
    { icon: CreditCard, label: "Credit Cards", href: "/cards" },
    { icon: TrendingUp, label: "Investments", href: "/stocks" },
    { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
    const location = useLocation();

    const handleLogout = () => {
        auth.signOut();
    };

    return (
        <div className="flex h-full w-64 flex-col border-r bg-card text-card-foreground">
            <div className="p-6">
                <h1 className="text-2xl font-bold tracking-tight text-primary">Family Asset</h1>
            </div>

            <nav className="flex-1 space-y-1 px-3">
                {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </div>
    );
}
