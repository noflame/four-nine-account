# Pending Tasks: Schema Cleanup

The previous agent has completed the removal of the Family functionality. The next steps are to clean up the `accounts` table in the database schema.

## Goal
Remove legacy columns `is_private` and `is_visible_to_child` from the `accounts` table as they are no longer needed in the Multi-Ledger architecture.

## Tasks
- [x] Schema Cleanup: Accounts Table
    - [x] Modify `packages/db/src/schema.ts`
        - Remove `isPrivate` column definition from `accounts` table
        - Remove `isVisibleToChild` column definition from `accounts` table
    - [x] Modify `apps/api/src/routes/assets.ts`
        - Update Zod validator (`accountSchema`) to remove `isVisibleToChild`
        - Update `POST /` (create) logic to stop inserting `isVisibleToChild`
        - Update `PATCH /:id` (update) logic if necessary
    - [x] Generate & Apply Migration
        - Run `npm run generate` in `packages/db`
        - Run `npm run migrate` (or `npx wrangler ...`) to apply changes to local DB
