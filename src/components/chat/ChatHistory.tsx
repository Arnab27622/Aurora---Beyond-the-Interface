import { Button } from "@/components/ui/button";
import { Plus, Trash2, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatSession } from "@/lib/types";

interface ChatHistoryProps {
    chatSessions: ChatSession[];
    currentSessionId: string | null;
    darkMode: boolean;
    showHistory: boolean;
    setShowHistory: (show: boolean) => void;
    newChat: () => void;
    loadChat: (sessionId: string) => void;
    deleteSession: (sessionId: string, e: React.MouseEvent) => void;
}

export const ChatHistory = ({
    chatSessions,
    currentSessionId,
    darkMode,
    showHistory,
    setShowHistory,
    newChat,
    loadChat,
    deleteSession,
}: ChatHistoryProps) => (
    <div
        className={cn(
            "absolute md:relative z-10 h-full w-64 flex flex-col border-r transition-transform duration-300",
            darkMode ? "bg-[#252526] border-gray-700" : "bg-gray-100 border-gray-200",
            showHistory ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-12",
            !showHistory && "md:border-r-0"
        )}
    >
        {!showHistory ? (
            <div className="hidden md:flex flex-col items-center pt-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowHistory(true)}
                    className={cn(
                        "mb-4",
                        darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                    )}
                >
                    <Menu className="h-5 w-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={newChat}
                    className={cn(darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200")}
                >
                    <Plus className="h-5 w-5" />
                </Button>
            </div>
        ) : (
            <div className="flex-1 flex flex-col">
                <div
                    className={cn(
                        "p-4 flex justify-between items-center border-b",
                        darkMode ? "border-gray-700" : "border-gray-200"
                    )}
                >
                    <div className="flex items-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowHistory(false)}
                            className={cn(
                                "mr-2",
                                darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                            )}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <h2 className="font-semibold">Chat History</h2>
                    </div>
                    <Button
                        onClick={newChat}
                        size="sm"
                        className={cn(
                            darkMode
                                ? "bg-blue-600 hover:bg-blue-700"
                                : "bg-blue-500 hover:bg-blue-600"
                        )}
                    >
                        <Plus className="h-4 w-4 mr-1" /> New
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {chatSessions.length === 0 ? (
                        <div
                            className={cn(
                                "text-center p-4",
                                darkMode ? "text-gray-400" : "text-gray-500"
                            )}
                        >
                            No chat history
                        </div>
                    ) : (
                        chatSessions.map((session) => (
                            <div
                                key={session.id}
                                onClick={() => loadChat(session.id)}
                                className={cn(
                                    "p-3 rounded-lg mb-2 cursor-pointer flex justify-between items-start group",
                                    darkMode
                                        ? currentSessionId === session.id
                                            ? "bg-gray-700"
                                            : "hover:bg-gray-700"
                                        : currentSessionId === session.id
                                            ? "bg-gray-300"
                                            : "hover:bg-gray-200"
                                )}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{session.title}</div>
                                    <div className="text-xs truncate">
                                        {new Date(session.timestamp).toLocaleString()}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => deleteSession(session.id, e)}
                                    className={cn(
                                        "opacity-0 group-hover:opacity-100 transition-opacity",
                                        darkMode ? "hover:bg-gray-600" : "hover:bg-gray-300"
                                    )}
                                >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}
    </div>
);