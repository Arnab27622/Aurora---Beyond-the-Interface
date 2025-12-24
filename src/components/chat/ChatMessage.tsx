import ReactMarkdown, { Components } from "react-markdown";
import { cn } from "@/lib/utils";
import { Message } from "@/lib/types";
import { Zap, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatMessageProps {
    message: Message;
    darkMode: boolean;
    markdownComponents: Components;
    onRegenerate?: (messageId: number) => void;
    isRegenerating?: boolean;
    onNavigateResponse?: (messageId: number, direction: 'prev' | 'next') => void;
}

export const ChatMessage = ({
    message,
    darkMode,
    markdownComponents,
    onRegenerate,
    isRegenerating,
    onNavigateResponse
}: ChatMessageProps) => {
    // Don't render the message if it's being regenerated (to avoid showing empty block)
    if (isRegenerating) {
        return null;
    }

    return (
        <div
            key={message.id}
            className={cn(
                "whitespace-pre-wrap py-3 px-4 mb-4 rounded-md w-fit break-words max-w-[90%]",
                "text-base relative",
                message.role === "user"
                    ? darkMode
                        ? "bg-[#343541] text-white self-end ml-auto"
                        : "bg-[#e0e0e0] text-black self-end ml-auto"
                    : darkMode
                        ? "bg-[#2a2a2a] text-white self-start mr-auto"
                        : "bg-[#f0f0f0] text-black self-start mr-auto"
            )}
        >
            <ReactMarkdown components={markdownComponents}>
                {message.content}
            </ReactMarkdown>
            {message.isCached && message.role === "bot" && (
                <div
                    className={cn(
                        "text-xs mt-2 flex items-center gap-1",
                        darkMode ? "text-gray-400" : "text-gray-600"
                    )}
                    title="This response was retrieved from cache"
                >
                    <Zap className="h-3 w-3" />
                    Cached response
                </div>
            )}
            {message.role === "bot" && (
                <div className="mt-2 flex flex-col gap-2">
                    {/* Response Navigation */}
                    {message.responses && message.responses.length > 1 && (
                        <div className="flex items-center justify-between gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onNavigateResponse?.(message.id, 'prev')}
                                disabled={message.currentResponseIndex === 0}
                                className={cn(
                                    "text-xs h-6 px-1 cursor-pointer",
                                    darkMode ? "text-gray-400 hover:text-black" : "text-gray-600 hover:text-gray-800"
                                )}
                                title="Previous response"
                            >
                                <ChevronLeft className="h-3 w-3" />
                            </Button>

                            <span className={cn(
                                "text-xs",
                                darkMode ? "text-gray-400" : "text-gray-600"
                            )}>
                                {message.currentResponseIndex !== undefined ? message.currentResponseIndex + 1 : 1} / {message.responses.length}
                            </span>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onNavigateResponse?.(message.id, 'next')}
                                disabled={message.currentResponseIndex === (message.responses.length - 1)}
                                className={cn(
                                    "text-xs h-6 px-1 cursor-pointer",
                                    darkMode ? "text-gray-400 hover:text-black" : "text-gray-600 hover:text-gray-800"
                                )}
                                title="Next response"
                            >
                                <ChevronRight className="h-3 w-3" />
                            </Button>
                        </div>
                    )}

                    {/* Regenerate Button */}
                    {onRegenerate && (
                        <div className="flex justify-start">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRegenerate(message.id)}
                                disabled={isRegenerating}
                                className={cn(
                                    "text-xs h-6 px-2 cursor-pointer",
                                    darkMode ? "text-gray-400 hover:text-black" : "text-gray-600 hover:text-gray-800"
                                )}
                                title="Regenerate response"
                            >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Regenerate
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
