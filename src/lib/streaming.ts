/**
 * True streaming response utility using Server-Sent Events (SSE)
 * Makes request to /api/chat with stream=true parameter
 */

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

export interface StreamEvent {
  text?: string;
  done?: boolean;
  cached?: boolean;
  error?: string;
}

export async function* streamChatResponse(
  input: string,
  messages: Array<{ role: string; content: string }>,
  fileContext: any
): AsyncGenerator<StreamEvent, void, unknown> {
  try {
    // Fetch CSRF token with retry logic for stale tokens
    let csrfToken = await fetchCSRFToken();

    let response = await fetch("/api/chat?stream=true", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({
        input,
        messages,
        fileContext,
      }),
    });

    // If CSRF token is invalid, clear cache and retry with fresh token
    if (response.status === 403) {
      // Check if error message indicates CSRF issue
      const errorData = await response.json().catch(() => ({}));
      if ((errorData as any).error?.includes?.('CSRF') || (errorData as any).error?.startsWith?.('CSRF')) {
        clearCSRFTokenCache();
        csrfToken = await fetchCSRFToken(true);

        response = await fetch("/api/chat?stream=true", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfToken,
          },
          body: JSON.stringify({
            input,
            messages,
            fileContext,
          }),
        });
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      yield {
        error: (errorData as any).message || `HTTP ${response.status} Error`,
      };
      return;
    }

    if (!response.body) {
      yield { error: "No response body from server" };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");

      // Keep the last incomplete line in the buffer
      buffer = lines[lines.length - 1];

      // Process complete lines
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();

        // Skip empty lines and comments
        if (!line || line.startsWith(":")) continue;

        // Parse SSE data format
        if (line.startsWith("data: ")) {
          const jsonStr = line.slice(6);

          try {
            const event: StreamEvent = JSON.parse(jsonStr);
            yield event;
          } catch (e) {
            // Skip invalid JSON, continue processing
            continue;
          }
        }
      }
    }

    // Process any remaining data in buffer
    if (buffer.trim() && buffer.trim().startsWith("data: ")) {
      const jsonStr = buffer.trim().slice(6);
      try {
        const event: StreamEvent = JSON.parse(jsonStr);
        yield event;
      } catch (e) {
        // Skip invalid JSON
      }
    }
  } catch (error) {
    yield {
      error:
        error instanceof Error
          ? error.message
          : "Failed to stream response",
    };
  }
}
