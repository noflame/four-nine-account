import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AllocationChart({ accounts }: { accounts: any[] }) {
    const total = accounts.reduce((acc, curr) => acc + curr.balance, 0) || 1;
    const cash = accounts.filter(a => a.type === 'cash').reduce((acc, curr) => acc + curr.balance, 0);
    const bank = accounts.filter(a => a.type === 'bank').reduce((acc, curr) => acc + curr.balance, 0);
    const digital = accounts.filter(a => a.type === 'digital').reduce((acc, curr) => acc + curr.balance, 0);

    const cashPct = (cash / total) * 100;
    const bankPct = (bank / total) * 100;
    const digitalPct = (digital / total) * 100;

    return (
        <Card className="rounded-[2rem]">
            <CardHeader>
                <CardTitle className="text-lg">Allocation</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-4 flex rounded-full overflow-hidden mb-4">
                    <div style={{ width: `${cashPct}%` }} className="bg-primary" title={`Cash: ${cashPct.toFixed(1)}%`} />
                    <div style={{ width: `${bankPct}%` }} className="bg-secondary" title={`Bank: ${bankPct.toFixed(1)}%`} />
                    <div style={{ width: `${digitalPct}%` }} className="bg-accent" title={`Digital: ${digitalPct.toFixed(1)}%`} />
                </div>
                <div className="flex justify-between text-sm mt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <span>Cash ({cashPct.toFixed(1)}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-secondary" />
                        <span>Bank ({bankPct.toFixed(1)}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-accent" />
                        <span>Digital ({digitalPct.toFixed(1)}%)</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
