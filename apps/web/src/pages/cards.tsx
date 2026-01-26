import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { useLedger } from "@/components/ledger-provider";
import { useApiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Plus, Calendar, DollarSign, Pencil, Trash2 } from "lucide-react";

import { toast } from "sonner";
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

export default function CardsPage() {
    const { user } = useAuth();
    const { currentLedgerId } = useLedger();
    const { getClient } = useApiClient();
    const [cards, setCards] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]); // For paying off
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);

    const [isPayOpen, setIsPayOpen] = useState(false);
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);

    // New Card Form
    const [newName, setNewName] = useState("");
    const [newBillingDay, setNewBillingDay] = useState("");
    const [newPaymentDay, setNewPaymentDay] = useState("");
    const [editingCard, setEditingCard] = useState<any>(null); // For edit mode
    const [newCreditLimit, setNewCreditLimit] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Pay Form
    const [selectedCard, setSelectedCard] = useState<any>(null);
    const [paySourceId, setPaySourceId] = useState<string>("");
    const [payAmount, setPayAmount] = useState<string>("");
    const [paying, setPaying] = useState(false);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const client = await getClient();

            const [cardsRes, accountsRes] = await Promise.all([
                client.cards.$get(),
                client.assets.$get()
            ]);

            if (cardsRes.ok) setCards(await cardsRes.json());
            if (accountsRes.ok) setAccounts(await accountsRes.json());

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user, currentLedgerId]);



    const handleOpenEdit = (card: any) => {
        setEditingCard(card);
        setNewName(card.name);
        setNewBillingDay(card.billingDay.toString());
        setNewPaymentDay(card.paymentDay.toString());
        setNewCreditLimit(card.creditLimit ? (card.creditLimit / 10000).toString() : "");
        setIsAddOpen(true);
    };

    const handleSubmitCard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSubmitting(true);
        try {
            const client = await getClient();

            let res;
            if (editingCard) {
                // Edit (PUT)
                res = await client.cards[':id'].$put({
                    param: { id: editingCard.id.toString() },
                    json: {
                        name: newName,
                        billingDay: parseInt(newBillingDay),
                        paymentDay: parseInt(newPaymentDay),
                        creditLimit: parseFloat(newCreditLimit || "0")
                    }
                });
            } else {
                // Add (POST)
                res = await client.cards.$post({
                    json: {
                        name: newName,
                        billingDay: parseInt(newBillingDay),
                        paymentDay: parseInt(newPaymentDay),
                        creditLimit: parseFloat(newCreditLimit || "0")
                    }
                });
            }

            if (res.ok) {
                setIsAddOpen(false);
                setEditingCard(null); // Reset
                setNewName("");
                setNewBillingDay("");
                setNewPaymentDay("");
                setNewCreditLimit("");
                fetchData();
                toast.success(editingCard ? "Card updated successfully" : "Card created successfully");
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to save card");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteCard = () => {
        setDeleteAlertOpen(true);
    };

    const confirmDeleteCard = async () => {
        if (!user || !editingCard) return;
        setSubmitting(true);
        try {
            const client = await getClient();
            const res = await client.cards[':id'].$delete({
                param: { id: editingCard.id.toString() }
            });

            if (res.ok) {
                setIsAddOpen(false);
                setDeleteAlertOpen(false);
                setEditingCard(null);
                fetchData();
                toast.success("Card deleted successfully");
            } else {
                const error = await res.json();
                toast.error(`Cannot delete card: ${error.error}`);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete card");
        } finally {
            setSubmitting(false);
            setDeleteAlertOpen(false);
        }
    };

    const handleOpenPay = (card: any) => {
        setSelectedCard(card);
        setPayAmount((card.balance / 10000).toString());
        setIsPayOpen(true);
    };

    const handlePayCard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !selectedCard) return;
        setPaying(true);
        try {
            const client = await getClient();

            const res = await client.cards[':id'].pay.$post({
                param: { id: selectedCard.id.toString() },
                json: {
                    sourceAccountId: parseInt(paySourceId),
                    amount: parseFloat(payAmount) * 10000,
                    date: new Date().toISOString()
                }
            });

            if (res.ok) {
                setIsPayOpen(false);
                fetchData();
                toast.success("Payment successful");
            } else {
                toast.error("Payment failed: Insufficient funds or error");
            }
        } catch (err) {
            console.error(err);
            toast.error("Payment failed");
        } finally {
            setPaying(false);
        }
    };

    if (loading) return <div>Loading cards...</div>;

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Credit Cards</h1>
                <Dialog open={isAddOpen} onOpenChange={(open) => {
                    setIsAddOpen(open);
                    if (!open) {
                        setEditingCard(null);
                        setNewName("");
                        setNewBillingDay("");
                        setNewPaymentDay("");
                        setNewCreditLimit("");
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button className="gap-2" onClick={() => setEditingCard(null)}>
                            <Plus className="h-4 w-4" /> Add Card
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingCard ? "Edit Credit Card" : "Add New Credit Card"}</DialogTitle>
                            <DialogDescription>
                                {editingCard ? "Update credit card details." : "Enter details for a new credit card."}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmitCard} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Card Name</Label>
                                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Visa Signature" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Billing Day</Label>
                                    <Input
                                        type="number" min="1" max="31"
                                        value={newBillingDay} onChange={e => setNewBillingDay(e.target.value)}
                                        placeholder="DD" required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Payment Day</Label>
                                    <Input
                                        type="number" min="1" max="31"
                                        value={newPaymentDay} onChange={e => setNewPaymentDay(e.target.value)}
                                        placeholder="DD" required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Credit Limit (Optional)</Label>
                                <Input
                                    type="number" step="1000"
                                    value={newCreditLimit} onChange={e => setNewCreditLimit(e.target.value)}
                                    placeholder="e.g. 50000"
                                />
                            </div>

                            <div className="flex gap-2">
                                {editingCard && (
                                    <Button type="button" variant="destructive" className="flex-none" onClick={handleDeleteCard} disabled={submitting}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                                <Button type="submit" className="flex-1" disabled={submitting}>
                                    {submitting ? "Saving..." : (editingCard ? "Save Changes" : "Add Card")}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {cards.map(card => (
                    <Card key={card.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {card.name}
                            </CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-start">
                                <div className="text-2xl font-bold text-red-600">
                                    ${(card.balance / 10000).toLocaleString()}
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(card)}>
                                    <Pencil className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Bill: {card.billingDay}th / Due: {card.paymentDay}th
                            </p>

                            {/* Credit Limit & Progress */}
                            {card.creditLimit > 0 && (
                                <div className="mt-3">
                                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                        <span>Util: {Math.min(100, Math.round((card.balance / card.creditLimit) * 100))}%</span>
                                        <span>Limit: ${(card.creditLimit / 10000).toLocaleString()}</span>
                                    </div>
                                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-red-500 rounded-full transition-all"
                                            style={{ width: `${Math.min(100, (card.balance / card.creditLimit) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => handleOpenPay(card)}>
                                <DollarSign className="mr-2 h-4 w-4" /> Pay Bill
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Pay Dialog */}
            <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Pay Credit Card Bill</DialogTitle>
                        <DialogDescription>Pay off balance for {selectedCard?.name}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePayCard} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Payment Source</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={paySourceId}
                                onChange={e => setPaySourceId(e.target.value)}
                                required
                            >
                                <option value="">Select Account</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name} (${(acc.balance / 10000).toLocaleString()})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Amount</Label>
                            <Input
                                type="number" step="0.01"
                                value={payAmount} onChange={e => setPayAmount(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={paying}>
                            {paying ? "Processing..." : "Confirm Payment"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>


            <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the credit card
                            "{editingCard?.name}" and remove it from your dashboard.
                            History will be preserved in database but hidden.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteCard} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
