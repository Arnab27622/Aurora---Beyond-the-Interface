export interface ChatRequest {
  input: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  fileContext: {
    type: "pdf" | "image" | "txt" | "docx" | "xlsx" | "csv" | "pptx" | null;
    data: string;
    filename: string;
  } | null;
  skipCache?: boolean;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface StreamChunk {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

export interface GeminiContent {
  role: string;
  parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }>;
}
