-- Backfill existing data to Ledger ID 1
UPDATE accounts SET ledger_id = 1 WHERE ledger_id IS NULL;
UPDATE transactions SET ledger_id = 1 WHERE ledger_id IS NULL;
UPDATE categories SET ledger_id = 1 WHERE ledger_id IS NULL;
UPDATE credit_cards SET ledger_id = 1 WHERE ledger_id IS NULL;
UPDATE stocks SET ledger_id = 1 WHERE ledger_id IS NULL;
