import { HeroSection } from "@/components/dashboard/HeroSection";
import { SegmentedControl } from "@/components/dashboard/SegmentedControl";
import { TransactionList } from "@/components/dashboard/TransactionList";
import { ExpenseAnalysisCard } from "@/components/dashboard/ExpenseAnalysisCard";
import { CreditLimitCard } from "@/components/dashboard/CreditLimitCard";
import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/lib/api";

export default function DashboardPage() {
    const { getClient } = useApiClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['dashboard-data'],
        queryFn: async () => {
            const client = await getClient();
            const res = await client.api.dashboard.$get();
            if (!res.ok) {
                throw new Error('Failed to fetch dashboard data');
            }
            return await res.json();
        }
    });

    if (isLoading) {
        return (
            <div className="px-4 max-w-7xl mx-auto mt-4 animate-pulse">
                {/* Hero Skeleton */}
                <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-[2rem] mt-4 mb-8"></div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
                    <div className="lg:col-span-7 flex flex-col gap-6">
                        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-full w-64"></div>
                        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-[2rem]"></div>
                    </div>
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-[2rem]"></div>
                        <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-[2rem]"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="px-4 max-w-7xl mx-auto mt-8">
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-6 rounded-[2rem] border border-red-100 dark:border-red-800 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-lg mb-1">Failed to load dashboard</h3>
                        <p className="text-sm opacity-90">{error instanceof Error ? error.message : 'Unknown error occurred'}</p>
                    </div>
                    <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-100 dark:bg-red-800/50 hover:bg-red-200 dark:hover:bg-red-800 rounded-xl font-bold transition-colors">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Default fallbacks if API structure changes or data is empty
    const dashboardData = data as any; // Type workaround if AppType doesn't perfectly match

    return (
        <div className="px-4 max-w-7xl mx-auto mt-4">
            {/* Hero Section */}
            <HeroSection 
                netWorth={dashboardData?.netWorth ?? 0}
                monthlyGrowth={dashboardData?.monthlyGrowth ?? 0}
                liquidCash={dashboardData?.liquidCash ?? 0}
            />

            {/* Main Content Area - Responsive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
                
                {/* Left Column: Transactions */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    <SegmentedControl />
                    <TransactionList transactions={dashboardData?.recentTransactions ?? []} />
                </div>
                
                {/* Right Column: Insights & Cards */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <ExpenseAnalysisCard monthlyExpenses={dashboardData?.monthlyExpenses ?? 0} />
                    <CreditLimitCard 
                        totalCreditLimit={dashboardData?.totalCreditLimit ?? 0} 
                        usedCredit={dashboardData?.usedCredit ?? 0} 
                    />
                </div>
                
            </div>
        </div>
    );
}
