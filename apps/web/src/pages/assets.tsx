import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { hc } from "hono/client";
import { AppType } from "@lin-fan/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function AssetsPage() {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<any | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        type: "bank",
        balance: "",
        currency: "TWD"
    });

    const fetchAccounts = async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            // Workaround: Type assertion due to monorepo type resolution issue
            const client = hc<AppType>('/api', {
                headers: { Authorization: `Bearer ${token}` }
            }) as any;
            const res = await client.assets.$get();
            if (res.ok) {
                const data = await res.json();
                setAccounts(data);
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
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            const token = await user.getIdToken();
            // Workaround: Type assertion due to monorepo type resolution issue
            const client = hc<AppType>('/api', {
                headers: { Authorization: `Bearer ${token}` }
            }) as any;

            if (editingAccount) {
                // Update existing account
                const res = await client.assets[':id'].$patch({
                    param: { id: editingAccount.id.toString() },
                    json: {
                        name: formData.name,
                        type: formData.type as any,
                        currency: formData.currency,
                        balance: parseFloat(formData.balance),
                        isVisibleToChild: false
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
                const res = await client.assets.$post({
                    json: {
                        name: formData.name,
                        type: formData.type as any,
                        currency: formData.currency,
                        balance: parseFloat(formData.balance),
                        isVisibleToChild: false
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

    const handleDelete = async (accountId: number) => {
        if (!user) return;
        if (!confirm('確定要刪除這個帳戶嗎？')) return;

        try {
            const token = await user.getIdToken();
            const client = hc<AppType>('/api', {
                headers: { Authorization: `Bearer ${token}` }
            }) as any;

            const res = await client.assets[':id'].$delete({
                param: { id: accountId.toString() }
            });

            if (res.ok) {
                fetchAccounts();
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

    if (loading) return <div>Loading assets...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
                <Dialog open={isOpen} onOpenChange={handleDialogChange}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Account
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingAccount ? 'Edit Account' : 'Add New Account'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Account Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Cathay Bank"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Type</Label>
                                <select
                                    id="type"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="cash">Cash</option>
                                    <option value="bank">Bank Account</option>
                                    <option value="digital">Digital Wallet</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="balance">Current Balance</Label>
                                <Input
                                    id="balance"
                                    type="number"
                                    step="0.01"
                                    value={formData.balance}
                                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {editingAccount ? 'Update Account' : 'Create Account'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {accounts.map((account) => (
                    <Card key={account.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {account.name}
                            </CardTitle>
                            <span className="text-xs text-muted-foreground uppercase bg-muted px-2 py-1 rounded">
                                {account.type}
                            </span>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold mb-4">
                                {new Intl.NumberFormat('zh-TW', { style: 'currency', currency: account.currency }).format(account.balance / 10000)}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => handleEdit(account)}
                                >
                                    <Pencil className="h-4 w-4 mr-1" />
                                    Edit
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-destructive hover:text-destructive"
                                    onClick={() => handleDelete(account.id)}
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
