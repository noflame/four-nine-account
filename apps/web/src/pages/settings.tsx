import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { hc } from "hono/client";
import { AppType } from "@lin-fan/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";

export default function SettingsPage() {
    const { user } = useAuth();
    const [seeding, setSeeding] = useState(false);
    const [seedStatus, setSeedStatus] = useState<'success' | 'error' | null>(null);
    const [seedResult, setSeedResult] = useState<string | null>(null);
    const [categories, setCategories] = useState<any[]>([]);
    const [loadingCats, setLoadingCats] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);

    // New Category Form
    const [newCatName, setNewCatName] = useState("");
    const [newCatType, setNewCatType] = useState<"income" | "expense">("expense");
    const [newCatIcon, setNewCatIcon] = useState("more-horizontal");
    const [adding, setAdding] = useState(false);

    const ICONS = [
        { id: 'utensils', label: '🍱' },
        { id: 'bus', label: '🚌' },
        { id: 'home', label: '🏠' },
        { id: 'gamepad-2', label: '🎮' },
        { id: 'shopping-bag', label: '🛍️' },
        { id: 'heart-pulse', label: '🏥' },
        { id: 'graduation-cap', label: '🎓' },
        { id: 'briefcase', label: '💼' },
        { id: 'gift', label: '🎁' },
        { id: 'trending-up', label: '📈' },
        { id: 'more-horizontal', label: '⋯' },
        { id: 'coffee', label: '☕' },
        { id: 'paw-print', label: '🐾' },
        { id: 'plane', label: '✈️' },
        { id: 'music', label: '🎵' },
        { id: 'video', label: '🎬' },
        { id: 'book', label: '📚' },
        { id: 'dumbbell', label: '🏋️' },
        { id: 'smartphone', label: '📱' },
        { id: 'wifi', label: '📶' },
    ];

    const fetchCategories = async () => {
        if (!user) return;
        setLoadingCats(true);
        try {
            const token = await user.getIdToken();
            const apiUrl = import.meta.env.VITE_API_URL || '/api';
            const client = hc<AppType>(apiUrl, { headers: { Authorization: `Bearer ${token}` } }) as any;
            const res = await client.categories.$get();
            if (res.ok) setCategories(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingCats(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [user]);

    const handleSeedCategories = async () => {
        if (!user) return;
        setSeeding(true);
        setSeedResult(null);
        setSeedStatus(null);
        try {
            const token = await user.getIdToken();
            const apiUrl = import.meta.env.VITE_API_URL || '/api';
            const client = hc<AppType>(apiUrl, { headers: { Authorization: `Bearer ${token}` } }) as any;
            const res = await client.categories.seed.$post();
            const data = await res.json();

            if (res.ok) {
                setSeedResult(data.message);
                setSeedStatus('success');
                fetchCategories();
            } else {
                setSeedResult(data.error || "Failed to seed data");
                setSeedStatus('error');
            }
        } catch (err: any) {
            console.error(err);
            setSeedResult(err.message || "Error occurred");
            setSeedStatus('error');
        } finally {
            setSeeding(false);
        }
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setAdding(true);
        try {
            const token = await user.getIdToken();
            const apiUrl = import.meta.env.VITE_API_URL || '/api';
            const client = hc<AppType>(apiUrl, { headers: { Authorization: `Bearer ${token}` } }) as any;
            const res = await client.categories.$post({
                json: { name: newCatName, type: newCatType, icon: newCatIcon }
            });
            if (res.ok) {
                setIsAddOpen(false);
                setNewCatName("");
                fetchCategories();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setAdding(false);
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!user) return;
        if (!confirm("Delete this category? Transactions using it will lose the category tag.")) return;
        try {
            const token = await user.getIdToken();
            const apiUrl = import.meta.env.VITE_API_URL || '/api';
            const client = hc<AppType>(apiUrl, { headers: { Authorization: `Bearer ${token}` } }) as any;
            const res = await client.categories[':id'].$delete({ param: { id: id.toString() } });
            if (res.ok) fetchCategories();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

            {/* Default Data Section */}
            <Card>
                <CardHeader>
                    <CardTitle>System Data</CardTitle>
                    <CardDescription>Initialize default categories if list is empty</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <h3 className="font-medium">Default Categories</h3>
                            <p className="text-sm text-gray-500">Restore default system categories</p>
                            {seedResult && (
                                <p className={`text-sm mt-1 flex items-center ${seedStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                    {seedStatus === 'success' ? <Check className="h-3 w-3 mr-1" /> : null} {seedResult}
                                </p>
                            )}
                        </div>
                        <Button variant="outline" onClick={handleSeedCategories} disabled={seeding}>
                            {seeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Initialize
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Category Management */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Categories</CardTitle>
                        <CardDescription>Manage income and expense categories</CardDescription>
                    </div>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-2">
                                <Plus className="h-4 w-4" /> Add Custom
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Category</DialogTitle>
                                <DialogDescription>Create a new category for your transactions.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddCategory} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input
                                        value={newCatName}
                                        onChange={e => setNewCatName(e.target.value)}
                                        placeholder="e.g. Pet, Insurance"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant={newCatType === 'expense' ? 'default' : 'outline'}
                                            onClick={() => setNewCatType('expense')}
                                            className="flex-1"
                                        >Expense</Button>
                                        <Button
                                            type="button"
                                            variant={newCatType === 'income' ? 'default' : 'outline'}
                                            onClick={() => setNewCatType('income')}
                                            className="flex-1"
                                        >Income</Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Icon</Label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {ICONS.map(icon => (
                                            <button
                                                key={icon.id}
                                                type="button"
                                                onClick={() => setNewCatIcon(icon.id)}
                                                className={`p-2 rounded text-xl border transition-colors ${newCatIcon === icon.id
                                                    ? 'bg-primary/10 border-primary'
                                                    : 'hover:bg-muted border-transparent'
                                                    }`}
                                            >
                                                {icon.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" disabled={adding}>
                                    {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Category'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    {loadingCats ? (
                        <div className="text-center py-4">Loading...</div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Expense Column */}
                            <div>
                                <h3 className="font-medium mb-2 text-red-600">Expenses</h3>
                                <div className="space-y-2">
                                    {categories.filter(c => c.type === 'expense').map(cat => (
                                        <div key={cat.id} className="flex items-center justify-between p-2 border rounded bg-card">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl w-8 text-center bg-muted rounded p-1">
                                                    {ICONS.find(i => i.id === cat.icon)?.label || '⋯'}
                                                </span>
                                                <span>{cat.name}</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleDeleteCategory(cat.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Income Column */}
                            <div>
                                <h3 className="font-medium mb-2 text-green-600">Income</h3>
                                <div className="space-y-2">
                                    {categories.filter(c => c.type === 'income').map(cat => (
                                        <div key={cat.id} className="flex items-center justify-between p-2 border rounded bg-card">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl w-8 text-center bg-muted rounded p-1">
                                                    {ICONS.find(i => i.id === cat.icon)?.label || '⋯'}
                                                </span>
                                                <span>{cat.name}</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleDeleteCategory(cat.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Family Management */}
            <FamilySettings user={user} />

            <Card>
                <CardHeader>
                    <CardTitle>Account</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm">
                        <p><strong>Email:</strong> {user?.email}</p>
                        <p><strong>UID:</strong> {user?.uid}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function FamilySettings({ user }: { user: any }) {
    const [family, setFamily] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [inviteCode, setInviteCode] = useState("");
    const [familyName, setFamilyName] = useState("");
    const [mode, setMode] = useState<'view' | 'create' | 'join'>('view');
    const [error, setError] = useState<string | null>(null);

    const fetchFamily = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const apiUrl = import.meta.env.VITE_API_URL || '/api';
            const client = hc<AppType>(apiUrl, { headers: { Authorization: `Bearer ${token}` } }) as any;
            const res = await client.family.members.$get();
            if (res.ok) {
                const data = await res.json();
                if (data.family) {
                    setFamily(data.family);
                    setMembers(data.members);
                    setMode('view');
                } else {
                    setFamily(null);
                    setMembers([]);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFamily();
    }, [user]);

    const handleCreate = async () => {
        if (!user || !familyName) return;
        setLoading(true);
        setError(null);
        try {
            const token = await user.getIdToken();
            const apiUrl = import.meta.env.VITE_API_URL || '/api';
            const client = hc<AppType>(apiUrl, { headers: { Authorization: `Bearer ${token}` } }) as any;
            const res = await client.family.create.$post({
                json: { name: familyName }
            });
            if (res.ok) {
                await fetchFamily();
            } else {
                const err = await res.json();
                setError(err.error || 'Failed to create family');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        if (!user || !inviteCode) return;
        setLoading(true);
        setError(null);
        try {
            const token = await user.getIdToken();
            const apiUrl = import.meta.env.VITE_API_URL || '/api';
            const client = hc<AppType>(apiUrl, { headers: { Authorization: `Bearer ${token}` } }) as any;
            const res = await client.family.join.$post({
                json: { inviteCode }
            });
            if (res.ok) {
                await fetchFamily();
            } else {
                const err = await res.json();
                setError(err.error || 'Failed to join family');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !family && mode === 'view') {
        return (
            <Card>
                <CardHeader><CardTitle>Family Management</CardTitle></CardHeader>
                <CardContent>Loading...</CardContent>
            </Card>
        );
    }

    if (!family) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Family Management</CardTitle>
                    <CardDescription>Join a family to share assets and transactions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg space-y-4">
                            <h3 className="font-medium">Create a new Family</h3>
                            <Input
                                placeholder="Family Name (e.g. Lin Family)"
                                value={familyName}
                                onChange={e => setFamilyName(e.target.value)}
                            />
                            <Button onClick={handleCreate} disabled={loading || !familyName}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Family'}
                            </Button>
                        </div>

                        <div className="p-4 border rounded-lg space-y-4">
                            <h3 className="font-medium">Join existing Family</h3>
                            <Input
                                placeholder="Enter Invite Code"
                                value={inviteCode}
                                onChange={e => setInviteCode(e.target.value)}
                            />
                            <Button variant="outline" onClick={handleJoin} disabled={loading || !inviteCode}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Join Family'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>{family.name}</span>
                    <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
                        Code: {family.inviteCode}
                    </span>
                </CardTitle>
                <CardDescription>Manage your family members and roles.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <h3 className="font-medium">Members</h3>
                    <div className="space-y-2">
                        {members.map((m: any) => (
                            <div key={m.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <p className="font-medium">{m.name} {m.id === user.id && '(You)'}</p>
                                    <p className="text-sm text-gray-500">{m.email}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded uppercase">
                                        {m.role}
                                    </span>
                                    {/* Admin actions could go here */}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700">
                        <p>Share the invite code <strong>{family.inviteCode}</strong> with your spouse to link accounts.</p>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button variant="destructive" size="sm" onClick={async () => {
                        if (!confirm("Are you sure you want to leave this family?")) return;
                        setLoading(true);
                        try {
                            const token = await user.getIdToken();
                            const apiUrl = import.meta.env.VITE_API_URL || '/api';
                            const client = hc<AppType>(apiUrl, { headers: { Authorization: `Bearer ${token}` } }) as any;
                            const res = await client.family.leave.$post();
                            if (res.ok) {
                                await fetchFamily();
                            } else {
                                const err = await res.json();
                                setError(err.error || 'Failed to leave family');
                            }
                        } catch (err: any) {
                            setError(err.message);
                        } finally {
                            setLoading(false);
                        }
                    }}>
                        Leave Family
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
