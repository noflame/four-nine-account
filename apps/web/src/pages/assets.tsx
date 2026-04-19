import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { useLedger } from "@/components/ledger-provider";
import { useApiClient } from "@/lib/api";
import { TopAppBar } from "@/components/dashboard/TopAppBar";
import { AssetsHero } from "@/components/assets/AssetsHero";
import { AssetList } from "@/components/assets/AssetList";
import { AllocationChart } from "@/components/assets/AllocationChart";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

export default function AssetsPage() {
    const { user, dbUser } = useAuth();
    const { currentLedgerId } = useLedger();
    const { getClient } = useApiClient();
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState<number | null>(null);
    const [editingAccount, setEditingAccount] = useState<any | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        type: "bank",
        balance: "",
        currency: "TWD"
    });

    const fetchAccounts = async () => {
        if (!user) return;
        try {
            const client = await getClient();
            const res = await client.api.assets.$get();
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setAccounts(data);
                } else {
                    setAccounts([]);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();

        const handleUpdate = () => fetchAccounts();
        window.addEventListener('transaction-updated', handleUpdate);

        return () => {
            window.removeEventListener('transaction-updated', handleUpdate);
        };
    }, [user, currentLedgerId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSubmitting(true);

        try {
            const client = await getClient();

            if (editingAccount) {
                // Update existing account
                const res = await client.api.assets[':id'].$patch({
                    param: { id: editingAccount.id.toString() },
                    json: {
                        name: formData.name,
                        type: formData.type as any,
                        currency: formData.currency,
                        balance: parseFloat(formData.balance)
                    }
                });

                if (res.ok) {
                    setIsOpen(false);
                    setEditingAccount(null);
                    setFormData({ name: "", type: "bank", balance: "", currency: "TWD" });
                    fetchAccounts();
                }
            } else {
                // Create new account
                const res = await client.api.assets.$post({
                    json: {
                        name: formData.name,
                        type: formData.type as any,
                        currency: formData.currency,
                        balance: parseFloat(formData.balance)
                    }
                });

                if (res.ok) {
                    setIsOpen(false);
                    setFormData({ name: "", type: "bank", balance: "", currency: "TWD" });
                    fetchAccounts();
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (account: any) => {
        setEditingAccount(account);
        setFormData({
            name: account.name,
            type: account.type,
            balance: (account.balance / 10000).toString(),
            currency: account.currency
        });
        setIsOpen(true);
    };

    const handleDeleteClick = (accountId: number) => {
        if (!user) return;
        setAccountToDelete(accountId);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!user || !accountToDelete) return;

        try {
            const client = await getClient();
            const res = await client.api.assets[':id'].$delete({
                param: { id: accountToDelete.toString() }
            });

            if (res.ok) {
                fetchAccounts();
                setDeleteDialogOpen(false);
                setAccountToDelete(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDialogChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setEditingAccount(null);
            setFormData({ name: "", type: "bank", balance: "", currency: "TWD" });
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading assets...</div>;

    const totalBalance = accounts.reduce((acc, account) => acc + account.balance, 0);
    // Fake monthly growth for now since API doesn't return it yet
    const monthlyGrowth = 2.4; 

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
            <TopAppBar title="Assets" />
            
            <div className="px-4 max-w-7xl mx-auto mt-4 space-y-8">
                <AssetsHero netWorth={totalBalance} monthlyGrowth={monthlyGrowth} />
                
                <AllocationChart accounts={accounts} />

                <div className="mt-8">
                    <h3 className="text-xl font-bold tracking-tight mb-4">Your Assets</h3>
                    <AssetList 
                        accounts={accounts} 
                        onEdit={handleEdit} 
                        onDelete={handleDeleteClick} 
                        totalBalance={totalBalance}
                        readOnly={dbUser?.role === 'child'}
                    />
                </div>
            </div>

            {dbUser?.role !== 'child' && (
                <Button 
                    className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-xl transition-transform hover:scale-105 hover:shadow-2xl z-50 flex items-center justify-center p-0"
                    onClick={() => setIsOpen(true)}
                >
                    <Plus className="h-6 w-6" />
                    <span className="sr-only">Add Account</span>
                </Button>
            )}

            <Dialog open={isOpen} onOpenChange={handleDialogChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingAccount ? 'Edit Account' : 'Add Account'}</DialogTitle>
                        <DialogDescription>
                            {editingAccount ? 'Update account details' : 'Add a new asset account to track'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Bank Savings"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={formData.type === 'cash' ? 'default' : 'outline'}
                                    onClick={() => setFormData({ ...formData, type: 'cash' })}
                                    className="flex-1"
                                >
                                    Cash
                                </Button>
                                <Button
                                    type="button"
                                    variant={formData.type === 'bank' ? 'default' : 'outline'}
                                    onClick={() => setFormData({ ...formData, type: 'bank' })}
                                    className="flex-1"
                                >
                                    Bank
                                </Button>
                                <Button
                                    type="button"
                                    variant={formData.type === 'digital' ? 'default' : 'outline'}
                                    onClick={() => setFormData({ ...formData, type: 'digital' })}
                                    className="flex-1"
                                >
                                    Digital
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Balance</Label>
                            <Input
                                type="number"
                                value={formData.balance}
                                onChange={e => setFormData({ ...formData, balance: e.target.value })}
                                placeholder="0"
                                required
                                step="any"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Currency</Label>
                            <Input
                                value={formData.currency}
                                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                placeholder="TWD"
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={submitting}>
                            {submitting ? (editingAccount ? 'Updating...' : 'Adding...') : (editingAccount ? 'Update Account' : 'Add Account')}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the account
                            and remove all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
