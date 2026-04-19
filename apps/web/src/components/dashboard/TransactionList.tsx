export function TransactionList({ transactions }: { transactions: any[] }) {
    // Map backend transactions to frontend format
    // Since we don't have categories in the payload yet, we'll use fallbacks.
    const mappedTransactions = transactions.map((tx: any) => ({
        id: tx.id,
        title: tx.description || 'Transaction',
        category: 'General', // Fallback
        amount: (tx.amount / 10000) * (tx.sourceAccountId ? -1 : 1), // Simplistic logic: if source is present it's an expense? No wait, if sourceAccount is present AND NO destination, it's an expense.
        time: new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        icon: 'receipt_long',
        iconColor: 'text-slate-600',
        iconBg: 'bg-slate-100 dark:bg-slate-800'
    }));

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-headline font-bold text-lg text-on-surface">Recent Transactions</h3>
                <button className="text-primary font-semibold text-sm hover:underline">See All</button>
            </div>

            <div className="flex flex-col gap-5">
                {mappedTransactions.length === 0 && (
                    <p className="text-on-surface-variant text-sm">No recent transactions.</p>
                )}
                {mappedTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.iconBg} transition-transform group-hover:scale-105 duration-300`}>
                                <span className={`material-symbols-outlined ${tx.iconColor}`}>{tx.icon}</span>
                            </div>
                            <div>
                                <p className="font-bold text-on-surface">{tx.title}</p>
                                <p className="text-sm text-on-surface-variant mt-0.5">{tx.category} • {tx.time}</p>
                            </div>
                        </div>
                        <div className={`font-bold text-lg ${tx.amount > 0 ? 'text-primary' : 'text-on-surface'}`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
