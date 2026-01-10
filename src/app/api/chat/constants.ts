// Validation constraints
export const MAX_INPUT_LENGTH = 10000;
export const MAX_FILENAME_LENGTH = 255;
export const MAX_FILE_DATA_LENGTH = 5000000; // ~1.33x file size for base64
export const MAX_MESSAGES = 100;
export const MAX_MESSAGE_LENGTH = 10000;
export const REQUEST_TIMEOUT_MS = 30000;

// File and role validation
export const VALID_FILE_TYPES = ["pdf", "image", "txt", "docx", "xlsx", "csv", "pptx"] as const;
export const VALID_ROLES = ["user", "bot", "model"] as const;

// API Configuration
export const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
export const GEMINI_STREAM_ENDPOINT = ":streamGenerateContent?alt=sse";
export const GEMINI_GENERATE_ENDPOINT = ":generateContent";

// File type labels
export const FILE_TYPE_LABELS: Record<string, string> = {
  txt: "Text File",
  docx: "Word Document",
  xlsx: "Excel Spreadsheet",
  csv: "CSV File",
  pptx: "PowerPoint Presentation",
};

// Generation config
export const GENERATION_CONFIG = {
  temperature: 0.7,
  maxOutputTokens: 6000,
} as const;
