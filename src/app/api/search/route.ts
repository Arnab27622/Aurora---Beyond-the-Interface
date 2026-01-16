/**
 * Message Search API
 * 
 * Searches through user's chat session messages using MongoDB text search.
 * 
 * Features:
 * - Case-insensitive regex search within message content
 * - ReDoS (Regular Expression Denial of Service) protection
 * - Regex injection prevention via character escaping
 * - Result limiting to prevent excessive data transfer
 * - MongoDB aggregation pipeline for efficient querying
 * 
 * Authentication: Required (NextAuth session)
 * Method: GET
 * 
 * Query parameters:
 * - q: Search query string (max 200 characters)
 * 
 * Response:
 * {
 *   results: [
 *     {
 *       sessionId: string,
 *       sessionTitle: string,
 *       messageId: string,
 *       messageContent: string,
 *       messageRole: "user" | "bot",
 *       timestamp: number
 *     }
 *   ]
 * }
 * 
 * Limits:
 * - Max 100 results per search
 * - Max 200 character query length
 * - 30 second database timeout
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import ChatSessionModel from "@/lib/models/ChatSession";

/**
 * Escape special characters in regex to prevent ReDoS and regex injection
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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

        // Limit query length to prevent ReDoS attacks
        if (query.length > 200) {
            return NextResponse.json(
                { error: "Search query too long" },
                { status: 400 }
            );
        }

        await dbConnect();

        // Escape regex special characters to prevent injection
        const escapedQuery = escapeRegex(query.trim());

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
                        $regex: escapedQuery,
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
            },
            {
                $limit: 100  // Limit results to prevent excessive data transfer
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
