import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';

export function BottomNavBar() {
    const location = useLocation();

    const navItems = [
        { name: 'Overview', icon: 'dashboard', path: '/' },
        { name: 'Assets', icon: 'account_balance_wallet', path: '/assets' },
        { name: 'Transactions', icon: 'receipt_long', path: '/transactions' },
        { name: 'Cards', icon: 'credit_card', path: '/cards' },
        { name: 'Investments', icon: 'trending_up', path: '/investments' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 w-full z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.04)] no-border">
            <div className="flex justify-around items-center px-4 pt-3 pb-8 max-w-7xl mx-auto">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={clsx(
                                "flex flex-col items-center justify-center px-3 py-1.5 transition-all duration-200",
                                isActive
                                    ? "bg-teal-50 dark:bg-teal-900/30 text-primary dark:text-primary-fixed rounded-2xl active:scale-90"
                                    : "text-slate-400 dark:text-slate-500 hover:text-primary-dim"
                            )}
                        >
                            <span
                                className="material-symbols-outlined"
                                style={isActive ? { fontVariationSettings: '"FILL" 1' } : undefined}
                            >
                                {item.icon}
                            </span>
                            <span className="font-headline text-[11px] font-semibold uppercase tracking-wider mt-1">
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
