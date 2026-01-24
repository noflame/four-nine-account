import type { Config } from 'drizzle-kit';

export default {
    schema: './src/schema.ts',
    out: './drizzle',
    driver: 'd1',
    dbCredentials: {
        wranglerConfigPath: '../../apps/api/wrangler.toml',
        dbName: 'lin-fan-db',
    },
} satisfies Config;
