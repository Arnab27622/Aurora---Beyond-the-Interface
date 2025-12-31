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

        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");

        if (!query || query.trim().length === 0) {
            return NextResponse.json({ results: [] });
        }

        await dbConnect();

        // MongoDB aggregation pipeline to search within messages
        const results = await ChatSessionModel.aggregate([
            {
                $match: { userId: session.user.id }
            },
            {
                $unwind: "$messages"
            },
            {
                $match: {
                    "messages.content": {
                        $regex: query.trim(),
                        $options: "i" // case-insensitive
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    sessionId: "$id",
                    sessionTitle: "$title",
                    messageId: "$messages.id",
                    messageContent: "$messages.content",
                    messageRole: "$messages.role",
                    timestamp: "$timestamp"
                }
            },
            {
                $sort: { timestamp: -1 }
            }
        ]);

        return NextResponse.json({ results });
    } catch (error) {
        console.error("Error searching messages:", error);
        return NextResponse.json(
            { error: "Failed to search messages" },
            { status: 500 }
        );
    }
}
