"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, CreditCard, TrendingDown, TrendingUp, ArrowRightLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface TransactionCardProps {
    title: string
    date: string
    amount: number
    fromAccount?: string
    toAccount?: string
    category?: string
    user?: string
    type?: "payment" | "expense" | "income" | "transfer"
    onEdit?: () => void
    onDelete?: () => void
}

export function TransactionCard({
    title,
    date,
    amount,
    fromAccount,
    toAccount,
    category,
    user,
    type = "payment",
    onEdit,
    onDelete
}: TransactionCardProps) {
    const isNegative = amount < 0
    const formattedAmount = new Intl.NumberFormat("zh-TW", {
        style: "currency",
        currency: "TWD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(Math.abs(amount))

    const getIcon = () => {
        switch (type) {
            case "payment": return <CreditCard className="h-5 w-5 text-purple-600" />;
            case "income": return <TrendingUp className="h-5 w-5 text-green-600" />;
            case "transfer": return <ArrowRightLeft className="h-5 w-5 text-blue-600" />;
            default: return <TrendingDown className="h-5 w-5 text-red-600" />;
        }
    }

    const getBgColor = () => {
        switch (type) {
            case "payment": return "bg-purple-100";
            case "income": return "bg-green-100";
            case "transfer": return "bg-blue-100";
            default: return "bg-red-100";
        }
    }

    return (
        <Card className="p-4">
            <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                    className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                        getBgColor()
                    )}
                >
                    {getIcon()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                    {/* Title */}
                    <h3 className="font-medium text-foreground leading-snug">{title}</h3>

                    {/* Date & Amount Row */}
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{date}</span>
                        <span className="text-muted-foreground">•</span>
                        {type === 'transfer' ? (
                            <span className="font-semibold text-blue-600">
                                {formattedAmount}
                            </span>
                        ) : (
                            <span className={cn("font-semibold", isNegative ? "text-red-600" : "text-green-600")}>
                                {isNegative ? "-" : "+"}
                                {formattedAmount}
                            </span>
                        )}
                    </div>

                    {/* Account Transfer Info */}
                    {(fromAccount || toAccount) && (
                        <div className="text-sm text-muted-foreground">
                            {fromAccount}
                            {fromAccount && toAccount && " → "}
                            {toAccount}
                        </div>
                    )}

                    {/* Category & User */}
                    {(category || user) && (
                        <div className="flex items-center gap-2 text-sm">
                            {category && (
                                <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs">
                                    {category}
                                </span>
                            )}
                            {user && (
                                <span className="text-muted-foreground">
                                    by <span className="text-blue-600">{user}</span>
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={onEdit}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={onDelete}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </Card>
    )
}
