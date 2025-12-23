import { NextRequest, NextResponse } from "next/server";

// Constants for validation
const MAX_INPUT_LENGTH = 10000;
const MAX_FILENAME_LENGTH = 255;
const MAX_FILE_DATA_LENGTH = 50000;
const MAX_MESSAGES = 100;
const MAX_MESSAGE_LENGTH = 10000;
const REQUEST_TIMEOUT_MS = 30000;
const VALID_FILE_TYPES = ["pdf", "image"];
const VALID_ROLES = ["user", "bot", "model"];

interface ChatRequest {
  input: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  fileContext: {
    type: "pdf" | "image" | null;
    data: string;
    filename: string;
  } | null;
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
    const { input, messages, fileContext } = typedBody;

    // Validate environment variables
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

    // Call Gemini API with timeout
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
              maxOutputTokens: 2048,
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
