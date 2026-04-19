export function AssetsHero({ netWorth, monthlyGrowth }: { netWorth: number, monthlyGrowth: number }) {
    return (
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary to-surface-tint p-8 text-on-primary shadow-xl">
            <div className="relative z-10 flex flex-col gap-6">
                <div>
                    <h3 className="text-on-primary/80 font-medium tracking-wide text-sm font-inter uppercase">
                        Total Net Worth
                    </h3>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-semibold opacity-90">$</span>
                        <span className="text-5xl font-black tracking-tight font-headline">
                            {(netWorth / 10000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full w-fit">
                        <span className="material-symbols-outlined text-sm">{monthlyGrowth >= 0 ? 'trending_up' : 'trending_down'}</span>
                        <span className="text-sm font-bold">{monthlyGrowth > 0 ? '+' : ''}{monthlyGrowth}%</span>
                    </div>
                    <span className="text-sm text-on-primary/80">vs last month</span>
                </div>
            </div>

            {/* Decorative background elements */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-32 -left-10 w-72 h-72 bg-tertiary-container/20 rounded-full blur-3xl"></div>
        </div>
    );
}
