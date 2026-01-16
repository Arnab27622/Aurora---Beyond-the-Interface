/**
 * Gemini AI Integration Hook
 * 
 * Provides interface to Gemini API for chat interactions:
 * - sendMessage: Single request with full response
 * - streamMessage: SSE streaming for real-time responses
 * 
 * Features:
 * - Input sanitization for security
 * - CSRF token management with retry logic
 * - Automatic token refresh on 403 errors
 * - File context support for document-aware responses
 * - Async generator for streaming responses
 */

import { useCallback } from "react";
import { Message, FileContextType } from "@/lib/types";
import { sanitizeInput } from "@/lib/sanitize";
import { streamChatResponse } from "@/lib/streaming";

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

let cachedCSRFToken: string | null = null;

/**
 * Clear cached CSRF token (useful after validation failure)
 */
function clearCSRFTokenCache(): void {
  cachedCSRFToken = null;
}

/**
 * Fetch fresh CSRF token from server
 */
async function fetchCSRFToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedCSRFToken) {
    return cachedCSRFToken;
  }

  try {
    const response = await fetch("/api/csrf");
    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response.status}`);
    }
    const data = await response.json();
    cachedCSRFToken = data.token;
    return data.token;
  } catch (error) {
    clearCSRFTokenCache();
    throw new Error(
      `Failed to fetch CSRF token: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Gemini AI Integration Hook
 * 
 * Provides interface to Gemini API for chat interactions:
 * - sendMessage: Single request with full response
 * - streamMessage: SSE streaming for real-time responses
 * - Handles CSRF tokens and input sanitization
 * 
 * @returns Object containing message sending functions
 */
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

      // Fetch CSRF token with retry logic for stale tokens
      let csrfToken = await fetchCSRFToken();

      let response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          input: sanitizedInput,
          messages: sanitizedMessages,
          fileContext,
        }),
      });

      // If CSRF token is invalid, clear cache and retry with fresh token
      if (response.status === 403) {
        clearCSRFTokenCache();
        csrfToken = await fetchCSRFToken(true);

        response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfToken,
          },
          body: JSON.stringify({
            input: sanitizedInput,
            messages: sanitizedMessages,
            fileContext,
          }),
        });
      }

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
