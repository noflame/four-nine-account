import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardPage from './dashboard';

const spies = vi.hoisted(() => ({
    getClient: vi.fn(),
    getDashboard: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
    useApiClient: () => ({ getClient: spies.getClient }),
}));

vi.mock('@/components/ledger-provider', () => ({
    useLedger: () => ({ currentLedger: { id: 42, name: 'Empty ledger', role: 'owner' } }),
}));

describe('DashboardPage', () => {
    beforeEach(() => {
        spies.getClient.mockReset();
        spies.getDashboard.mockReset();
        spies.getClient.mockResolvedValue({
            api: { dashboard: { $get: spies.getDashboard } },
        });
        spies.getDashboard.mockResolvedValue(new Response(JSON.stringify({
            netWorth: 0,
            monthlyGrowth: 0,
            liquidCash: 0,
            monthlyExpenses: 0,
            totalCreditLimit: 0,
            usedCredit: 0,
            recentTransactions: [],
        }), { status: 200 }));
    });

    it('uses the selected ledger and renders a zero-value snapshot', async () => {
        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        });

        render(
            <QueryClientProvider client={queryClient}>
                <DashboardPage />
            </QueryClientProvider>,
        );

        await waitFor(() => {
            expect(screen.getByText('No recent transactions.')).toBeInTheDocument();
        });

        expect(spies.getClient).toHaveBeenCalledWith(42);
        expect(screen.getByText('0.00')).toBeInTheDocument();
    });
});
