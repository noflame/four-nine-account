export function TransactionList() {
    const transactions = [
        {
            id: 1,
            title: 'Starbucks Coffee',
            category: 'Food & Dining',
            amount: -5.40,
            time: '08:30 AM',
            icon: 'coffee',
            iconColor: 'text-amber-600',
            iconBg: 'bg-amber-100 dark:bg-amber-900/30'
        },
        {
            id: 2,
            title: 'Uber Ride',
            category: 'Transport',
            amount: -24.50,
            time: '09:15 AM',
            icon: 'directions_car',
            iconColor: 'text-blue-600',
            iconBg: 'bg-blue-100 dark:bg-blue-900/30'
        },
        {
            id: 3,
            title: 'Salary Deposit',
            category: 'Income',
            amount: 4250.00,
            time: '11:00 AM',
            icon: 'account_balance',
            iconColor: 'text-emerald-600',
            iconBg: 'bg-emerald-100 dark:bg-emerald-900/30'
        }
    ];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-headline font-bold text-lg text-on-surface">Recent Transactions</h3>
                <button className="text-primary font-semibold text-sm hover:underline">See All</button>
            </div>

            <div className="flex flex-col gap-5">
                {transactions.map((tx) => (
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
