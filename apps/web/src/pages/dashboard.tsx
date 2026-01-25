import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { hc } from "hono/client";
import { AppType } from "@lin-fan/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CreditCard, TrendingUp, Activity } from "lucide-react";

export default function DashboardPage() {
    const { user } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const token = await user.getIdToken();
                const client = hc<AppType>('/api', { headers: { Authorization: `Bearer ${token}` } }) as any;
                const res = await client.dashboard.$get();
                if (res.ok) {
                    setData(await res.json());
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    if (loading) {
        return <div className="p-8">Loading dashboard...</div>;
    }

    if (!data) {
        return <div className="p-8">Failed to load data</div>;
    }

    return (
        <div className="space-y-6 pb-20">
            <h1 className="text-3xl font-bold tracking-tight">Financial Overview</h1>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${data.netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${(data.netWorth / 10000).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Assets - Liabilities
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            ${(data.totalAssets / 10000).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Cash & bank accounts
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            ${(data.totalLiabilities / 10000).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Credit card utilization
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Spending</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${(data.monthlyExpenses / 10000).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Expenses this month
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Recent Activity</h2>
                <div className="space-y-2">
                    {data.recentTransactions.map((tx: any) => (
                        <div key={tx.id} className="flex items-center justify-between p-4 bg-card rounded-lg border">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-full ${tx.creditCardId ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {tx.creditCardId ? <CreditCard className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                                </div>
                                <div>
                                    <p className="font-medium">{tx.description || "Untitled Transaction"}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className={`font-bold ${
                                // Logic for color: 
                                // 1. Expense (Source set, Dest null) -> Red
                                // 2. Income (Source null, Dest set) -> Green
                                // 3. Payment to Card (Source set, CreditCard set) -> Neutral/Blue? (It's transfer)
                                // 4. Card Expense (CreditCard set, Source null) -> Red

                                (tx.sourceAccountId && !tx.destinationAccountId && !tx.creditCardId) || (tx.creditCardId && !tx.sourceAccountId)
                                    ? 'text-red-600'
                                    : (!tx.sourceAccountId && tx.destinationAccountId)
                                        ? 'text-green-600'
                                        : 'text-gray-900 dark:text-gray-100'
                                }`}>
                                {
                                    // Sign logic
                                    ((tx.sourceAccountId && !tx.destinationAccountId && !tx.creditCardId) || (tx.creditCardId && !tx.sourceAccountId)) ? '-' :
                                        (!tx.sourceAccountId && tx.destinationAccountId) ? '+' : ''
                                }
                                ${(tx.amount / 10000).toLocaleString()}
                            </div>
                        </div>
                    ))}
                    {data.recentTransactions.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">No recent activity</div>
                    )}
                </div>
            </div>
        </div>
    );
}
