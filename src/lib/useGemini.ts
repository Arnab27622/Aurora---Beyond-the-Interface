import { useCallback } from "react";
import { Message, FileContextType } from "@/lib/types";
import { sanitizeInput } from "@/lib/sanitize";
import { responseCache } from "@/lib/cache";
import { streamChatResponse, StreamEvent } from "@/lib/streaming";

interface UseGeminiReturn {
  sendMessage: (
    input: string,
    messages: Message[],
    fileContext: FileContextType,
    messageId: number
  ) => Promise<{ response: Message; nextMessageId: number; isCached?: boolean }>;
  streamMessage: (
    input: string,
    messages: Message[],
    fileContext: FileContextType,
    messageId: number,
    onChunk: (text: string) => void,
    skipCache?: boolean
  ) => Promise<{ response: string; isCached?: boolean }>;
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
      const sanitizedInput = sanitizeInput(input);
      const sanitizedMessages = messages.map((m) => ({
        role: m.role,
        content: sanitizeInput(m.content),
      }));

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
          skipCache: false,
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

  const streamMessage = useCallback(
    async (
      input: string,
      messages: Message[],
      fileContext: FileContextType,
      messageId: number,
      onChunk: (text: string) => void,
      skipCache: boolean = false
    ) => {
      const sanitizedInput = sanitizeInput(input);
      const sanitizedMessages = messages.map((m) => ({
        role: m.role,
        content: sanitizeInput(m.content),
      }));

      const cachedResponse = responseCache.get(sanitizedInput, fileContext);
      if (cachedResponse && !skipCache) {
        onChunk(cachedResponse);
        return {
          response: cachedResponse,
          isCached: true,
        };
      }

      let fullResponse = "";
      for await (const event of streamChatResponse(
        sanitizedInput,
        sanitizedMessages,
        fileContext,
        skipCache
      )) {
        if (event.error) {
          throw new Error(event.error);
        }
        if (event.done) {
          responseCache.set(sanitizedInput, fullResponse, fileContext);
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
    clearCache: () => responseCache.clear(),
  };
}
