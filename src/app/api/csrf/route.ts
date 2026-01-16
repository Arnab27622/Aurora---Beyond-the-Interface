/**
 * CSRF Token API
 * 
 * Generates Cross-Site Request Forgery (CSRF) protection tokens.
 * Tokens must be included in the x-csrf-token header for state-modifying requests.
 * 
 * Features:
 * - Stateless token generation (no storage required)
 * - Cryptographically secure random tokens
 * - Per-request token generation
 * - Authentication required
 * 
 * Authentication: Required (NextAuth session)
 * Method: GET
 * 
 * Response:
 * { token: string } - CSRF token for use in x-csrf-token header
 * 
 * Usage:
 * 1. GET /api/csrf to obtain token
 * 2. Include token in x-csrf-token header for POST, PUT, DELETE requests
 * 3. Server validates token on protected endpoints
 * 
 * Token TTL: Typically short-lived (minutes to hours depending on implementation)
 */
import { NextRequest, NextResponse } from "next/server";
import { generateCSRFToken } from "@/lib/csrf";
import { getToken } from "next-auth/jwt";

/**
 * GET /api/csrf
 * 
 * Generates a new CSRF token for the authenticated user.
 * Requires valid NextAuth session.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const token = await getToken({ req: request });
    if (!token) {
      console.warn("CSRF endpoint: User not authenticated - no valid token provided");
      return NextResponse.json(
        { 
          error: "Unauthorized",
          code: "NO_AUTH_TOKEN",
          message: "Authentication required. Please log in first."
        },
        { status: 401 }
      );
    }

    // Generate a new CSRF token (cryptographically secure, no storage needed)
    const csrfToken = generateCSRFToken();

    return NextResponse.json(
      { token: csrfToken },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating CSRF token:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate CSRF token",
        code: "TOKEN_GENERATION_ERROR",
        message: "An error occurred while generating the CSRF token. Please try again."
      },
      { status: 500 }
    );
  }
}
