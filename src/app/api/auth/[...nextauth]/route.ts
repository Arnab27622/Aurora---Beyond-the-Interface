/**
 * NextAuth Configuration Route
 * 
 * Handles authentication endpoints via NextAuth.js library.
 * Exports pre-configured GET and POST handlers for auth operations.
 * 
 * Features:
 * - User sign in/sign out
 * - Session management
 * - Callback handling
 * - Session validation
 * 
 * Authentication: Handled by NextAuth
 * 
 * Endpoints served:
 * - /api/auth/signin
 * - /api/auth/callback
 * - /api/auth/session
 * - /api/auth/signout
 * - /api/auth/providers
 * 
 * Configuration defined in @/lib/auth with:
 * - CredentialsProvider for email/password auth
 * - Session strategy (JWT)
 * - Callbacks for session customization
 * 
 * @see @/lib/auth for full NextAuth configuration
 */
import { GET, POST } from '@/lib/auth'

export { GET, POST };
