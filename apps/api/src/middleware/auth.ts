import { createMiddleware } from 'hono/factory';
import { decode } from 'hono/jwt';

// Define the custom context variable for User
export type AuthVariables = {
    user: {
        uid: string;
        email?: string;
    };
};

export const firebaseAuth = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.split(' ')[1];

    try {
        // In a real Worker environment, we would verify the signature using Google's public keys.
        // For now, we will decode the token to get the UID (Development Mode).
        // TODO: Implement full JWK signature verification.
        const { payload } = decode(token);

        if (!payload.sub) {
            throw new Error('Invalid token');
        }

        c.set('user', {
            uid: payload.sub as string,
            email: payload.email as string | undefined,
        });

        await next();
    } catch (err) {
        console.error('Auth Error:', err);
        return c.json({ error: 'Invalid token' }, 401);
    }
});
