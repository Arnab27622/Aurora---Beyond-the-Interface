import {
  sanitizeBase64,
  detectSuspiciousPatterns,
} from "@/lib/sanitize";
import {
  MAX_INPUT_LENGTH,
  MAX_FILENAME_LENGTH,
  MAX_FILE_DATA_LENGTH,
  MAX_MESSAGES,
  MAX_MESSAGE_LENGTH,
  VALID_FILE_TYPES,
  VALID_ROLES,
} from "./constants";
import type { ValidationResult, ChatRequest } from "./types";

export function validateInput(input: string): ValidationResult {
  if (!input) {
    return { valid: false, error: "Input cannot be empty" };
  }
  if (typeof input !== "string") {
    return { valid: false, error: "Input must be a string" };
  }
  if (input.length > MAX_INPUT_LENGTH) {
    return {
      valid: false,
      error: `Input exceeds maximum length of ${MAX_INPUT_LENGTH} characters`,
    };
  }
  if (input.trim().length === 0) {
    return { valid: false, error: "Input cannot be only whitespace" };
  }

  const suspiciousCheck = detectSuspiciousPatterns(input);
  if (suspiciousCheck.isSuspicious) {
    return {
      valid: false,
      error: `Invalid input: ${suspiciousCheck.reason}`,
    };
  }

  return { valid: true };
}

export function validateMessages(messages: unknown): ValidationResult {
  if (!Array.isArray(messages)) {
    return { valid: false, error: "Messages must be an array" };
  }
  if (messages.length > MAX_MESSAGES) {
    return {
      valid: false,
      error: `Messages array exceeds maximum of ${MAX_MESSAGES} items`,
    };
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || typeof msg !== "object") {
      return { valid: false, error: `Message at index ${i} is invalid` };
    }

    const typedMsg = msg as Record<string, unknown>;

    if (!typedMsg.role || typeof typedMsg.role !== "string") {
      return {
        valid: false,
        error: `Message at index ${i} has invalid role`,
      };
    }

    if (!VALID_ROLES.includes(typedMsg.role as any)) {
      return {
        valid: false,
        error: `Message at index ${i} has invalid role: ${typedMsg.role}`,
      };
    }

    if (!typedMsg.content || typeof typedMsg.content !== "string") {
      return {
        valid: false,
        error: `Message at index ${i} has invalid content`,
      };
    }

    if ((typedMsg.content as string).length > MAX_MESSAGE_LENGTH) {
      return {
        valid: false,
        error: `Message at index ${i} exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`,
      };
    }

    const suspiciousCheck = detectSuspiciousPatterns(
      typedMsg.content as string
    );
    if (suspiciousCheck.isSuspicious) {
      return {
        valid: false,
        error: `Message at index ${i} contains invalid patterns: ${suspiciousCheck.reason}`,
      };
    }
  }

  return { valid: true };
}

export function validateFileContext(fileContext: unknown): ValidationResult {
  if (fileContext === null || fileContext === undefined) {
    return { valid: true };
  }

  if (typeof fileContext !== "object") {
    return { valid: false, error: "File context must be an object or null" };
  }

  const ctx = fileContext as Record<string, unknown>;

  if (ctx.type !== null && ctx.type !== undefined) {
    if (typeof ctx.type !== "string") {
      return { valid: false, error: "File type must be a string or null" };
    }
    if (!VALID_FILE_TYPES.includes(ctx.type as any)) {
      return {
        valid: false,
        error: `Invalid file type: ${ctx.type}. Must be one of: ${VALID_FILE_TYPES.join(", ")}`,
      };
    }
  }

  if (ctx.data !== null && ctx.data !== undefined) {
    if (typeof ctx.data !== "string") {
      return { valid: false, error: "File data must be a string or null" };
    }
    if ((ctx.data as string).length > MAX_FILE_DATA_LENGTH) {
      return {
        valid: false,
        error: `File data exceeds maximum length of ${MAX_FILE_DATA_LENGTH} characters`,
      };
    }
    if ((ctx.data as string).length === 0) {
      return { valid: false, error: "File data cannot be empty" };
    }

    if (ctx.type === "image") {
      try {
        sanitizeBase64(ctx.data as string);
      } catch (error) {
        return {
          valid: false,
          error: `Invalid file data format: ${error instanceof Error ? error.message : "Invalid base64"}`,
        };
      }
    }
  }

  if (ctx.filename !== null && ctx.filename !== undefined) {
    if (typeof ctx.filename !== "string") {
      return { valid: false, error: "Filename must be a string or null" };
    }
    if ((ctx.filename as string).length > MAX_FILENAME_LENGTH) {
      return {
        valid: false,
        error: `Filename exceeds maximum length of ${MAX_FILENAME_LENGTH} characters`,
      };
    }
  }

  return { valid: true };
}

export function validateRequestBody(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a JSON object" };
  }

  const typedBody = body as Record<string, unknown>;

  const inputValidation = validateInput(typedBody.input as string);
  if (!inputValidation.valid) {
    return inputValidation;
  }

  const messagesValidation = validateMessages(typedBody.messages);
  if (!messagesValidation.valid) {
    return messagesValidation;
  }

  const fileContextValidation = validateFileContext(typedBody.fileContext);
  if (!fileContextValidation.valid) {
    return fileContextValidation;
  }

  return { valid: true };
}
