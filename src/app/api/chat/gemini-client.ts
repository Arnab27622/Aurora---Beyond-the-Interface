/**
 * Gemini API Client
 * 
 * Handles communication with Google's Gemini API for AI-powered responses.
 * Features:
 * - Request/response handling with error management
 * - Timeout protection against slow responses
 * - Response parsing and text extraction
 * - Detailed error classification and reporting
 * 
 * Environment variables required:
 * - GEMINI_API_KEY: API authentication key
 * - GEMINI_MODEL_ID: Model identifier (default: gemini-2.0-flash)
 * 
 * @see constants.ts for API endpoints and configuration
 */
import { REQUEST_TIMEOUT_MS, GEMINI_API_BASE, GEMINI_GENERATE_ENDPOINT, GENERATION_CONFIG } from "./constants";
import { createErrorResponse, createGeminiErrorResponse } from "./error-handler";
import type { GeminiContent, ApiErrorResponse } from "./types";

/**
 * Calls Gemini API with formatted request content.
 * Handles all HTTP communication including timeouts and error responses.
 * 
 * @param apiKey - Gemini API authentication key
 * @param modelId - Model identifier (e.g., gemini-2.0-flash)
 * @param contents - Formatted message contents for the model
 * @returns {Promise<[data, error, status]>} Tuple with response data, error, and HTTP status
 * 
 * Error codes returned:
 * - REQUEST_TIMEOUT (504): API request exceeded timeout
 * - NETWORK_ERROR (503): Network connectivity issue
 * - INVALID_RESPONSE (502): Response couldn't be parsed
 * - API_ERROR (varies): Gemini API returned error status
 */
export async function callGeminiAPI(
  apiKey: string,
  modelId: string,
  contents: GeminiContent[]
): Promise<[Record<string, unknown> | null, ApiErrorResponse | null, number]> {
  let response: Response;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      response = await fetch(
        `${GEMINI_API_BASE}/${modelId}${GEMINI_GENERATE_ENDPOINT}`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            contents,
            generationConfig: GENERATION_CONFIG,
          }),
          signal: controller.signal,
        }
      );
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (fetchError) {
    if (fetchError instanceof Error && fetchError.name === "AbortError") {
      console.error("Gemini API request timeout");
      const [error, status] = createErrorResponse(
        "Request timeout: Gemini API took too long to respond",
        "REQUEST_TIMEOUT",
        504
      );
      return [null, error, status];
    }
    console.error("Network error calling Gemini API:", fetchError);
    const [error, status] = createErrorResponse(
      "Network error: Failed to connect to Gemini API",
      "NETWORK_ERROR",
      503
    );
    return [null, error, status];
  }

  if (!response.ok) {
    let errorData: Record<string, unknown> = {};
    try {
      errorData = await response.json();
    } catch {
      // Response is not JSON
    }

    const apiErrorMessage =
      (errorData.error as Record<string, unknown>)?.message ||
      errorData.message ||
      response.statusText ||
      "Unknown error";

    const [error, status] = createGeminiErrorResponse(response.status, apiErrorMessage);
    return [null, error, status];
  }

  let data: Record<string, unknown>;
  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch {
    console.error("Failed to parse Gemini API response");
    const [error, status] = createErrorResponse(
      "Invalid response from Gemini API",
      "INVALID_RESPONSE",
      502
    );
    return [null, error, status];
  }

  return [data, null, 200];
}

/**
 * Extracts text response from Gemini API response object.
 * Navigates nested structure to find first text candidate.
 * Returns fallback message if response is empty or invalid.
 * 
 * @param data - Parsed API response from Gemini
 * @returns {string} Extracted text response or fallback message
 */
export function extractBotResponse(data: Record<string, unknown>): string {
  let botText = "Sorry, I couldn't process that request.";

  if (
    data &&
    typeof data === "object" &&
    "candidates" in data &&
    Array.isArray(data.candidates)
  ) {
    const candidates = data.candidates as unknown[];
    if (candidates.length > 0 && candidates[0]) {
      const candidate = candidates[0] as Record<string, unknown>;
      const content = candidate.content as Record<string, unknown> | undefined;
      const parts = content?.parts as unknown[] | undefined;
      if (Array.isArray(parts) && parts.length > 0) {
        const firstPart = parts[0] as Record<string, unknown>;
        if (firstPart.text && typeof firstPart.text === "string") {
          botText = firstPart.text;
        }
      }
    }
  }

  if (!botText || botText.trim().length === 0) {
    console.warn("Empty response from Gemini API");
    botText = "Sorry, I received an empty response. Please try again.";
  }

  return botText;
}
