import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import ChatSessionModel from "@/lib/models/ChatSession";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const sessions = await ChatSessionModel.find({ userId: session.user.id })
      .sort({ timestamp: -1 })
      .lean();

    const formattedSessions = sessions.map(session => ({
      id: session.id,
      title: session.title,
      timestamp: session.timestamp,
      messages: session.messages,
    }));

    return NextResponse.json({ sessions: formattedSessions });
  } catch (error) {
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

    const body = await request.json();
    const { title, messages } = body;

    if (!title || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    await dbConnect();

    const newSession = await ChatSessionModel.create({
      userId: session.user.id,
      id: crypto.randomUUID(),
      title,
      messages,
      timestamp: Date.now(),
    });

    return NextResponse.json({
      session: {
        id: newSession.id,
        title: newSession.title,
        timestamp: newSession.timestamp,
        messages: newSession.messages,
      }
    });
  } catch (error) {
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

    const body = await request.json();
    const { sessionId, messages } = body;

    if (!sessionId || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    await dbConnect();

    const updatedSession = await ChatSessionModel.findOneAndUpdate(
      { userId: session.user.id, id: sessionId },
      { messages, timestamp: Date.now() },
      { new: true }
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
        title: updatedSession.title,
        timestamp: updatedSession.timestamp,
        messages: updatedSession.messages,
      }
    });
  } catch (error) {
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

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const deletedSession = await ChatSessionModel.findOneAndDelete({
      userId: session.user.id,
      id: sessionId,
    });

    if (!deletedSession) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting chat session:", error);
    return NextResponse.json(
      { error: "Failed to delete chat session" },
      { status: 500 }
    );
  }
}
