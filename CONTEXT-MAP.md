# Context map

This repository has three primary contexts. Read the context document relevant to the work before making changes.

| Context | Location | Responsibility |
| --- | --- | --- |
| Web application | `apps/web/CONTEXT.md` | React and Vite user interface for the household-accounting application. |
| API | `apps/api/CONTEXT.md` | Hono API running on Cloudflare Workers. |
| Database | `packages/db/CONTEXT.md` | Drizzle schema, D1 migrations, and shared database access. |

`CONTEXT.md` at the repository root records system-wide technical conventions. System-wide architecture decisions belong in `docs/adr/`; context-specific decisions belong in the corresponding context's `docs/adr/` directory.
