
import { useState } from "react";
import { useLedger } from "@/components/ledger-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Removed Tabs imports as unused
import { useApiClient } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { LogOut, Plus, Wallet } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

export default function LedgerSelectionPage() {
    const { ledgers, selectLedger, refreshLedgers } = useLedger();
    const { getClient } = useApiClient();
    const { logout } = useAuth();
    const navigate = useNavigate();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newLedgerName, setNewLedgerName] = useState("");
    const [newLedgerPassword, setNewLedgerPassword] = useState("");

    const [verifyPasswordOpen, setVerifyPasswordOpen] = useState(false);
    const [selectedLedgerToEnter, setSelectedLedgerToEnter] = useState<any>(null);
    const [passwordInput, setPasswordInput] = useState("");

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const client = await getClient();
            const res = await client.api.ledgers.$post({
                json: {
                    name: newLedgerName,
                    password: newLedgerPassword || undefined
                }
            });

            if (res.ok) {
                const newLedger = await res.json();
                await refreshLedgers();
                selectLedger(newLedger.id);
                setIsCreateOpen(false);
                navigate('/');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSelect = async (ledger: any) => {
        // logic: if ledger has password, prompt?
        // But backend does not enforce password on "enter" request locally, only logic.
        // User requested: "要進帳簿要打密碼" (Enter ledger needs password).
        // If hasPassword is true, prompt.
        if (ledger.hasPassword) {
            setSelectedLedgerToEnter(ledger);
            setPasswordInput("");
            setVerifyPasswordOpen(true);
        } else {
            enterLedger(ledger.id);
        }
    };

    const handleVerifyPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLedgerToEnter) return;

        try {
            const client = await getClient();
            const res = await client.api.ledgers[':id'].verify.$post({
                param: { id: selectedLedgerToEnter.id.toString() },
                json: { password: passwordInput }
            });

            if (res.ok) {
                // Success
                enterLedger(selectedLedgerToEnter.id);
                setVerifyPasswordOpen(false);
            } else {
                alert("Password Incorrect");
            }
        } catch (err) {
            console.error(err);
            alert("Error verifying password");
        }
    };

    const enterLedger = (id: number) => {
        selectLedger(id);
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight">Select a Ledger</h1>
                    <p className="text-muted-foreground">Choose a ledger to manage your finances or create a new one.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Existing Ledgers */}
                    {ledgers.map(ledger => (
                        <Card key={ledger.id} className="flex flex-col hover:border-primary cursor-pointer transition-colors relative group" onClick={() => handleSelect(ledger)}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Wallet className="h-5 w-5" />
                                    {ledger.name}
                                </CardTitle>
                                <CardDescription>{ledger.role === 'owner' ? 'Owner' : 'Member'}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                {ledger.hasPassword && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded dark:bg-yellow-900 dark:text-yellow-100">Password Protected</span>}
                            </CardContent>
                        </Card>
                    ))}

                    {/* Create New Block */}
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Card className="flex flex-col items-center justify-center h-[200px] cursor-pointer hover:border-primary border-dashed border-2 hover:bg-accent/50 transition-colors">
                                <Plus className="h-10 w-10 mb-4 text-muted-foreground" />
                                <h3 className="font-semibold text-lg">Create New Ledger</h3>
                            </Card>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Ledger</DialogTitle>
                                <DialogDescription>Start a new financial journey.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Ledger Name</Label>
                                    <Input id="name" value={newLedgerName} onChange={e => setNewLedgerName(e.target.value)} required placeholder="My Ledger" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password (Optional)</Label>
                                    <Input id="password" type="password" value={newLedgerPassword} onChange={e => setNewLedgerPassword(e.target.value)} placeholder="Required to enter" />
                                </div>
                                <DialogFooter>
                                    <Button type="submit">Create Ledger</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="flex justify-center mt-8">
                    <Button variant="ghost" className="text-muted-foreground" onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                    </Button>
                </div>
            </div>

            {/* Password Verification Dialog */}
            <Dialog open={verifyPasswordOpen} onOpenChange={setVerifyPasswordOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Enter Password</DialogTitle>
                        <DialogDescription>
                            Please enter the password for <strong>{selectedLedgerToEnter?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleVerifyPassword} className="space-y-4">
                        <Input
                            type="password"
                            value={passwordInput}
                            onChange={e => setPasswordInput(e.target.value)}
                            placeholder="Password"
                            autoFocus
                        />
                        <DialogFooter>
                            <Button type="submit">Enter</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
