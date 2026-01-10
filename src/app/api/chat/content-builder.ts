import { FILE_TYPE_LABELS } from "./constants";
import type { ChatRequest, GeminiContent } from "./types";

export interface PreparedContent {
  apiContent: string;
  filePart: GeminiContent["parts"][0] | null;
}

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
