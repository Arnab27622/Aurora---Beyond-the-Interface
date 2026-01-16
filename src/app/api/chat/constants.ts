/**
 * Chat API Constants and Configuration
 * 
 * Central configuration for:
 * - Validation limits and constraints
 * - Gemini API endpoints and settings
 * - Generation parameters
 * - Supported file types
 */

// ============================================================================
// Validation Constraints
// ============================================================================
// These limits prevent abuse and manage system resources

/** Maximum length of user input in a single message */
export const MAX_INPUT_LENGTH = 10000;
/** Maximum length of uploaded file filename */
export const MAX_FILENAME_LENGTH = 255;
/** Maximum file data size (base64 encoded, ~1.33x actual size) */
export const MAX_FILE_DATA_LENGTH = 5000000;
/** Maximum number of messages in conversation history */
export const MAX_MESSAGES = 100;
/** Maximum length of a single message in history */
export const MAX_MESSAGE_LENGTH = 10000;
/** Request timeout for external API calls (30 seconds) */
export const REQUEST_TIMEOUT_MS = 30000;

// ============================================================================
// File and Role Validation
// ============================================================================

/** Supported file types for context */
export const VALID_FILE_TYPES = ["pdf", "image", "txt", "docx", "xlsx", "csv", "pptx"] as const;
/** Allowed message roles */
export const VALID_ROLES = ["user", "bot", "model"] as const;

// ============================================================================
// Gemini API Configuration
// ============================================================================

/** Base URL for Gemini API endpoints */
export const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
/** Endpoint for streaming responses (Server-Sent Events) */
export const GEMINI_STREAM_ENDPOINT = ":streamGenerateContent?alt=sse";
/** Endpoint for standard (non-streaming) responses */
export const GEMINI_GENERATE_ENDPOINT = ":generateContent";

// ============================================================================
// File Type Metadata
// ============================================================================

/** Human-readable labels for file types */
export const FILE_TYPE_LABELS: Record<string, string> = {
  txt: "Text File",
  docx: "Word Document",
  xlsx: "Excel Spreadsheet",
  csv: "CSV File",
  pptx: "PowerPoint Presentation",
};

// ============================================================================
// Generation Configuration
// ============================================================================
// Parameters for Gemini API response generation

/** Generation parameters for Gemini API calls */
export const GENERATION_CONFIG = {
  /** Temperature: Controls randomness (0.7 = balanced) */
  temperature: 0.7,
  /** Maximum output tokens for a single response */
  maxOutputTokens: 6000,
} as const;
