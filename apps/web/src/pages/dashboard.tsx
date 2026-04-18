import { HeroSection } from "@/components/dashboard/HeroSection";
import { SegmentedControl } from "@/components/dashboard/SegmentedControl";
import { TransactionList } from "@/components/dashboard/TransactionList";
import { ExpenseAnalysisCard } from "@/components/dashboard/ExpenseAnalysisCard";
import { CreditLimitCard } from "@/components/dashboard/CreditLimitCard";

export default function DashboardPage() {
    return (
        <div className="px-4 max-w-7xl mx-auto mt-4">
            {/* Hero Section */}
            <HeroSection />

            {/* Main Content Area - Responsive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
                
                {/* Left Column: Transactions */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    <SegmentedControl />
                    <TransactionList />
                </div>
                
                {/* Right Column: Insights & Cards */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <ExpenseAnalysisCard />
                    <CreditLimitCard />
                </div>
                
            </div>
        </div>
    );
}
