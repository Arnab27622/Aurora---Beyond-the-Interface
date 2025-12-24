import { useCallback } from "react";
import { Message, FileContextType } from "@/lib/types";
import { sanitizeInput } from "@/lib/sanitize";
import { responseCache } from "@/lib/cache";

interface UseGeminiReturn {
  sendMessage: (
    input: string,
    messages: Message[],
    fileContext: FileContextType,
    messageId: number
  ) => Promise<{ response: Message; nextMessageId: number; isCached?: boolean }>;
  isConfigured: boolean;
  clearCache?: () => void;
}

export function useGemini(): UseGeminiReturn {
  const isConfigured = true;

  const sendMessage = useCallback(
    async (
      input: string,
      messages: Message[],
      fileContext: FileContextType,
      messageId: number
    ) => {
      // Sanitize input on client side before sending
      const sanitizedInput = sanitizeInput(input);
      const sanitizedMessages = messages.map((m) => ({
        role: m.role,
        content: sanitizeInput(m.content),
      }));

      // Check if response is cached
      const cachedResponse = responseCache.get(sanitizedInput, fileContext);
      if (cachedResponse) {
        const botMessage: Message = {
          id: messageId + 1,
          role: "bot",
          content: cachedResponse,
          isCached: true,
        };

        return {
          response: botMessage,
          nextMessageId: messageId + 2,
          isCached: true,
        };
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: sanitizedInput,
          messages: sanitizedMessages,
          fileContext,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `API error: ${response.status} ${
            errorData.message || response.statusText
          }`
        );
      }

      const data = await response.json();
      const botText =
        data.content || "Sorry, I couldn't process that request.";

      // Cache the response
      responseCache.set(sanitizedInput, botText, fileContext);

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
    []
  );

  return {
    sendMessage,
    isConfigured,
    clearCache: () => responseCache.clear(),
  };
}
