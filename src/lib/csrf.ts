import Tokens from 'csrf';

/**
 * CSRF protection utilities for API routes
 */
const tokens = new Tokens();

/**
 * Generate a new CSRF token
 */
export function generateCSRFToken(): string {
    return tokens.create(process.env.CSRF_SECRET || 'default-secret-change-in-production');
}

/**
 * Validate a CSRF token
 */
export function validateCSRFToken(token: string): boolean {
    try {
        return tokens.verify(process.env.CSRF_SECRET || 'default-secret-change-in-production', token);
    } catch {
        return false;
    }
}

/**
 * Get CSRF token for client-side use
 * This should be called from an API route that returns the token to the client
 */
export function getCSRFToken(): string {
    return generateCSRFToken();
}
