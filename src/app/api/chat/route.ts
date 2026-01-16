/**
 * Chat API Route Handler
 * 
 * Handles chat message processing with optional streaming response.
 * Supports multi-turn conversations and file context (PDF, images, documents).
 * 
 * Features:
 * - CSRF protection via token validation
 * - Request validation and sanitization
 * - Support for file context (PDF, images, text documents)
 * - Streaming and non-streaming responses
 * - Error handling with detailed error codes
 * - Request timeout handling
 * 
 * Authentication: Required (via JWT token from NextAuth)
 * Content-Type: application/json
 * 
 * Request body:
 * {
 *   input: string (max 10000 chars) - Current user message
 *   messages: array - Message history with role and content
 *   fileContext: object - Optional file data (type, data, filename)
 *   skipCache?: boolean - Optional cache skip flag
 * }
 * 
 * Query parameters:
 * - stream=true: Enable server-sent events streaming response
 * 
 * Response:
 * - Streaming: Server-sent events with text chunks
 * - Non-streaming: JSON with { content: string }
 * 
 * @see validation.ts for request validation logic
 * @see sanitizer.ts for data sanitization
 * @see gemini-client.ts for API integration
 */
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { validateRequestBody } from "./validation";
import { sanitizeRequestData } from "./sanitizer";
import { createErrorResponse } from "./error-handler";
import { prepareContentWithFile, buildGeminiContents } from "./content-builder";
import { callGeminiAPI, extractBotResponse } from "./gemini-client";
import { streamFromGemini, createStreamResponse } from "./streaming";
import { validateCSRFToken } from "@/lib/csrf";
import { logWarn, logError } from "@/lib/logger";
import type { ChatRequest } from "./types";

/**
 * POST /api/chat
 * 
 * Processes a chat message and returns bot response.
 * Requires authentication and valid CSRF token.
 */
export async function POST(request: NextRequest) {
  // Validate request method
  if (request.method !== "POST") {
    const [error, status] = createErrorResponse(
      "Method not allowed",
      "METHOD_NOT_ALLOWED",
      405
    );
    return NextResponse.json(error, { status });
  }

  // Get user session for CSRF validation
  const token = await getToken({ req: request });
  if (!token) {
    const [error, status] = createErrorResponse(
      "Unauthorized",
      "UNAUTHORIZED",
      401
    );
    return NextResponse.json(error, { status });
  }

  // Validate CSRF token
  const csrfToken = request.headers.get("x-csrf-token");
  if (!csrfToken) {
    logWarn("CSRF token missing from request", undefined, "ChatAPI");
    const [error, status] = createErrorResponse(
      "CSRF token missing",
      "CSRF_MISSING",
      403
    );
    return NextResponse.json(error, { status });
  }

  const isValidCSRF = validateCSRFToken(csrfToken);
  if (!isValidCSRF) {
    logWarn("CSRF token validation failed", undefined, "ChatAPI");
    const [error, status] = createErrorResponse(
      "Invalid CSRF token",
      "CSRF_INVALID",
      403
    );
    return NextResponse.json(error, { status });
  }

  // Validate Content-Type
  const contentType = request.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    const [error, status] = createErrorResponse(
      "Content-Type must be application/json",
      "INVALID_CONTENT_TYPE",
      400
    );
    return NextResponse.json(error, { status });
  }

  // Check if streaming is requested
  const url = new URL(request.url);
  const isStreaming = url.searchParams.get("stream") === "true";

  try {
    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      const [error, status] = createErrorResponse(
        "Invalid JSON in request body",
        "INVALID_JSON",
        400
      );
      return NextResponse.json(error, { status });
    }

    const validation = validateRequestBody(body);
    if (!validation.valid) {
      const [error, status] = createErrorResponse(
        validation.error || "Invalid request body",
        "VALIDATION_ERROR",
        400
      );
      return NextResponse.json(error, { status });
    }

    // Sanitize request data
    const typedBody = body as ChatRequest;
    let { input, messages, fileContext } = sanitizeRequestData(typedBody);

    // Validate environment variables
    const API_KEY = process.env.GEMINI_API_KEY;
    const MODEL_ID = process.env.GEMINI_MODEL_ID;

    if (!API_KEY || !API_KEY.trim()) {
      logError("GEMINI_API_KEY is not configured", "Missing environment variable", "ChatAPI");
      const [error, status] = createErrorResponse(
        "Server configuration error: API key not found",
        "CONFIG_ERROR",
        500
      );
      return NextResponse.json(error, { status });
    }

    if (!MODEL_ID || !MODEL_ID.trim()) {
      logError("GEMINI_MODEL_ID is not configured", "Missing environment variable", "ChatAPI");
      const [error, status] = createErrorResponse(
        "Server configuration error: Model ID not found",
        "CONFIG_ERROR",
        500
      );
      return NextResponse.json(error, { status });
    }

    // Prepare content with file context
    const { apiContent, filePart } = prepareContentWithFile(input, fileContext);

    if (!apiContent || apiContent.trim().length === 0) {
      const [error, status] = createErrorResponse(
        "Cannot prepare API content from input",
        "CONTENT_PREPARATION_ERROR",
        400
      );
      return NextResponse.json(error, { status });
    }

    // Build Gemini API contents
    const contents = buildGeminiContents(messages, apiContent, filePart);

    // Handle streaming response
    if (isStreaming) {
      const encoder = new TextEncoder();
      const stream = createStreamResponse(
        encoder,
        streamFromGemini(API_KEY, MODEL_ID, contents)
      );

      return new NextResponse(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Call Gemini API for non-streaming request
    const [data, apiError, status] = await callGeminiAPI(API_KEY, MODEL_ID, contents as any);

    if (apiError) {
      return NextResponse.json(apiError, { status });
    }

    const botText = extractBotResponse(data!);

    return NextResponse.json(
      {
        content: botText,
      },
      { status: 200 }
    );
  } catch (error) {
    logError("Unexpected error in chat API", error, "ChatAPI");

    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    const [apiError] = createErrorResponse(
      `Internal server error: ${errorMessage}`,
      "INTERNAL_ERROR",
      500
    );

    return NextResponse.json(apiError, { status: 500 });
  }
}
