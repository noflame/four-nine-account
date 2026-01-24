import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { hc } from "hono/client";
import { AppType } from "@lin-fan/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";

export default function SettingsPage() {
    const { user } = useAuth();
    const [seeding, setSeeding] = useState(false);
    const [seedResult, setSeedResult] = useState<string | null>(null);

    const handleSeedCategories = async () => {
        if (!user) return;
        setSeeding(true);
        setSeedResult(null);
        try {
            const token = await user.getIdToken();
            const client = hc<AppType>('/api', {
                headers: { Authorization: `Bearer ${token}` }
            }) as any;

            const res = await client.categories.seed.$post();
            const data = await res.json();

            if (res.ok) {
                setSeedResult(data.message);
            } else {
                setSeedResult("Failed to seed data");
            }
        } catch (err) {
            console.error(err);
            setSeedResult("Error occurred");
        } finally {
            setSeeding(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

            <Card>
                <CardHeader>
                    <CardTitle>System Information</CardTitle>
                    <CardDescription>Manage system data and defaults</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <h3 className="font-medium">Default Categories</h3>
                            <p className="text-sm text-gray-500">Initialize default system categories (Food, Transport, Salary, etc.)</p>
                            {seedResult && (
                                <p className="text-sm text-green-600 mt-1 flex items-center">
                                    <Check className="h-3 w-3 mr-1" />
                                    {seedResult}
                                </p>
                            )}
                        </div>
                        <Button
                            variant="outline"
                            onClick={handleSeedCategories}
                            disabled={seeding}
                        >
                            {seeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Initialize
                        </Button>
                    </div>
                </CardContent>
            </Card>

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
