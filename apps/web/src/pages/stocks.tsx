import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { hc } from "hono/client";
import { AppType } from "@lin-fan/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StockDialog } from "@/components/stock-dialog";
import { Plus, TrendingUp } from "lucide-react";

export default function StocksPage() {
    const { user } = useAuth();
    const [holdings, setHoldings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const fetchHoldings = async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const apiUrl = import.meta.env.VITE_API_URL || '/api';
            const client = hc<AppType>(apiUrl, {
                headers: { Authorization: `Bearer ${token}` }
            }) as any;

            const res = await client.stocks.$get();
            if (res.ok) {
                const data = await res.json();
                setHoldings(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHoldings();
    }, [user]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val / 10000);
    };

    // Calculate Total Cost Basis
    const totalCostBasis = holdings.reduce((acc, stock) => acc + ((stock.shares * stock.avgCost) / 10000), 0) / 10000;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Investments</h1>
                <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Trade Stock
                </Button>
            </div>

            {/* Summary Card */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Cost Basis</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalCostBasis * 10000)}</div>
                        <p className="text-xs text-muted-foreground">Across {holdings.length} positions</p>
                    </CardContent>
                </Card>
            </div>

            {/* Holdings List */}
            <div className="grid gap-4">
                {loading ? (
                    <div>Loading...</div>
                ) : holdings.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10">No stock holdings found. Start trading!</div>
                ) : (
                    <div className="rounded-md border">
                        <div className="grid grid-cols-5 gap-4 p-4 font-medium border-b bg-muted/50">
                            <div>Ticker</div>
                            <div>Owner</div>
                            <div className="text-right">Shares</div>
                            <div className="text-right">Avg Cost</div>
                            <div className="text-right">Cost Basis</div>
                        </div>
                        {holdings.map((stock) => {
                            const costBasis = (stock.shares * stock.avgCost) / 10000;
                            return (
                                <div key={stock.id} className="grid grid-cols-5 gap-4 p-4 border-b last:border-0 items-center hover:bg-muted/50 transition-colors">
                                    <div className="font-bold">{stock.ticker}</div>
                                    <div className="text-sm bg-secondary px-2 py-1 rounded w-fit">{stock.ownerLabel}</div>
                                    <div className="text-right">{stock.shares / 10000}</div>
                                    <div className="text-right">{formatCurrency(stock.avgCost)}</div>
                                    <div className="text-right font-medium">{formatCurrency(costBasis)}</div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <StockDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSuccess={fetchHoldings}
            />
        </div>
    );
}
