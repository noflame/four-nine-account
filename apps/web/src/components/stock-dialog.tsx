import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth-provider";
import { hc } from "hono/client";
import { AppType } from "@lin-fan/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface StockDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function StockDialog({ open, onOpenChange, onSuccess }: StockDialogProps) {
    const { user } = useAuth();
    const [mode, setMode] = useState<"buy" | "sell">("buy");
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<any[]>([]);

    // Form State
    const [ticker, setTicker] = useState("");
    const [shares, setShares] = useState("");
    const [price, setPrice] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [accountId, setAccountId] = useState<string>("");
    const [ownerLabel, setOwnerLabel] = useState("Self");

    useEffect(() => {
        if (open && user) {
            // Fetch accounts for dropdown
            const fetchAccounts = async () => {
                const token = await user.getIdToken();
                const client = hc<AppType>('/api', { headers: { Authorization: `Bearer ${token}` } }) as any;
                const res = await client.assets.$get();
                if (res.ok) {
                    const data = await res.json();
                    setAccounts(data);
                    // Default to first account if available
                    if (data.length > 0 && !accountId) {
                        setAccountId(data[0].id.toString());
                    }
                }
            };
            fetchAccounts();
        }
    }, [open, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !accountId) return;
        setLoading(true);

        try {
            const token = await user.getIdToken();
            const client = hc<AppType>('/api', { headers: { Authorization: `Bearer ${token}` } }) as any;

            const payload = {
                ticker: ticker.toUpperCase(),
                shares: parseFloat(shares),
                price: parseFloat(price),
                date: date,
                description: `${mode === 'buy' ? 'Buy' : 'Sell'} ${ticker}`,
                ownerLabel: ownerLabel,
            };

            let res;
            if (mode === 'buy') {
                res = await client.stocks.buy.$post({
                    json: {
                        ...payload,
                        sourceAccountId: parseInt(accountId),
                    }
                });
            } else {
                res = await client.stocks.sell.$post({
                    json: {
                        ...payload,
                        destinationAccountId: parseInt(accountId),
                    }
                });
            }

            if (res.ok) {
                onSuccess();
                onOpenChange(false);
                setOwnerLabel("Self");
                toast.success(`${mode === 'buy' ? 'Buy' : 'Sell'} order executed successfully`);
            } else {
                const error = await res.json();
                toast.error(`Error: ${error.error || 'Operation failed'}`);
            }
        } catch (err) {
            console.error(err);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Stock Transaction</DialogTitle>
                    <DialogDescription>
                        Execute a buy or sell order for stocks.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={mode} onValueChange={(v) => setMode(v as "buy" | "sell")} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="buy" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">Buy</TabsTrigger>
                        <TabsTrigger value="sell" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700">Sell</TabsTrigger>
                    </TabsList>
                </Tabs>

                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ticker">Ticker</Label>
                            <Input id="ticker" placeholder="AAPL" value={ticker} onChange={(e) => setTicker(e.target.value)} required className="uppercase" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="shares">Shares</Label>
                            <Input id="shares" type="number" step="0.0001" placeholder="10" value={shares} onChange={(e) => setShares(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="price">Price</Label>
                            <Input id="price" type="number" step="0.01" placeholder="150.00" value={price} onChange={(e) => setPrice(e.target.value)} required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="ownerLabel">Beneficiary (Owner)</Label>
                        <Input
                            id="ownerLabel"
                            placeholder="Self, Father, etc."
                            value={ownerLabel}
                            onChange={(e) => setOwnerLabel(e.target.value)}
                            required
                            list="beneficiaries"
                        />
                        <datalist id="beneficiaries">
                            <option value="Self" />
                            <option value="Father" />
                            <option value="Mother" />
                            <option value="Spouse" />
                            <option value="Child" />
                        </datalist>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="account">{mode === 'buy' ? 'Source Account' : 'Destination Account'}</Label>
                        <select
                            id="account"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                            required
                        >
                            <option value="" disabled>Select Account</option>
                            {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>{acc.name} ({new Intl.NumberFormat('zh-TW', { style: 'currency', currency: acc.currency }).format(acc.balance / 10000)})</option>
                            ))}
                        </select>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading} className={mode === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {mode === 'buy' ? 'Buy Stock' : 'Sell Stock'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
