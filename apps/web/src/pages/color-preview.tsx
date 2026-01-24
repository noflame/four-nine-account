import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ColorPreview() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold mb-2">配色預覽</h1>
                <p className="text-muted-foreground">基於財務儀表板的配色方案</p>
            </div>

            {/* Color Palette */}
            <Card>
                <CardHeader>
                    <CardTitle>主要色彩</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <div className="h-20 rounded-lg bg-primary"></div>
                        <p className="text-sm font-medium">Primary</p>
                        <p className="text-xs text-muted-foreground">深綠色</p>
                    </div>
                    <div className="space-y-2">
                        <div className="h-20 rounded-lg bg-accent"></div>
                        <p className="text-sm font-medium">Accent</p>
                        <p className="text-xs text-muted-foreground">金黃色</p>
                    </div>
                    <div className="space-y-2">
                        <div className="h-20 rounded-lg bg-secondary"></div>
                        <p className="text-sm font-medium">Secondary</p>
                        <p className="text-xs text-muted-foreground">薄荷綠</p>
                    </div>
                    <div className="space-y-2">
                        <div className="h-20 rounded-lg bg-muted"></div>
                        <p className="text-sm font-medium">Muted</p>
                        <p className="text-xs text-muted-foreground">淺灰綠</p>
                    </div>
                </CardContent>
            </Card>

            {/* Buttons */}
            <Card>
                <CardHeader>
                    <CardTitle>按鈕樣式</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                    <Button>Primary Button</Button>
                    <Button variant="secondary">Secondary Button</Button>
                    <Button variant="outline">Outline Button</Button>
                    <Button variant="ghost">Ghost Button</Button>
                    <Button variant="destructive">Destructive</Button>
                </CardContent>
            </Card>

            {/* Dashboard Cards Example */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-primary text-primary-foreground">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            總資產
                        </CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-primary-foreground/80"
                        >
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$44,998</div>
                        <p className="text-xs text-primary-foreground/80">
                            +20.1% from last month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            收入
                        </CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                        >
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$49,500</div>
                        <p className="text-xs text-muted-foreground">
                            +180.1% from last month
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-accent text-accent-foreground">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            支出
                        </CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-accent-foreground/80"
                        >
                            <rect width="20" height="14" x="2" y="5" rx="2" />
                            <path d="M2 10h20" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$15,373</div>
                        <p className="text-xs text-accent-foreground/80">
                            +19% from last month
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-secondary text-secondary-foreground">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            儲蓄率
                        </CardTitle>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-secondary-foreground/80"
                        >
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">22.34%</div>
                        <p className="text-xs text-secondary-foreground/80">
                            +2% from last month
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Text Examples */}
            <Card>
                <CardHeader>
                    <CardTitle>文字樣式</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h1 className="text-4xl font-bold">Heading 1</h1>
                        <h2 className="text-3xl font-semibold">Heading 2</h2>
                        <h3 className="text-2xl font-semibold">Heading 3</h3>
                        <p className="text-base">這是一般段落文字</p>
                        <p className="text-sm text-muted-foreground">這是次要文字</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
