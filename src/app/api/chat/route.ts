import { NextRequest, NextResponse } from "next/server";
import { safeValidateEnvironment } from "@/lib/validateEnvironment";
import {
  sanitizeInput,
  sanitizeFilename,
  sanitizeBase64,
  detectSuspiciousPatterns,
} from "@/lib/sanitize";

// Constants for validation
const MAX_INPUT_LENGTH = 10000;
const MAX_FILENAME_LENGTH = 255;
const MAX_FILE_DATA_LENGTH = 5000000; // Increased from 50000 to support larger images (base64 ~1.33x file size)
const MAX_MESSAGES = 100;
const MAX_MESSAGE_LENGTH = 10000;
const REQUEST_TIMEOUT_MS = 30000;
const VALID_FILE_TYPES = ["pdf", "image", "txt", "docx", "xlsx", "csv", "pptx"];
const VALID_ROLES = ["user", "bot", "model"];

interface ChatRequest {
  input: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  fileContext: {
    type: "pdf" | "image" | "txt" | "docx" | "xlsx" | "csv" | "pptx" | null;
    data: string;
    filename: string;
  } | null;
  skipCache?: boolean;
}

interface ApiErrorResponse {
  error: string;
  message: string;
  code?: string;
}

// Validation helper functions
function validateInput(input: string): { valid: boolean; error?: string } {
  if (!input) {
    return { valid: false, error: "Input cannot be empty" };
  }
  if (typeof input !== "string") {
    return { valid: false, error: "Input must be a string" };
  }
  if (input.length > MAX_INPUT_LENGTH) {
    return {
      valid: false,
      error: `Input exceeds maximum length of ${MAX_INPUT_LENGTH} characters`,
    };
  }
  if (input.trim().length === 0) {
    return { valid: false, error: "Input cannot be only whitespace" };
  }

  // Check for suspicious patterns
  const suspiciousCheck = detectSuspiciousPatterns(input);
  if (suspiciousCheck.isSuspicious) {
    return {
      valid: false,
      error: `Invalid input: ${suspiciousCheck.reason}`,
    };
  }

  return { valid: true };
}

function validateMessages(messages: unknown): {
  valid: boolean;
  error?: string;
} {
  if (!Array.isArray(messages)) {
    return { valid: false, error: "Messages must be an array" };
  }
  if (messages.length > MAX_MESSAGES) {
    return {
      valid: false,
      error: `Messages array exceeds maximum of ${MAX_MESSAGES} items`,
    };
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || typeof msg !== "object") {
      return { valid: false, error: `Message at index ${i} is invalid` };
    }

    const typedMsg = msg as Record<string, unknown>;

    if (!typedMsg.role || typeof typedMsg.role !== "string") {
      return {
        valid: false,
        error: `Message at index ${i} has invalid role`,
      };
    }

    if (!VALID_ROLES.includes(typedMsg.role)) {
      return {
        valid: false,
        error: `Message at index ${i} has invalid role: ${typedMsg.role}`,
      };
    }

    if (!typedMsg.content || typeof typedMsg.content !== "string") {
      return {
        valid: false,
        error: `Message at index ${i} has invalid content`,
      };
    }

    if ((typedMsg.content as string).length > MAX_MESSAGE_LENGTH) {
      return {
        valid: false,
        error: `Message at index ${i} exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`,
      };
    }

    // Check for suspicious patterns in message content
    const suspiciousCheck = detectSuspiciousPatterns(
      typedMsg.content as string
    );
    if (suspiciousCheck.isSuspicious) {
      return {
        valid: false,
        error: `Message at index ${i} contains invalid patterns: ${suspiciousCheck.reason}`,
      };
    }
  }

  return { valid: true };
}

function validateFileContext(fileContext: unknown): {
  valid: boolean;
  error?: string;
} {
  if (fileContext === null || fileContext === undefined) {
    return { valid: true };
  }

  if (typeof fileContext !== "object") {
    return { valid: false, error: "File context must be an object or null" };
  }

  const ctx = fileContext as Record<string, unknown>;

  if (ctx.type !== null && ctx.type !== undefined) {
    if (typeof ctx.type !== "string") {
      return { valid: false, error: "File type must be a string or null" };
    }
    if (!VALID_FILE_TYPES.includes(ctx.type)) {
      return {
        valid: false,
        error: `Invalid file type: ${ctx.type}. Must be one of: ${VALID_FILE_TYPES.join(", ")}`,
      };
    }
  }

  if (ctx.data !== null && ctx.data !== undefined) {
    if (typeof ctx.data !== "string") {
      return { valid: false, error: "File data must be a string or null" };
    }
    if ((ctx.data as string).length > MAX_FILE_DATA_LENGTH) {
      return {
        valid: false,
        error: `File data exceeds maximum length of ${MAX_FILE_DATA_LENGTH} characters`,
      };
    }
    if ((ctx.data as string).length === 0) {
      return { valid: false, error: "File data cannot be empty" };
    }

    // Only validate base64 format for images
    if (ctx.type === "image") {
      try {
        sanitizeBase64(ctx.data as string);
      } catch (error) {
        return {
          valid: false,
          error: `Invalid file data format: ${error instanceof Error ? error.message : "Invalid base64"}`,
        };
      }
    }
  }

  if (ctx.filename !== null && ctx.filename !== undefined) {
    if (typeof ctx.filename !== "string") {
      return { valid: false, error: "Filename must be a string or null" };
    }
    if ((ctx.filename as string).length > MAX_FILENAME_LENGTH) {
      return {
        valid: false,
        error: `Filename exceeds maximum length of ${MAX_FILENAME_LENGTH} characters`,
      };
    }
  }

  return { valid: true };
}

function validateRequestBody(body: unknown): {
  valid: boolean;
  error?: string;
} {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a JSON object" };
  }

  const typedBody = body as Record<string, unknown>;

  // Validate input
  const inputValidation = validateInput(typedBody.input as string);
  if (!inputValidation.valid) {
    return inputValidation;
  }

  // Validate messages
  const messagesValidation = validateMessages(typedBody.messages);
  if (!messagesValidation.valid) {
    return messagesValidation;
  }

  // Validate file context
  const fileContextValidation = validateFileContext(typedBody.fileContext);
  if (!fileContextValidation.valid) {
    return fileContextValidation;
  }

  return { valid: true };
}

function createErrorResponse(
  message: string,
  code: string = "UNKNOWN_ERROR",
  statusCode: number = 400
): [ApiErrorResponse, number] {
  return [
    {
      error: code,
      message,
    },
    statusCode,
  ];
}

export async function POST(request: NextRequest) {
  // Validate request method
  if (request.method !== "POST") {
    const [error, status] = createErrorResponse(
      "Method not allowed",
      "METHOD_NOT_ALLOWED",
      405
    );
    return NextResponse.json(error, { status });
  }

  // Validate Content-Type
  const contentType = request.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    const [error, status] = createErrorResponse(
      "Content-Type must be application/json",
      "INVALID_CONTENT_TYPE",
      400
    );
    return NextResponse.json(error, { status });
  }

  // Check if streaming is requested
  const url = new URL(request.url);
  const isStreaming = url.searchParams.get("stream") === "true";

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      const [error, status] = createErrorResponse(
        "Invalid JSON in request body",
        "INVALID_JSON",
        400
      );
      return NextResponse.json(error, { status });
    }

    // Validate request body structure and content
    const validation = validateRequestBody(body);
    if (!validation.valid) {
      const [error, status] = createErrorResponse(
        validation.error || "Invalid request body",
        "VALIDATION_ERROR",
        400
      );
      return NextResponse.json(error, { status });
    }

    const typedBody = body as ChatRequest;
    let { input, messages, fileContext, skipCache } = typedBody;

    // Sanitize user input
    input = sanitizeInput(input);

    // Sanitize message contents
    messages = messages.map((msg) => ({
      role: msg.role,
      content: sanitizeInput(msg.content),
    }));

    // Sanitize file context if present
    if (fileContext) {
      if (fileContext.filename) {
        fileContext.filename = sanitizeFilename(fileContext.filename);
      }
      if (fileContext.data && fileContext.type === "image") {
        try {
          fileContext.data = sanitizeBase64(fileContext.data);
        } catch (error) {
          console.error("Failed to sanitize image data:", error);
          const [err, status] = createErrorResponse(
            "Invalid image data format",
            "INVALID_IMAGE_DATA",
            400
          );
          return NextResponse.json(err, { status });
        }
      }
    }

    // Quick environment check (startup validation already done)
    const API_KEY = process.env.GEMINI_API_KEY;
    const MODEL_ID = process.env.GEMINI_MODEL_ID;

    if (!API_KEY || !API_KEY.trim()) {
      console.error("GEMINI_API_KEY is not configured");
      const [error, status] = createErrorResponse(
        "Server configuration error: API key not found",
        "CONFIG_ERROR",
        500
      );
      return NextResponse.json(error, { status });
    }

    if (!MODEL_ID || !MODEL_ID.trim()) {
      console.error("GEMINI_MODEL_ID is not configured");
      const [error, status] = createErrorResponse(
        "Server configuration error: Model ID not found",
        "CONFIG_ERROR",
        500
      );
      return NextResponse.json(error, { status });
    }

    // Prepare API content with file context if available
    let apiContent = "";
    let filePart: { inline_data: { mime_type: string; data: string } } | null =
      null;

    if (fileContext && fileContext.type) {
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
      } else if (["txt", "docx", "xlsx", "csv", "pptx"].includes(fileContext.type)) {
        const fileTypeLabels = {
          txt: "Text File",
          docx: "Word Document",
          xlsx: "Excel Spreadsheet",
          csv: "CSV File",
          pptx: "PowerPoint Presentation"
        };
        const label = fileTypeLabels[fileContext.type as keyof typeof fileTypeLabels] || "Document";
        apiContent = `[${label}: ${fileContext.filename}]\n${fileContext.data}\n\n[Question]: ${input.trim()}`;
      }
    } else {
      apiContent = input.trim();
    }

    // Validate prepared content
    if (!apiContent || apiContent.trim().length === 0) {
      const [error, status] = createErrorResponse(
        "Cannot prepare API content from input",
        "CONTENT_PREPARATION_ERROR",
        400
      );
      return NextResponse.json(error, { status });
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

    // If streaming is requested, return SSE response
    if (isStreaming) {
      const encoder = new TextEncoder();
      let fullResponse = "";

      interface StreamChunk {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      }

      async function* streamFromGemini(): AsyncGenerator<string> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS + 30000);

        try {
          const resp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:streamGenerateContent?alt=sse&key=${API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents,
                generationConfig: { temperature: 0.7, maxOutputTokens: 6000 },
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

      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Check cache first (skip if skipCache is true)
            if (!skipCache) {
              const { responseCache } = await import("@/lib/cache");
              const cached = responseCache.get(input, fileContext);
              if (cached) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ text: cached, cached: true })}\n\n`
                  )
                );
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
                controller.close();
                return;
              }
            }

            for await (const chunk of streamFromGemini()) {
              fullResponse += chunk;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`)
              );
            }

            // Cache the response
            const { responseCache: cache2 } = await import("@/lib/cache");
            cache2.set(input, fullResponse, fileContext);

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

      return new NextResponse(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Call Gemini API with timeout (non-streaming path)
    let response: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS
      );

      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 6000,
            },
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
    } catch (fetchError) {
      if (fetchError instanceof Error) {
        if (fetchError.name === "AbortError") {
          console.error("Gemini API request timeout");
          const [error, status] = createErrorResponse(
            "Request timeout: Gemini API took too long to respond",
            "REQUEST_TIMEOUT",
            504
          );
          return NextResponse.json(error, { status });
        }
        console.error("Network error calling Gemini API:", fetchError.message);
        const [error, status] = createErrorResponse(
          "Network error: Failed to connect to Gemini API",
          "NETWORK_ERROR",
          503
        );
        return NextResponse.json(error, { status });
      }
      throw fetchError;
    }

    // Handle API errors
    if (!response.ok) {
      let errorData: Record<string, unknown> = {};
      try {
        errorData = await response.json();
      } catch {
        // Response is not JSON
      }

      const apiErrorMessage =
        (errorData.error as Record<string, unknown>)?.message ||
        errorData.message ||
        response.statusText ||
        "Unknown error";

      const errorMessage =
        response.status === 429
          ? "Too many requests to Gemini API. Please try again later."
          : response.status === 401 || response.status === 403
            ? "Unauthorized: Invalid or expired API credentials"
            : response.status === 400
              ? `Bad request to Gemini API: ${apiErrorMessage}`
              : `Gemini API error (${response.status}): ${apiErrorMessage}`;

      const errorCode =
        response.status === 429
          ? "RATE_LIMITED"
          : response.status === 401 || response.status === 403
            ? "AUTH_ERROR"
            : response.status === 400
              ? "BAD_REQUEST"
              : "API_ERROR";

      console.error(
        `Gemini API error [${response.status}]:`,
        apiErrorMessage
      );

      const [error, status] = createErrorResponse(
        errorMessage,
        errorCode,
        Math.min(response.status, 500)
      );
      return NextResponse.json(error, { status });
    }

    // Parse and validate response
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      console.error("Failed to parse Gemini API response");
      const [error, status] = createErrorResponse(
        "Invalid response from Gemini API",
        "INVALID_RESPONSE",
        502
      );
      return NextResponse.json(error, { status });
    }

    // Extract bot response with validation
    let botText = "Sorry, I couldn't process that request.";
    if (
      data &&
      typeof data === "object" &&
      "candidates" in data &&
      Array.isArray((data as Record<string, unknown>).candidates)
    ) {
      const candidates = (data as Record<string, unknown>)
        .candidates as unknown[];
      if (candidates.length > 0 && candidates[0]) {
        const candidate = candidates[0] as Record<string, unknown>;
        const content = candidate.content as Record<string, unknown>;
        const parts = content?.parts as unknown[];
        if (Array.isArray(parts) && parts.length > 0) {
          const firstPart = parts[0] as Record<string, unknown>;
          if (firstPart.text && typeof firstPart.text === "string") {
            botText = firstPart.text;
          }
        }
      }
    }

    if (!botText || botText.trim().length === 0) {
      console.warn("Empty response from Gemini API");
      botText = "Sorry, I received an empty response. Please try again.";
    }

    return NextResponse.json(
      {
        content: botText,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error in chat API:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    const [apiError] = createErrorResponse(
      `Internal server error: ${errorMessage}`,
      "INTERNAL_ERROR",
      500
    );

    return NextResponse.json(apiError, { status: 500 });
  }
}
