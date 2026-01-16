/**
 * Content Preparation and Building Module
 * 
 * Converts chat request data into Gemini API format.
 * Handles file context integration and message history formatting.
 * 
 * Supported file types:
 * - PDF: Text content embedded in prompt
 * - Images: Sent as inline image data (base64)
 * - Documents: Text, Word, Excel, CSV, PowerPoint (embedded in prompt)
 * 
 * Format:
 * For text files: [FileType: filename]\ncontent\n\n[Question]: user_input
 * For images: Inline image data + user input as text
 */
import { FILE_TYPE_LABELS } from "./constants";
import type { ChatRequest, GeminiContent } from "./types";

export interface PreparedContent {
  apiContent: string;
  filePart: GeminiContent["parts"][0] | null;
}

/**
 * Prepares content and file data for Gemini API.
 * Formats file context according to file type.
 * Returns separate text content and optional binary file data.
 * 
 * @param input - User chat message
 * @param fileContext - Optional file information and data
 * @returns {PreparedContent} Formatted API content and file part
 */
export function prepareContentWithFile(
  input: string,
  fileContext: ChatRequest["fileContext"]
): PreparedContent {
  if (!fileContext || !fileContext.type) {
    return {
      apiContent: input.trim(),
      filePart: null,
    };
  }

  let apiContent = "";
  let filePart: GeminiContent["parts"][0] | null = null;

  if (fileContext.type === "pdf") {
    apiContent = `[PDF: ${fileContext.filename}]\n${fileContext.data}\n\n[Question]: ${input.trim()}`;
  } else if (fileContext.type === "image") {
    filePart = {
      inline_data: {
        mime_type: "image/jpeg",
        data: fileContext.data,
      },
    };
    apiContent =
      input.trim() || `Please analyze this image: ${fileContext.filename}`;
  } else if (["txt", "docx", "xlsx", "csv", "pptx"].includes(fileContext.type)) {
    const label =
      FILE_TYPE_LABELS[fileContext.type] || "Document";
    apiContent = `[${label}: ${fileContext.filename}]\n${fileContext.data}\n\n[Question]: ${input.trim()}`;
  }

  return { apiContent, filePart };
}

/**
 * Builds message content array for Gemini API.
 * Converts message history + current input into Gemini format.
 * Ensures proper role mapping (user/model) for API compatibility.
 * 
 * @param messages - Conversation history
 * @param apiContent - Formatted current user input/question
 * @param filePart - Optional file data to include in request
 * @returns {GeminiContent[]} Formatted contents for Gemini API
 */
export function buildGeminiContents(
  messages: Array<{ role: string; content: string }>,
  apiContent: string,
  filePart: GeminiContent["parts"][0] | null
): GeminiContent[] {
  return [
    ...messages.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    })),
    {
      role: "user",
      parts: filePart
        ? [{ text: apiContent }, filePart]
        : [{ text: apiContent }],
    },
  ] as GeminiContent[];
}
