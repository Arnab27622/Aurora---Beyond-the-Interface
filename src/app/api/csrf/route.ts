import { NextRequest, NextResponse } from "next/server";
import { generateCSRFToken } from "@/lib/csrf";
import { getToken } from "next-auth/jwt";

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
