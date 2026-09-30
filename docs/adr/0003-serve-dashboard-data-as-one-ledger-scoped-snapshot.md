# Serve dashboard data as one ledger-scoped snapshot

The dashboard obtains its balances, recent transactions, expense summary, and credit utilisation from one ledger-scoped dashboard endpoint, with the page owning loading and retry states. This keeps related figures consistent on first render and avoids each dashboard card issuing separate requests; fields exposed by this endpoint must be calculated from real ledger data rather than placeholders.
