export function ExpenseAnalysisCard() {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="font-headline font-bold text-lg text-on-surface mb-6">Expense Analysis</h3>
            <div className="flex items-center justify-between">
                <div className="relative w-32 h-32 flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle cx="50" cy="50" r="40" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="12" fill="none" />
                        {/* Food */}
                        <circle cx="50" cy="50" r="40" className="stroke-primary" strokeWidth="12" fill="none" strokeDasharray="251.2" strokeDashoffset="100.48" />
                        {/* Transport */}
                        <circle cx="50" cy="50" r="40" className="stroke-tertiary" strokeWidth="12" fill="none" strokeDasharray="251.2" strokeDashoffset="200.96" />
                        {/* Shopping */}
                        <circle cx="50" cy="50" r="40" className="stroke-blue-400" strokeWidth="12" fill="none" strokeDasharray="251.2" strokeDashoffset="226.08" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-2xl font-bold text-on-surface">65%</span>
                        <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Spent</span>
                    </div>
                </div>

                <div className="flex flex-col gap-4 w-full ml-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-primary"></div>
                            <span className="text-sm font-semibold text-on-surface-variant">Food</span>
                        </div>
                        <span className="font-bold text-on-surface">45%</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-tertiary"></div>
                            <span className="text-sm font-semibold text-on-surface-variant">Transport</span>
                        </div>
                        <span className="font-bold text-on-surface">30%</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                            <span className="text-sm font-semibold text-on-surface-variant">Shopping</span>
                        </div>
                        <span className="font-bold text-on-surface">15%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
