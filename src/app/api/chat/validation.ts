/**
 * Request Validation Module
 * 
 * Provides comprehensive validation for chat API requests using Zod schemas
 * and custom validation functions. Includes:
 * - Input text validation (length, content)
 * - Message history validation (format, content)
 * - File context validation (type, size, format)
 * - Security pattern detection (XSS, injection attacks)
 * 
 * Validation constraints are defined in constants.ts:
 * - MAX_INPUT_LENGTH: 10000 characters
 * - MAX_MESSAGE_LENGTH: 10000 characters per message
 * - MAX_MESSAGES: 100 messages max
 * - MAX_FILE_DATA_LENGTH: 5MB (base64 encoded)
 * 
 * @see types.ts for ValidationResult interface
 * @see constants.ts for validation limits
 */
import { z } from "zod";
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
import type { ValidationResult } from "./types";

/**
 * Detect only XSS/HTML injection patterns (less strict for file content)
 * Used for message history which may contain legitimate file data
 */
function detectCriticalSecurityPatterns(input: string): {
  isSuspicious: boolean;
  reason?: string;
} {
  if (typeof input !== "string") {
    return { isSuspicious: true, reason: "Input must be a string" };
  }

  // Only check for actual code injection attacks, not data patterns
  const criticalPatterns = [
    // XSS patterns
    /<script/i,
    /<iframe/i,
    /javascript:/i,
    /vbscript:/i,
    /data:text\/html/i,
    /data:text\/javascript/i,
    /expression\s*\(/i,

    // Event handlers
    /on\w+\s*=\s*["'][^"']*["']/i,
    /on\w+\s*=\s*[^\s>]*/i,

    // Path traversal
    /\.\.[\/\\]/,
    /%2e%2e[\/\\]/i,

    // Dangerous HTML tags
    /<object/i,
    /<embed/i,
    /<applet/i,
    /<meta/i,
    /<link/i,
    /<base/i,
    /file:\/\//i,
  ];

  for (const pattern of criticalPatterns) {
    if (pattern.test(input)) {
      return {
        isSuspicious: true,
        reason: `Detected potentially malicious pattern: ${pattern.source}`,
      };
    }
  }

  return { isSuspicious: false };
}

// Zod schemas for enhanced validation
const messageSchema = z.object({
  role: z.enum([...VALID_ROLES]),
  content: z.string()
    .min(1, "Message content cannot be empty")
    .max(MAX_MESSAGE_LENGTH, `Message content exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`)
    .refine((content) => {
      const suspiciousCheck = detectCriticalSecurityPatterns(content);
      return !suspiciousCheck.isSuspicious;
    }, "Message content contains suspicious patterns"),
});

const fileContextSchema = z.object({
  type: z.enum([...VALID_FILE_TYPES]).nullable().optional(),
  data: z.string()
    .min(1, "File data cannot be empty")
    .max(MAX_FILE_DATA_LENGTH, `File data exceeds maximum length of ${MAX_FILE_DATA_LENGTH} characters`)
    .optional()
    .nullable()
    .refine((data) => {
      if (!data) return true;
      // Note: We can't access parent context in this simple refine
      // Additional validation will be done in the main validation function
      return true;
    }, "Invalid file data format"),
  filename: z.string()
    .max(MAX_FILENAME_LENGTH, `Filename exceeds maximum length of ${MAX_FILENAME_LENGTH} characters`)
    .optional()
    .nullable(),
}).nullable().optional();

const chatRequestSchema = z.object({
  input: z.string()
    .min(1, "Input cannot be empty")
    .max(MAX_INPUT_LENGTH, `Input exceeds maximum length of ${MAX_INPUT_LENGTH} characters`)
    .refine((input) => input.trim().length > 0, "Input cannot be only whitespace")
    .refine((input) => {
      const suspiciousCheck = detectSuspiciousPatterns(input);
      return !suspiciousCheck.isSuspicious;
    }, "Input contains suspicious patterns"),
  messages: z.array(messageSchema)
    .min(1, "At least one message is required")
    .max(MAX_MESSAGES, `Messages array exceeds maximum of ${MAX_MESSAGES} items`),
  fileContext: fileContextSchema,
});

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

    // Use less strict pattern detection for message history (file content may contain data patterns)
    const suspiciousCheck = detectCriticalSecurityPatterns(
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

/**
 * Enhanced schema-based validation using Zod
 */
export function validateRequestWithSchema(body: unknown): ValidationResult {
  try {
    chatRequestSchema.parse(body);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        valid: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }
    return { valid: false, error: "Invalid request format" };
  }
}

export function validateRequestBody(body: unknown): ValidationResult {
  // First try schema-based validation for comprehensive checks
  const schemaValidation = validateRequestWithSchema(body);
  if (!schemaValidation.valid) {
    return schemaValidation;
  }

  // Fallback to original validation for additional custom checks
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
