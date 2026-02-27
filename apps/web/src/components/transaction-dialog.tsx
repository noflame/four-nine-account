import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { useApiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ArrowRightLeft, TrendingDown, TrendingUp, Loader2, CreditCard, Wallet } from "lucide-react";

type TransactionType = 'expense' | 'income' | 'transfer';

interface TransactionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    transactionToEdit?: any;
}

export function TransactionDialog({ open, onOpenChange, onSuccess, transactionToEdit }: TransactionDialogProps) {
    const { user } = useAuth();
    const { getClient } = useApiClient();
    const [type, setType] = useState<TransactionType>('expense');
    const [loading, setLoading] = useState(false);

    // Data states
    const [accounts, setAccounts] = useState<any[]>([]);
    const [cards, setCards] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);

    // Form states
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [categoryId, setCategoryId] = useState<number | undefined>();
    const [sourceAccountId, setSourceAccountId] = useState<number | undefined>();
    const [destinationAccountId, setDestinationAccountId] = useState<number | undefined>();

    // Credit Card Specific
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>('cash');
    const [selectedCardId, setSelectedCardId] = useState<number | undefined>();
    const [installments, setInstallments] = useState(1);

    // Icon helper (duplicated for now, should be utility)
    const getIconLabel = (iconId: string) => {
        const icons: Record<string, string> = {
            'utensils': '🍱', 'bus': '🚌', 'home': '🏠', 'gamepad-2': '🎮',
            'shopping-bag': '🛍️', 'heart-pulse': '🏥', 'graduation-cap': '🎓',
            'briefcase': '💼', 'gift': '🎁', 'trending-up': '📈',
            'more-horizontal': '⋯', 'coffee': '☕', 'paw-print': '🐾',
            'plane': '✈️', 'music': '🎵', 'video': '🎬', 'book': '📚',
            'dumbbell': '🏋️', 'smartphone': '📱', 'wifi': '📶'
        };
        return icons[iconId] || '⋯';
    };

    // Fetch dependencies
    useEffect(() => {
        if (open && user) {
            const fetchData = async () => {
                const client = await getClient();

                const [accRes, catRes, cardRes] = await Promise.all([
                    client.api.assets.$get(),
                    client.api.categories.$get(),
                    client.api.cards.$get()
                ]);

                if (accRes.ok) {
                    const accs = await accRes.json();
                    setAccounts(accs);
                    if (accs.length > 0 && !transactionToEdit) {
                        setSourceAccountId(accs[0].id);
                        setDestinationAccountId(accs[0].id);
                    }
                }
                if (catRes.ok) setCategories(await catRes.json());
                if (cardRes.ok) {
                    const crds = await cardRes.json();
                    setCards(crds);
                    if (crds.length > 0 && !transactionToEdit) {
                        setSelectedCardId(crds[0].id);
                    }
                }
            };
            fetchData();
        }
    }, [open, user, transactionToEdit]);

    // Pre-populate form when editing
    useEffect(() => {
        if (open) {
            if (transactionToEdit) {
                // Editing mode
                // Determine transaction type based on fields
                // Default API returns full objects, we need IDs
                setType(transactionToEdit.creditCardId ? 'expense' :
                    (transactionToEdit.sourceAccountId && !transactionToEdit.destinationAccountId) ? 'expense' :
                        (!transactionToEdit.sourceAccountId && transactionToEdit.destinationAccountId) ? 'income' : 'transfer');

                // Wait for type state to settle? Actually better to set all at once
                // But type change triggers reset... so we need to bypass reset logic or set after
                // Let's modify the reset logic to check if we are just opening edit mode
            } else {
                // New mode - reset is handled by type change effect usually, but we need clean slate
                setAmount("");
                setDescription("");
                setDate(new Date().toISOString().split('T')[0]);
                // other fields are reset by type change effect
            }
        }
    }, [open, transactionToEdit]);

    // Handle initial data population after type matches
    useEffect(() => {
        if (open && transactionToEdit) {
            // Force type first (redundant if already set above but ensures consistency)
            // No, setting type triggers reset. We need to handle this carefully.
            // Better approach: combine reset and population logic.
        }
    }, [open, transactionToEdit]);

    // REWRITE: Combined effect for form state management
    useEffect(() => {
        if (open) {
            if (transactionToEdit) {
                const tx = transactionToEdit;
                // Determine Type
                let newType: TransactionType = 'expense';
                if (!tx.sourceAccountId && tx.destinationAccountId) newType = 'income';
                else if (tx.sourceAccountId && tx.destinationAccountId) newType = 'transfer';

                setType(newType);
                setAmount((tx.amount / 10000).toString());
                setDescription(tx.description);
                setDate(new Date(tx.date).toISOString().split('T')[0]);
                setCategoryId(tx.categoryId);

                // Account logic
                setSourceAccountId(tx.sourceAccountId);
                setDestinationAccountId(tx.destinationAccountId);

                // Credit Card logic
                if (tx.creditCardId) {
                    setPaymentMethod('credit');
                    setSelectedCardId(tx.creditCardId);
                    // Installment logic omitted for simple edit, defaults to 1 or existing?
                    // API returns installment object if exists.
                    // For now let's just default to 1 or try to extract from tx.installment
                    if (tx.installment) {
                        setInstallments(tx.installment.totalMonths);
                    } else {
                        setInstallments(1);
                    }
                } else {
                    setPaymentMethod('cash');
                    setSelectedCardId(undefined);
                    setInstallments(1);
                }
            } else {
                // Reset for new entry
                // Only reset basic fields, type specific reset handled by [type] effect
                setAmount("");
                setDescription("");
                setDate(new Date().toISOString().split('T')[0]);
            }
        }
    }, [open, transactionToEdit]);

    // Reset form when type changes - modified to avoid clearing when setting initial type for edit
    useEffect(() => {
        // Only reset if we are NOT currently populating an edit form
        // Simple heuristic: check if transactionToEdit matches current type? 
        // Or just let user fix it if they switch types during edit.
        // Actually, if user switches type during edit, they probably want a reset.
        // But the initial render triggers type change. 
        // We can check if the current state MATCHES the edit target.
        if (transactionToEdit) {
            // If we are editing, and type matches the transaction's implied type, DON'T reset.
            // If user manually switched type, DO reset.
            // This is tricky. Let's trust the user or just re-populate?
            // Simplest: only reset if NOT open? No.
            // Let's skip reset logic here and handle it manually or assume [open] effect overrides.
            // But [type] dependency will fire after [open] effect sets type.
            // Workaround: Don't use [type] effect for reset. Reset implicitly when switching UI tabs?
            // No, UI tabs call setType.
            return;
        }

        setCategoryId(undefined);

        // When type changes, maintain smartly selected defaults
        if (accounts.length > 0) {
            setSourceAccountId(accounts[0].id);
            setDestinationAccountId(accounts[0].id);
        } else {
            setSourceAccountId(undefined);
            setDestinationAccountId(undefined);
        }

        setPaymentMethod('cash');
        if (cards.length > 0) {
            setSelectedCardId(cards[0].id);
        } else {
            setSelectedCardId(undefined);
        }
        setInstallments(1);
    }, [type, accounts, cards, transactionToEdit]); // Needs to be careful with this loop

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            const client = await getClient();

            let finalDescription = description.trim();
            if (!finalDescription && categoryId) {
                const category = categories.find(c => c.id === categoryId);
                if (category) finalDescription = category.name;
            }

            // Fallback for transfer
            if (!finalDescription && type === 'transfer') {
                finalDescription = 'Transfer';
            }

            const payload: any = {
                type,
                amount: parseFloat(amount),
                date,
                description: finalDescription,
                categoryId,
                sourceAccountId,
                destinationAccountId
            };

            // Inject Credit Card logic
            if (type === 'expense' && paymentMethod === 'credit') {
                payload.sourceAccountId = undefined; // Force null
                payload.creditCardId = selectedCardId;
                payload.installmentTotalMonths = installments;
            }



            let res;
            if (transactionToEdit) {
                // Edit (PUT)
                res = await client.api.transactions[':id'].$put({
                    param: { id: transactionToEdit.id.toString() },
                    json: payload
                });
            } else {
                // Create (POST)
                res = await client.api.transactions.$post({ json: payload });
            }

            if (res.ok) {
                onOpenChange(false);
                // Reset form
                setAmount("");
                setDescription("");
                setDate(new Date().toISOString().split('T')[0]);
                if (onSuccess) onSuccess();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-center">{transactionToEdit ? "Edit Transaction" : "New Transaction"}</DialogTitle>
                    <DialogDescription className="text-center">
                        {transactionToEdit ? "Modify transaction details." : "Record a new expense, income, or transfer."}
                    </DialogDescription>
                </DialogHeader>

                {/* Type Switcher */}
                <div className="flex bg-muted p-1 rounded-lg mb-4">
                    <button
                        type="button"
                        className={cn(
                            "flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all",
                            type === 'expense' ? "bg-background text-red-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => setType('expense')}
                    >
                        <TrendingDown className="w-4 h-4 mr-1" />
                        Expense
                    </button>
                    <button
                        type="button"
                        className={cn(
                            "flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all",
                            type === 'income' ? "bg-background text-green-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => setType('income')}
                    >
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Income
                    </button>
                    <button
                        type="button"
                        className={cn(
                            "flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all",
                            type === 'transfer' ? "bg-background text-blue-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => setType('transfer')}
                    >
                        <ArrowRightLeft className="w-4 h-4 mr-1" />
                        Transfer
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Amount */}
                    <div className="space-y-2">
                        <Label>Amount</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                            <Input
                                type="number"
                                step="any"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pl-7 text-2xl font-bold h-14"
                                placeholder="0"
                                autoFocus
                                required
                            />
                        </div>
                    </div>

                    {/* Date & Description */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Auto from category"
                            />
                        </div>
                    </div>

                    {/* EXPENSE: Payment Method Toggle */}
                    {type === 'expense' && (
                        <div className="bg-muted/30 p-3 rounded-lg space-y-3">
                            <Label className="text-xs font-semibold uppercase text-muted-foreground">Payment Method</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                                    className="flex-1"
                                    onClick={() => setPaymentMethod('cash')}
                                >
                                    <Wallet className="mr-2 h-4 w-4" /> Cash / Account
                                </Button>
                                <Button
                                    type="button"
                                    variant={paymentMethod === 'credit' ? 'default' : 'outline'}
                                    className="flex-1"
                                    onClick={() => setPaymentMethod('credit')}
                                >
                                    <CreditCard className="mr-2 h-4 w-4" /> Credit Card
                                </Button>
                            </div>

                            {/* Cash Mode: Account Select */}
                            {paymentMethod === 'cash' && (
                                <div className="space-y-2">
                                    <Label>Account</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={sourceAccountId || ''}
                                        onChange={(e) => setSourceAccountId(Number(e.target.value))}
                                        required={paymentMethod === 'cash'}
                                    >
                                        <option value="" disabled>Select Source</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Credit Mode: Card Select & Installments */}
                            {paymentMethod === 'credit' && (
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <Label>Credit Card</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={selectedCardId || ''}
                                            onChange={(e) => setSelectedCardId(Number(e.target.value))}
                                            required={paymentMethod === 'credit'}
                                        >
                                            <option value="" disabled>Select Card</option>
                                            {cards.map(card => (
                                                <option key={card.id} value={card.id}>{card.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Installments</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={installments}
                                            onChange={(e) => setInstallments(Number(e.target.value))}
                                        >
                                            <option value={1}>Full Payment (1 month)</option>
                                            <option value={3}>3 Months</option>
                                            <option value={6}>6 Months</option>
                                            <option value={12}>12 Months</option>
                                            <option value={24}>24 Months</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* INCOME / TRANSFER: Simple Account Selects */}
                    {(type === 'income' || type === 'transfer') && (
                        <div className="space-y-2">
                            <Label>{type === 'income' ? 'To Account' : 'To (Destination)'}</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={destinationAccountId || ''}
                                onChange={(e) => setDestinationAccountId(Number(e.target.value))}
                                required
                            >
                                <option value="" disabled>Select Destination</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {type === 'transfer' && (
                        <div className="space-y-2">
                            <Label>From (Source)</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={sourceAccountId || ''}
                                onChange={(e) => setSourceAccountId(Number(e.target.value))}
                                required
                            >
                                <option value="" disabled>Select Source</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Categories (Expense/Income only) */}
                    {type !== 'transfer' && (
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <div className="grid grid-cols-4 gap-2">
                                {categories.filter(c => c.type === type).map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setCategoryId(cat.id)}
                                        className={cn(
                                            "flex flex-col items-center p-2 rounded-md border text-xs transition-colors",
                                            categoryId === cat.id
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-transparent bg-muted/50 hover:bg-muted"
                                        )}
                                    >
                                        <span className="mb-1 text-lg">
                                            {getIconLabel(cat.icon)}
                                        </span>
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                            <input type="hidden" required value={categoryId || ''} />
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Transaction
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
