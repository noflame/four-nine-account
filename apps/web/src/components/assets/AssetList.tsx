import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Landmark, CreditCard, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AssetListProps {
    accounts: any[];
    onEdit: (account: any) => void;
    onDelete: (id: number) => void;
    totalBalance: number;
    readOnly?: boolean;
}

export function AssetList({ accounts, onEdit, onDelete, totalBalance, readOnly = false }: AssetListProps) {
    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: currency }).format(amount / 10000);
    };

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
            {accounts.map((account) => {
                const ratio = totalBalance > 0 ? (account.balance / totalBalance) * 100 : 0;
                return (
                    <Card key={account.id} className="group relative overflow-hidden rounded-[2rem] transition-all hover:shadow-lg hover:-translate-y-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
                                    {account.type === 'cash' && <Wallet className="h-4 w-4 text-primary" />}
                                    {account.type === 'bank' && <Landmark className="h-4 w-4 text-secondary" />}
                                    {account.type === 'digital' && <CreditCard className="h-4 w-4 text-accent" />}
                                </div>
                                {account.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-headline mt-2">{formatCurrency(account.balance, account.currency)}</div>
                            
                            <div className="mt-4 space-y-2">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span className="capitalize">{account.type}</span>
                                    <span>{ratio.toFixed(1)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${account.type === 'cash' ? 'bg-primary' : account.type === 'bank' ? 'bg-secondary' : 'bg-accent'}`} 
                                        style={{ width: `${ratio}%` }}
                                    />
                                </div>
                            </div>

                            {!readOnly && (
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-1 rounded-full shadow-sm">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => onEdit(account)}>
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" onClick={() => onDelete(account.id)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
