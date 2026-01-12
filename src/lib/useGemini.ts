import { useCallback } from "react";
import { Message, FileContextType } from "@/lib/types";
import { sanitizeInput } from "@/lib/sanitize";
import { streamChatResponse, StreamEvent } from "@/lib/streaming";
import { getCSRFToken } from "@/lib/csrf";

interface UseGeminiReturn {
  sendMessage: (
    input: string,
    messages: Message[],
    fileContext: FileContextType,
    messageId: number
  ) => Promise<{ response: Message; nextMessageId: number }>;
  streamMessage: (
    input: string,
    messages: Message[],
    fileContext: FileContextType,
    messageId: number,
    onChunk: (text: string) => void
  ) => Promise<{ response: string }>;
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
      const sanitizedInput = sanitizeInput(input);
      const sanitizedMessages = messages.map((m) => ({
        role: m.role,
        content: sanitizeInput(m.content),
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": getCSRFToken(),
        },
        body: JSON.stringify({
          input: sanitizedInput,
          messages: sanitizedMessages,
          fileContext,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `API error: ${response.status} ${errorData.message || response.statusText
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

  const streamMessage = useCallback(
    async (
      input: string,
      messages: Message[],
      fileContext: FileContextType,
      messageId: number,
      onChunk: (text: string) => void
    ) => {
      const sanitizedInput = sanitizeInput(input);
      const sanitizedMessages = messages.map((m) => ({
        role: m.role,
        content: sanitizeInput(m.content),
      }));

      let fullResponse = "";
      for await (const event of streamChatResponse(
        sanitizedInput,
        sanitizedMessages,
        fileContext
      )) {
        if (event.error) {
          throw new Error(event.error);
        }
        if (event.done) {
          break;
        }
        if (event.text) {
          fullResponse += event.text;
          onChunk(event.text);
        }
      }

      return {
        response: fullResponse,
      };
    },
    []
  );

  return {
    sendMessage,
    streamMessage,
    isConfigured,
  };
}
