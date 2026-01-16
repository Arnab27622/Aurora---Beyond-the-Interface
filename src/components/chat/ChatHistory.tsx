/**
 * ChatHistory Component
 * 
 * Sidebar component that displays:
 * - List of previous chat sessions
 * - Search functionality to find specific messages
 * - Quick action buttons (New Chat, Settings)
 * - User settings and logout options
 * - Collapsible on mobile with smooth animations
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Menu, Settings, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatSession, SearchResult } from "@/lib/types";
import { signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

interface ChatHistoryProps {
    chatSessions: ChatSession[];
    currentSessionId: string | null;
    darkMode: boolean;
    showHistory: boolean;
    setShowHistory: (show: boolean) => void;
    newChat: () => void;
    loadChat: (sessionId: string) => void;
    deleteSession: (sessionId: string, e: React.MouseEvent) => void;
    userName?: string | null;
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
    userName,
}: ChatHistoryProps) => {
    const [showSettings, setShowSettings] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [focusSearch, setFocusSearch] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const setSearchInputRef = (element: HTMLInputElement | null) => {
        searchInputRef.current = element;
        if (element && showHistory && focusSearch) {
            // Wait for the sidebar transition to complete before focusing
            setTimeout(() => {
                element.focus();
                setFocusSearch(false);
            }, 350); // Slightly longer than the 300ms transition
        }
    };

    useEffect(() => {
        if (showHistory && focusSearch && searchInputRef.current) {
            // Wait for the sidebar transition to complete before focusing
            const timer = setTimeout(() => {
                searchInputRef.current?.focus();
                setFocusSearch(false);
            }, 350); // Slightly longer than the 300ms transition

            return () => clearTimeout(timer);
        }
    }, [showHistory, focusSearch]);

    const handleLogout = () => {
        signOut({
            callbackUrl: '/auth/signin',
            redirect: true,
        });
    };

    const handleSearch = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        setSearchError(null);

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Search failed');
            const data = await response.json();
            setSearchResults(data.results || []);
        } catch (error) {
            setSearchError('Failed to search messages');
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <>
            <div
                className={cn(
                    "absolute md:relative z-10 h-full w-64 flex flex-col border-r transition-all duration-300 ease-in-out",
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
                                "mb-4 cursor-pointer",
                                darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                            )}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={newChat}
                            className={cn(
                                "mb-4 cursor-pointer",
                                darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200")}
                        >
                            <Plus className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setShowHistory(true);
                                setFocusSearch(true);
                            }}
                            className={cn(
                                "mb-4 cursor-pointer",
                                darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200")}
                        >
                            <Search className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowSettings(true)}
                            className={cn(
                                "cursor-pointer",
                                darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200")}
                        >
                            <Settings className="h-5 w-5" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col h-full">
                        <div
                            className={cn(
                                "p-4 border-b hidden md:block",
                                darkMode ? "border-gray-700" : "border-gray-200"
                            )}
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowHistory(false)}
                                className={cn(
                                    "cursor-pointer",
                                    darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                                )}
                            >
                                <Menu className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="p-2">
                            <Button
                                onClick={newChat}
                                variant="ghost"
                                className={cn(
                                    "w-full flex items-center justify-start p-3 mb-2 cursor-pointer",
                                    darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                                )}
                            >
                                <Plus className="h-5 w-5 mr-3" />
                                <span
                                    className={cn(
                                        "transition-opacity duration-300",
                                        showHistory ? "opacity-100" : "opacity-0"
                                    )}
                                >
                                    New Chat
                                </span>
                            </Button>
                            < Button
                                onClick={() => setShowSettings(true)}
                                variant="ghost"
                                className={cn(
                                    "w-full flex items-center justify-start p-3 mb-2 cursor-pointer",
                                    darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                                )}
                            >
                                <Settings className="h-5 w-5 mr-3" />
                                <span
                                    className={cn(
                                        "transition-opacity duration-300",
                                        showHistory ? "opacity-100" : "opacity-0"
                                    )}
                                >
                                    Settings
                                </span>
                            </ Button>
                        </div>

                        <div className="p-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    ref={setSearchInputRef}
                                    type="text"
                                    placeholder="Search chats"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        handleSearch(e.target.value);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSearch(searchQuery);
                                        }
                                    }}
                                    className={cn(
                                        "pl-10 pr-10",
                                        darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                                    )}
                                />
                                {searchQuery && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            setSearchQuery("");
                                            setSearchResults([]);
                                        }}
                                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 cursor-pointer"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                            <div className="p-2">
                                {searchQuery ? (
                                    <div>
                                        <h3 className={cn("text-sm font-semibold mb-2", darkMode ? "text-gray-300" : "text-gray-700")}>
                                            Search Results {isSearching && "(Searching...)"}
                                        </h3>
                                        {searchError ? (
                                            <div className={cn("text-center p-4 text-red-500", darkMode ? "text-red-400" : "")}>
                                                {searchError}
                                            </div>
                                        ) : searchResults.length === 0 && !isSearching ? (
                                            <div className={cn("text-center p-4", darkMode ? "text-gray-400" : "text-gray-500")}>
                                                No messages found
                                            </div>
                                        ) : (
                                            searchResults.map((result, index) => (
                                                <div
                                                    key={`${result.sessionId}-${result.messageId}-${index}`}
                                                    onClick={(e) => { e.preventDefault(); loadChat(result.sessionId); }}
                                                    className={cn(
                                                        "p-3 rounded-lg mb-2 cursor-pointer",
                                                        darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                                                    )}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium truncate text-sm">{result.sessionTitle}</div>
                                                        <div className="text-xs text-gray-500 truncate">
                                                            {result.messageRole === 'user' ? 'You' : 'Bot'}: {result.messageContent.substring(0, 100)}...
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            {new Date(result.timestamp).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <h3 className={cn("text-sm font-semibold", darkMode ? "text-gray-300" : "text-gray-700")}>Your Chats</h3>
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
                                                    onClick={(e) => { e.preventDefault(); loadChat(session.id); }}
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
                                                            "opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer",
                                                            darkMode ? "hover:bg-gray-600" : "hover:bg-gray-300"
                                                        )}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            ))
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Settings Popup */}
            {showSettings && (
                <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
                    <div
                        className={cn(
                            "p-6 rounded-lg shadow-lg max-w-sm w-full mx-4",
                            darkMode ? "bg-[#252526] text-white" : "bg-white text-black"
                        )}
                    >
                        <h3 className="text-lg font-semibold mb-4">Settings</h3>
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">User:</p>
                            <p className="font-medium">{userName || 'User'}</p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => setShowSettings(false)}
                                variant="outline"
                                className={cn(
                                    "flex-1 cursor-pointer",
                                    darkMode ? "border-[#434343] bg-[#434343] text-white hover:bg-white" : ""
                                )}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleLogout}
                                variant="destructive"
                                className="flex-1 cursor-pointer"
                            >
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
