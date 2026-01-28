import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { useLedger } from "@/components/ledger-provider";
import { useApiClient } from "@/lib/api";
import { TransactionDialog } from "@/components/transaction-dialog";
import { TransactionCard } from "@/components/transaction-card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function TransactionsPage() {
    const { user } = useAuth();
    const { currentLedgerId } = useLedger();
    const { getClient } = useApiClient();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingTransaction, setEditingTransaction] = useState<any>(null); // State for edit
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState<number | null>(null);


    const fetchTransactions = async () => {
        if (!user) return;
        try {
            const client = await getClient();
            const res = await client.api.transactions.$get();
            if (res.ok) {
                const data = await res.json();
                console.log("Fetched transactions:", data); // Debug log
                if (Array.isArray(data)) {
                    setTransactions(data);
                } else {
                    console.error("Transactions data is not an array:", data);
                    setTransactions([]);
                }
            } else {
                console.error("Failed to fetch transactions:", await res.text());
            }
        } catch (err) {
            console.error("Error fetching transactions:", err);
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
    }, [user, currentLedgerId]);

    const handleDeleteClick = (id: number) => {
        if (!user) return;
        setTransactionToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!user || !transactionToDelete) return;

        try {
            const client = await getClient();

            const res = await client.api.transactions[':id'].$delete({
                param: { id: transactionToDelete.toString() }
            });

            if (res.ok) {
                // Determine if we need to notify other components (like assets) to update balance
                window.dispatchEvent(new Event('transaction-updated'));
                fetchTransactions();
                setDeleteDialogOpen(false);
                setTransactionToDelete(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div>Loading transactions...</div>;

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('zh-TW');
    };



    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>

            <div className="space-y-4">
                {transactions.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10">No transactions found.</div>
                ) : (
                    transactions.map((tx) => {
                        let type: "payment" | "expense" | "income" | "transfer" = "expense";
                        let amount = tx.amount / 10000;
                        const isTransfer = tx.sourceAccountId && tx.destinationAccountId;
                        const isPayment = tx.sourceAccountId && tx.creditCardId;
                        const isIncome = !tx.sourceAccountId && tx.destinationAccountId;

                        if (isPayment) type = "payment";
                        else if (isTransfer) type = "transfer";
                        else if (isIncome) type = "income";

                        // Fix amount sign for display based on type
                        if (type === 'expense') amount = -amount;
                        // Income is positive. Transfer is just amount. Payment is just amount (or negative?). 
                        // Let's rely on component logic: isNegative checks amount < 0.
                        // Expense -> Negative
                        // Income -> Positive
                        // Payment -> Should show as reducing asset? Or neutral? User's component logic: isNegative shows Red '-' else Green '+'.
                        // Payment is usually "Spent" from bank, so negative? But User wanted Purple icon.
                        // Color logic in component handles icon, but amount color is Red/Green based on sign.
                        // Detailed Logic:
                        // Expense: Red, -, Red Icon
                        // Income: Green, +, Green Icon
                        // Transfer: Blue Icon, Blue Text (I added this logic in component).
                        // Payment: Purple Icon. Amount Color? Usually Money Leaving Account. So Red?
                        // If I pass negative amount, it will show Red text with '-'.
                        if (type === 'payment') amount = -amount;

                        return (
                            <TransactionCard
                                key={tx.id}
                                title={tx.description || (tx.category ? tx.category.name : 'Transfer')}
                                date={formatDate(tx.date)}
                                amount={amount}
                                fromAccount={tx.sourceAccount?.name}
                                toAccount={isPayment ? tx.creditCard?.name : tx.destinationAccount?.name || tx.creditCard?.name} // Fallback for card expense?
                                category={tx.category?.name}
                                user={tx.user?.name}
                                type={type}
                                onEdit={() => setEditingTransaction(tx)}
                                onDelete={() => handleDeleteClick(tx.id)}
                            />
                        )
                    })
                )}
            </div>


            {/* Edit Dialog */}
            {editingTransaction && (
                <TransactionDialog
                    open={true}
                    onOpenChange={(open) => !open && setEditingTransaction(null)}
                    transactionToEdit={editingTransaction}
                    onSuccess={() => {
                        fetchTransactions();
                        setEditingTransaction(null);
                    }}
                />
            )}

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will delete the transaction and revert any balance changes.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
}
