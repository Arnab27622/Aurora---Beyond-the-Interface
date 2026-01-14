import type { ApiErrorResponse } from "./types";
import { logError } from "@/lib/logger";

export function createErrorResponse(
  message: string,
  code: string = "UNKNOWN_ERROR",
  statusCode: number = 400
): [ApiErrorResponse, number] {
  return [
    {
      error: code,
      message,
    },
    statusCode,
  ];
}

export function createGeminiErrorResponse(
  status: number,
  apiErrorMessage: unknown
): [ApiErrorResponse, number] {
  // Sanitize the error message to prevent sensitive data leakage
  const sanitizedStatusText = sanitizeErrorMessage(apiErrorMessage);

  const errorMessage =
    status === 429
      ? "Too many requests to Gemini API. Please try again later."
      : status === 401 || status === 403
        ? "Unauthorized: Invalid or expired API credentials"
        : status === 400
          ? `Bad request to Gemini API: ${sanitizedStatusText}`
          : `Gemini API error (${status}): ${sanitizedStatusText}`;

  const errorCode =
    status === 429
      ? "RATE_LIMITED"
      : status === 401 || status === 403
        ? "AUTH_ERROR"
        : status === 400
          ? "BAD_REQUEST"
          : "API_ERROR";

  // Log sanitized error for debugging without exposing sensitive data
  logError(`Gemini API error [${status}]`, sanitizedStatusText, "GeminiAPI");

  return [
    { error: errorCode, message: errorMessage },
    Math.min(status, 500),
  ];
}

/**
 * Sanitizes error messages to prevent sensitive data leakage
 * Removes potential API keys, tokens, passwords, and other sensitive information
 */
function sanitizeErrorMessage(apiErrorMessage: unknown): string {
  let statusText =
    typeof apiErrorMessage === "object" && apiErrorMessage !== null
      ? JSON.stringify(apiErrorMessage)
      : String(apiErrorMessage);

  // Patterns to sanitize
  const sensitivePatterns = [
    // API keys (common formats)
    /\b[A-Za-z0-9]{32,}\b/g, // Generic long alphanumeric strings
    /\b[A-Za-z0-9]{40,}\b/g, // Longer keys
    // Bearer tokens
    /\bbearer\s+[A-Za-z0-9\-_\.]{20,}/gi,
    // Authorization headers
    /\bauthorization\s*:\s*[^\s]+/gi,
    // Passwords
    /\bpassword\s*[:=]\s*[^\s]+/gi,
    // Secrets
    /\bsecret\s*[:=]\s*[^\s]+/gi,
    // Tokens
    /\btoken\s*[:=]\s*[^\s]+/gi,
    // Keys
    /\bkey\s*[:=]\s*[^\s]+/gi,
    // Email addresses (might contain sensitive info)
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    // URLs with potential sensitive parameters
    /https?:\/\/[^\s]*[?&](?:api_key|apikey|token|key|secret|password)=[^\s&]*/gi,
  ];

  // Apply sanitization
  sensitivePatterns.forEach(pattern => {
    statusText = statusText.replace(pattern, '[REDACTED]');
  });

  // Limit error message length to prevent overly verbose errors
  if (statusText.length > 500) {
    statusText = statusText.substring(0, 500) + '... [TRUNCATED]';
  }

  return statusText;
}
