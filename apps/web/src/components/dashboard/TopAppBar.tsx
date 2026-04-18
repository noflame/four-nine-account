export function TopAppBar() {
    return (
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl docked full-width top-0 z-50 sticky shadow-[0_32px_64px_-4px_rgba(45,51,55,0.06)]">
            <div className="grid grid-cols-3 items-center px-6 py-4 w-full max-w-7xl mx-auto">
                {/* LEFT: Ledger Name */}
                <div className="flex items-center gap-3">
                    <span className="font-headline text-lg font-bold tracking-tight text-primary dark:text-primary-fixed whitespace-nowrap">
                        Luminous <br />Ledger
                    </span>
                </div>
                {/* CENTER: Page Title */}
                <div className="flex justify-center">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-on-surface/60 font-inter">
                        Dashboard
                    </h2>
                </div>
                {/* RIGHT: User Avatar & Notification */}
                <div className="flex items-center justify-end gap-3">
                    <button className="p-2 rounded-full hover:bg-slate-100/50 transition-colors active:scale-95 duration-150">
                        <span className="material-symbols-outlined text-primary">notifications</span>
                    </button>
                    <img
                        alt="User Profile"
                        className="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-slate-800"
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                    />
                </div>
            </div>
        </header>
    )
}
