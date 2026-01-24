/// <reference types="vite/client" />
/// <reference types="@cloudflare/workers-types" />

// Declare D1Database globally for cross-package type resolution
declare global {
    interface D1Database { }
}

export { };
