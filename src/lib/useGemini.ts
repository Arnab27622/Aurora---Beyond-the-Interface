import { useCallback } from "react";
import { Message, FileContextType } from "@/lib/types";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const MODEL_ID = process.env.NEXT_PUBLIC_GEMINI_MODEL_ID;

interface UseGeminiReturn {
  sendMessage: (
    input: string,
    messages: Message[],
    fileContext: FileContextType,
    messageId: number
  ) => Promise<{ response: Message; nextMessageId: number }>;
  isConfigured: boolean;
}

export function useGemini(): UseGeminiReturn {
  const isConfigured = Boolean(
    API_KEY && API_KEY !== "YOUR_API_KEY_HERE" && MODEL_ID
  );

  const sendMessage = useCallback(
    async (
      input: string,
      messages: Message[],
      fileContext: FileContextType,
      messageId: number
    ) => {
      if (!isConfigured) {
        throw new Error(
          "Please set your Google API key in the environment variables. Get a free key from Google AI Studio"
        );
      }

      // Prepare API content with file context if available
      let apiContent = "";
      let filePart = null;

      if (fileContext) {
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
            input.trim() ||
            `Please analyze this image: ${fileContext.filename}`;
        }
      } else {
        apiContent = input.trim();
      }

      // Prepare messages for API
      const contents = [
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
      ];

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `API error: ${response.status} ${
            errorData.error?.message || response.statusText
          }`
        );
      }

      const data = await response.json();
      const botText =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I couldn't process that request.";

      const botMessage: Message = {
        id: messageId + 1,
        role: "bot",
        content: botText,
      };

      return {
        response: botMessage,
        nextMessageId: messageId + 2,
      };
    },
    [isConfigured]
  );

  return {
    sendMessage,
    isConfigured,
  };
}
