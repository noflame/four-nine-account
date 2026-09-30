# Use ledgers as the data and authorisation boundary

Each financial record belongs to a ledger, while `ledger_users` assigns a user one role per ledger. The API receives the selected ledger through `X-Ledger-Id` and verifies membership before serving data. This supports separate personal and family books without making global user roles or legacy family-visibility fields responsible for isolation.
