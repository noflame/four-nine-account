export function CreditLimitCard() {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <span className="material-symbols-outlined text-indigo-600">credit_card</span>
                    </div>
                    <div>
                        <h3 className="font-headline font-bold text-on-surface">Platinum Card</h3>
                        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mt-0.5">**** 4231</p>
                    </div>
                </div>
                <button className="p-2 -mr-2 text-on-surface-variant hover:text-on-surface hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <span className="material-symbols-outlined">more_vert</span>
                </button>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Available Limit</p>
                        <p className="text-2xl font-black font-headline text-on-surface">$12,450</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total</p>
                        <p className="text-sm font-bold text-on-surface-variant">$20,000</p>
                    </div>
                </div>

                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: '35%' }}></div>
                </div>
                <p className="text-xs font-semibold text-on-surface-variant text-right">35% used</p>
            </div>
        </div>
    );
}
