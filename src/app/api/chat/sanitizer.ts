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
