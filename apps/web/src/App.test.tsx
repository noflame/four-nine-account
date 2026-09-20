import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const spies = vi.hoisted(() => ({
    dashboard: vi.fn(),
}));

vi.mock('@/components/auth-provider', () => ({
    AuthProvider: ({ children }: { children: React.ReactNode }) => children,
    useAuth: () => ({ user: { uid: 'test-user' }, loading: false }),
}));

vi.mock('@/components/ledger-provider', () => ({
    LedgerProvider: ({ children }: { children: React.ReactNode }) => children,
    useLedger: () => ({ currentLedger: null, isLoading: false }),
}));

vi.mock('@/components/layout', () => ({ default: () => <div>Layout</div> }));
vi.mock('@/components/ui/sonner', () => ({ Toaster: () => null }));
vi.mock('@/pages/ledger-selection', () => ({ default: () => <div>Ledger selection</div> }));
vi.mock('@/pages/dashboard', () => ({
    default: () => {
        spies.dashboard();
        return <div>Dashboard</div>;
    },
}));

describe('ledger routing', () => {
    beforeEach(() => {
        spies.dashboard.mockReset();
        window.history.pushState({}, '', '/');
    });

    it('sends a user without a valid ledger to ledger selection without rendering the dashboard', async () => {
        render(<App />);

        await waitFor(() => {
            expect(screen.getByText('Ledger selection')).toBeInTheDocument();
        });

        expect(spies.dashboard).not.toHaveBeenCalled();
    });
});
