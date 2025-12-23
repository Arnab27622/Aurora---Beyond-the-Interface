import { useCallback } from "react";
import { Message, FileContextType } from "@/lib/types";

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
  const isConfigured = true;

  const sendMessage = useCallback(
    async (
      input: string,
      messages: Message[],
      fileContext: FileContextType,
      messageId: number
    ) => {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
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
  };
}
