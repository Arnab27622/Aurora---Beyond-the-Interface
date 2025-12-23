import { NextRequest, NextResponse } from "next/server";

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

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { input, messages, fileContext } = body;

    const API_KEY = process.env.GEMINI_API_KEY;
    const MODEL_ID = process.env.GEMINI_MODEL_ID;

    if (!API_KEY || !MODEL_ID) {
      return NextResponse.json(
        {
          error: "API key or model ID not configured",
          message:
            "Please set GEMINI_API_KEY and GEMINI_MODEL_ID in environment variables",
        },
        { status: 500 }
      );
    }

    // Prepare API content with file context if available
    let apiContent = "";
    let filePart = null;

    if (fileContext) {
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
          input.trim() || `Please analyze this image: ${fileContext.filename}`;
      }
    } else {
      apiContent = input.trim();
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

    const response = await fetch(
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
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        {
          error: `API error: ${response.status}`,
          message: errorData.error?.message || response.statusText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const botText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't process that request.";

    return NextResponse.json({
      content: botText,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}
