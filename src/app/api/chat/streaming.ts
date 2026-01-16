/**
 * Streaming Response Handler
 * 
 * Manages Server-Sent Events (SSE) streaming from Gemini API.
 * Handles real-time chunked responses and formats them for client consumption.
 * 
 * Features:
 * - Async generator for lazy evaluation of stream chunks
 * - Error handling and timeout management
 * - SSE format parsing and relay
 * - Proper stream cleanup on completion or error
 * 
 * Response format:
 * - data: {"text": "chunk"}\n\n - Text chunks
 * - data: {"done": true}\n\n - Stream completion
 * - data: {"error": "message"}\n\n - Stream errors
 */
import { REQUEST_TIMEOUT_MS, GEMINI_API_BASE, GEMINI_STREAM_ENDPOINT, GENERATION_CONFIG } from "./constants";
import type { StreamChunk } from "./types";

/**
 * Streams response chunks from Gemini API.
 * Connects to streaming endpoint and yields text chunks as they arrive.
 * 
 * @param apiKey - Gemini API key
 * @param modelId - Model identifier (e.g., gemini-2.0-flash)
 * @param contents - Formatted request contents for Gemini API
 * @yields {string} Text chunks from API response
 */
export async function* streamFromGemini(
  apiKey: string,
  modelId: string,
  contents: unknown[]
): AsyncGenerator<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS + 30000
  );

  try {
    const resp = await fetch(
      `${GEMINI_API_BASE}/${modelId}${GEMINI_STREAM_ENDPOINT}&key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: GENERATION_CONFIG,
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.error?.message || "API error");
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines[lines.length - 1];

      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith(":")) continue;

        if (line.startsWith("data: ")) {
          try {
            const chunk: StreamChunk = JSON.parse(line.slice(6));
            if (chunk.candidates?.[0]?.content?.parts?.[0]?.text) {
              yield chunk.candidates[0].content.parts[0].text;
            }
          } catch (e) {
            continue;
          }
        }
      }
    }

    if (buffer.trim().startsWith("data: ")) {
      try {
        const chunk: StreamChunk = JSON.parse(buffer.trim().slice(6));
        if (chunk.candidates?.[0]?.content?.parts?.[0]?.text) {
          yield chunk.candidates[0].content.parts[0].text;
        }
      } catch (e) {
        // Skip
      }
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Converts async generator into ReadableStream for HTTP response.
 * Handles backpressure and error propagation.
 * 
 * @param encoder - TextEncoder instance for encoding chunks
 * @param streamGenerator - Async generator yielding text chunks
 * @returns {ReadableStream<Uint8Array>} HTTP-compatible stream
 */
export function createStreamResponse(
  encoder: TextEncoder,
  streamGenerator: AsyncGenerator<string>
): ReadableStream<Uint8Array> {
  return new ReadableStream({
    async start(controller) {
      let fullResponse = "";
      try {
        for await (const chunk of streamGenerator) {
          fullResponse += chunk;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`)
          );
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        controller.close();
      } catch (error) {
        console.error("Streaming error:", error);
        const msg = error instanceof Error ? error.message : "Unknown error";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
        );
        controller.close();
      }
    },
  });
}
