import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { hc } from "hono/client";
import { AppType } from "@lin-fan/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, ArrowRightLeft, TrendingUp, TrendingDown } from "lucide-react";

export default function TransactionsPage() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTransactions = async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const client = hc<AppType>('/api', {
                headers: { Authorization: `Bearer ${token}` }
            }) as any;

            const res = await client.transactions.$get();
            if (res.ok) {
                const data = await res.json();
                setTransactions(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();

        // Listen for updates from FAB
        const handleUpdate = () => fetchTransactions();
        window.addEventListener('transaction-updated', handleUpdate);
        return () => window.removeEventListener('transaction-updated', handleUpdate);
    }, [user]);

    const handleDelete = async (id: number) => {
        if (!user) return;
        if (!confirm("Are you sure you want to delete this transaction? Balance will be reverted.")) return;

        try {
            const token = await user.getIdToken();
            const client = hc<AppType>('/api', {
                headers: { Authorization: `Bearer ${token}` }
            }) as any;

            const res = await client.transactions[':id'].$delete({
                param: { id: id.toString() }
            });

            if (res.ok) {
                // Determine if we need to notify other components (like assets) to update balance
                window.dispatchEvent(new Event('transaction-updated'));
                fetchTransactions();
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div>Loading transactions...</div>;

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('zh-TW');
    };

    const formatAmount = (amount: number, currency = 'TWD') => {
        return new Intl.NumberFormat('zh-TW', {
            style: 'currency',
            currency: currency
        }).format(amount / 10000);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>

            <div className="space-y-4">
                {transactions.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10">No transactions found.</div>
                ) : (
                    transactions.map((tx) => (
                        <Card key={tx.id}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-full ${tx.sourceAccountId && tx.destinationAccountId ? 'bg-blue-100 text-blue-600' :
                                        tx.destinationAccountId ? 'bg-green-100 text-green-600' :
                                            'bg-red-100 text-red-600'
                                        }`}>
                                        {tx.sourceAccountId && tx.destinationAccountId ? <ArrowRightLeft className="w-5 h-5" /> :
                                            tx.destinationAccountId ? <TrendingUp className="w-5 h-5" /> :
                                                <TrendingDown className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <div className="font-medium">{tx.description || (tx.category ? tx.category.name : 'Transfer')}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {formatDate(tx.date)} •
                                            {tx.sourceAccountId && tx.destinationAccountId ? (
                                                <span> {tx.sourceAccount?.name} → {tx.destinationAccount?.name}</span>
                                            ) : tx.sourceAccountId ? (
                                                <span> {tx.sourceAccount?.name}</span>
                                            ) : (
                                                <span> {tx.destinationAccount?.name}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`font-bold ${tx.sourceAccountId && tx.destinationAccountId ? 'text-blue-600' :
                                        tx.destinationAccountId ? 'text-green-600' :
                                            'text-red-600'
                                        }`}>
                                        {tx.sourceAccountId && tx.destinationAccountId ? '' :
                                            tx.destinationAccountId ? '+' : '-'}
                                        {formatAmount(tx.amount)}
                                    </span>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(tx.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
