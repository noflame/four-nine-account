import type { Config } from 'drizzle-kit';

export default {
    schema: './src/schema.ts',
    out: './drizzle',
    driver: 'd1',
    dbCredentials: {
        wranglerConfigPath: 'drizzle.config.json',
        dbName: 'lin-fan-db',
    },
} satisfies Config;
