import { REQUEST_TIMEOUT_MS, GEMINI_API_BASE, GEMINI_STREAM_ENDPOINT, GENERATION_CONFIG } from "./constants";
import type { StreamChunk } from "./types";

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
