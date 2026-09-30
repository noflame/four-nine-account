# Database context

The database package in `packages/db` owns the Drizzle schema, D1 migrations, and database access shared by the API.

Money and prices are stored as integers using the x10000 scale factor. Preserve this convention in schema, migrations, and queries.
