import type { ApiErrorResponse } from "./types";

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
  const statusText =
    typeof apiErrorMessage === "object" && apiErrorMessage !== null
      ? JSON.stringify(apiErrorMessage)
      : String(apiErrorMessage);

  const errorMessage =
    status === 429
      ? "Too many requests to Gemini API. Please try again later."
      : status === 401 || status === 403
        ? "Unauthorized: Invalid or expired API credentials"
        : status === 400
          ? `Bad request to Gemini API: ${statusText}`
          : `Gemini API error (${status}): ${statusText}`;

  const errorCode =
    status === 429
      ? "RATE_LIMITED"
      : status === 401 || status === 403
        ? "AUTH_ERROR"
        : status === 400
          ? "BAD_REQUEST"
          : "API_ERROR";

  console.error(`Gemini API error [${status}]:`, statusText);

  return [
    { error: errorCode, message: errorMessage },
    Math.min(status, 500),
  ];
}
