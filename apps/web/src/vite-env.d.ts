/// <reference types="vite/client" />
/// <reference types="@cloudflare/workers-types" />

// Declare D1Database globally for cross-package type resolution
declare global {
    interface D1Database { }
}

interface ImportMetaEnv {
    readonly VITE_API_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

export { };
