/**
 * Request Data Sanitization Module
 * 
 * Sanitizes user inputs to prevent XSS and injection attacks.
 * Applied to all user-provided data before processing:
 * - Chat input text
 * - Message history content
 * - File metadata (filename)
 * - Image data (base64 validation)
 * 
 * Uses sanitization utilities from @/lib/sanitize for:
 * - HTML entity encoding
 * - Base64 validation
 * - Filename normalization
 */
import { sanitizeInput, sanitizeFilename, sanitizeBase64 } from "@/lib/sanitize";
import type { ChatRequest } from "./types";

export interface SanitizedContent {
  input: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  fileContext: ChatRequest["fileContext"];
}

/**
 * Sanitizes all incoming request data.
 * 
 * @param body - Chat request body with user input
 * @returns {SanitizedContent} Sanitized data safe for API calls and storage
 * @throws {Error} If image data is invalid base64
 */
export function sanitizeRequestData(body: ChatRequest): SanitizedContent {
  let { input, messages, fileContext } = body;

  input = sanitizeInput(input);

  messages = messages.map((msg) => ({
    role: msg.role,
    content: sanitizeInput(msg.content),
  }));

  if (fileContext) {
    if (fileContext.filename) {
      fileContext.filename = sanitizeFilename(fileContext.filename);
    }
    if (fileContext.data && fileContext.type === "image") {
      try {
        fileContext.data = sanitizeBase64(fileContext.data);
      } catch (error) {
        console.error("Failed to sanitize image data:", error);
        throw new Error("Invalid image data format");
      }
    }
  }

  return { input, messages, fileContext };
}
