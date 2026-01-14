import Tokens from 'csrf';

/**
 * CSRF protection utilities for API routes
 * Uses the csrf library to generate and verify tokens using a shared secret
 */
const tokens = new Tokens();

/**
 * Get the CSRF secret, ensuring it's always consistent
 */
function getCSRFSecret(): string {
    const secret = process.env.CSRF_SECRET;
    if (!secret) {
        throw new Error('CSRF_SECRET environment variable is not configured. Please set it in your environment configuration.');
    }
    return secret;
}

/**
 * Generate a new CSRF token
 * Returns a token that can be verified later with the same secret
 */
export function generateCSRFToken(): string {
    const secret = getCSRFSecret();
    try {
        const token = tokens.create(secret);
        return token;
    } catch (error) {
        console.error('Failed to generate CSRF token:', error);
        throw new Error('Failed to generate CSRF token');
    }
}

/**
 * Validate a CSRF token
 * The token is verified cryptographically without needing storage
 */
export function validateCSRFToken(token: string): boolean {
    const secret = getCSRFSecret();
    try {
        const isValid = tokens.verify(secret, token);
        return isValid;
    } catch (error) {
        // Log validation failure without exposing token details
        console.warn('CSRF token validation failed - token rejected');
        return false;
    }
}
