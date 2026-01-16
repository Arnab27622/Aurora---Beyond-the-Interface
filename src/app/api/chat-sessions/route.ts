/**
 * Chat Sessions API
 * 
 * Manages user's chat session CRUD operations.
 * Stores conversation history with timestamps and metadata.
 * 
 * Features:
 * - Session creation, retrieval, update, and deletion
 * - Timeout protection for database operations
 * - CSRF protection for state-modifying requests
 * - Data sanitization and HTML escaping
 * - User isolation (only accessing own sessions)
 * - Sorted by most recent first
 * 
 * Authentication: Required for all endpoints
 * 
 * Endpoints:
 * - GET: Fetch all sessions for user
 * - POST: Create new chat session
 * - PUT: Update session messages
 * - DELETE: Delete a session by ID
 * 
 * Database timeout: 30 seconds per operation
 * 
 * Response format:
 * {
 *   sessions: [
 *     {
 *       id: string (UUID),
 *       title: string (HTML escaped),
 *       timestamp: number,
 *       messages: [
 *         { role: string, content: string (HTML escaped) }
 *       ]
 *     }
 *   ]
 * }
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import ChatSessionModel from "@/lib/models/ChatSession";
import { sanitizeInput, escapeHtml } from "@/lib/sanitize";
import { validateCSRFToken } from "@/lib/csrf";

// Timeout for database operations (30 seconds)
const DB_TIMEOUT_MS = 30000;

/**
 * Wrapper function to add timeout to async operations
 * Prevents long-running queries from blocking requests indefinitely
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;
  
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error('Database operation timeout')),
      timeoutMs
    );
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const sessions = await withTimeout(
      ChatSessionModel.find({ userId: session.user.id })
        .sort({ timestamp: -1 })
        .lean(),
      DB_TIMEOUT_MS
    );

    const formattedSessions = sessions.map(session => ({
      id: session.id,
      title: escapeHtml(session.title),
      timestamp: session.timestamp,
      messages: session.messages.map((msg: any) => ({
        ...msg,
        content: escapeHtml(msg.content),
      })),
    }));

    return NextResponse.json({ sessions: formattedSessions });
  } catch (error) {
    if (error instanceof Error && error.message === 'Database operation timeout') {
      console.warn("Chat sessions fetch timeout");
      return NextResponse.json(
        { error: "Request timeout - database query took too long" },
        { status: 504 }
      );
    }
    console.error("Error fetching chat sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat sessions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate CSRF token for state-modifying request
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken) {
      return NextResponse.json(
        { error: "CSRF token missing" },
        { status: 403 }
      );
    }

    if (!validateCSRFToken(csrfToken)) {
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 }
      );
    }

    const body = await request.json();
    let { title, messages } = body;

    if (!title || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Sanitize title and messages before storage
    title = sanitizeInput(title);
    messages = messages.map((msg: any) => ({
      ...msg,
      content: sanitizeInput(msg.content),
    }));

    await dbConnect();

    const newSession = await withTimeout(
      ChatSessionModel.create({
        userId: session.user.id,
        id: crypto.randomUUID(),
        title,
        messages,
        timestamp: Date.now(),
      }),
      DB_TIMEOUT_MS
    );

    return NextResponse.json({
      session: {
        id: newSession.id,
        title: escapeHtml(newSession.title),
        timestamp: newSession.timestamp,
        messages: newSession.messages.map((msg: any) => ({
          ...msg,
          content: escapeHtml(msg.content),
        })),
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Database operation timeout') {
      console.warn("Chat session creation timeout");
      return NextResponse.json(
        { error: "Request timeout - database operation took too long" },
        { status: 504 }
      );
    }
    console.error("Error creating chat session:", error);
    return NextResponse.json(
      { error: "Failed to create chat session" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate CSRF token for state-modifying request
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken) {
      return NextResponse.json(
        { error: "CSRF token missing" },
        { status: 403 }
      );
    }

    if (!validateCSRFToken(csrfToken)) {
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 }
      );
    }

    const body = await request.json();
    let { sessionId, messages } = body;

    if (!sessionId || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Sanitize messages before storage
    messages = messages.map((msg: any) => ({
      ...msg,
      content: sanitizeInput(msg.content),
    }));

    await dbConnect();

    const updatedSession = await withTimeout(
      ChatSessionModel.findOneAndUpdate(
        { userId: session.user.id, id: sessionId },
        { messages, timestamp: Date.now() },
        { new: true }
      ),
      DB_TIMEOUT_MS
    );

    if (!updatedSession) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      session: {
        id: updatedSession.id,
        title: escapeHtml(updatedSession.title),
        timestamp: updatedSession.timestamp,
        messages: updatedSession.messages.map((msg: any) => ({
          ...msg,
          content: escapeHtml(msg.content),
        })),
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Database operation timeout') {
      console.warn("Chat session update timeout");
      return NextResponse.json(
        { error: "Request timeout - database operation took too long" },
        { status: 504 }
      );
    }
    console.error("Error updating chat session:", error);
    return NextResponse.json(
      { error: "Failed to update chat session" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate CSRF token for state-modifying request
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken) {
      return NextResponse.json(
        { error: "CSRF token missing" },
        { status: 403 }
      );
    }

    if (!validateCSRFToken(csrfToken)) {
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const deletedSession = await withTimeout(
      ChatSessionModel.findOneAndDelete({
        userId: session.user.id,
        id: sessionId,
      }),
      DB_TIMEOUT_MS
    );

    if (!deletedSession) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Database operation timeout') {
      console.warn("Chat session deletion timeout");
      return NextResponse.json(
        { error: "Request timeout - database operation took too long" },
        { status: 504 }
      );
    }
    console.error("Error deleting chat session:", error);
    return NextResponse.json(
      { error: "Failed to delete chat session" },
      { status: 500 }
    );
  }
}
