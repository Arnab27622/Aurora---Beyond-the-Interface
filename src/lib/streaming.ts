/**
 * Streaming response utility - simulated streaming using regular API
 * Chunks responses for better UX
 */

export interface StreamEvent {
  text?: string;
  done?: boolean;
  cached?: boolean;
  error?: string;
}

// Simulate streaming by chunking text into words
export async function* streamChatResponse(
  input: string,
  messages: Array<{ role: string; content: string }>,
  fileContext: any
): AsyncGenerator<StreamEvent, void, unknown> {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input,
        messages,
        fileContext,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      yield {
        error: errorData.message || `HTTP ${response.status} Error`,
      };
      return;
    }

    const data = await response.json();
    const fullContent = data.content || "";

    if (!fullContent) {
      yield { error: "No response content received" };
      return;
    }

    // Simulate streaming by yielding chunks
    // Split by sentences or after N characters for better readability
    const words = fullContent.split(/(\s+)/);
    let chunk = "";

    for (const word of words) {
      chunk += word;
      
      // Yield after every 10 words or on punctuation
      if (chunk.split(/\s+/).length >= 10 || /[.!?]\s*$/.test(chunk)) {
        yield { text: chunk };
        chunk = "";
        // Add small delay to simulate streaming
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    // Yield remaining chunk
    if (chunk.trim()) {
      yield { text: chunk };
    }

    yield { done: true };
  } catch (error) {
    yield {
      error:
        error instanceof Error
          ? error.message
          : "Failed to get response",
    };
  }
}
