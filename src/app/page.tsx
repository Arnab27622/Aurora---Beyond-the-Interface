"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatHistory } from "@/components/chat/ChatHistory";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { FileContextIndicator } from "@/components/chat/FileContextIndicator";
import { SuggestedPrompts } from "@/components/chat/SuggestedPrompts";
import { markdownComponents } from "@/components/chat/markdown-components";
import { Message, FileContextType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useGemini } from "@/lib/useGemini";
import { useChatSessions } from "@/lib/useChatSessions";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { ComponentErrorBoundary } from "@/components/errors/ComponentErrorBoundary";
import { logError } from "@/lib/errorHandler";
import { usePDFProcessing } from "@/lib/usePDFLoader";
import { useTheme } from "@/components/ThemeProvider";

declare global {
    interface Window {
        pdfjsLib?: any;
    }
}

export default function ChatbotPage() {
    const [isMounted, setIsMounted] = useState(false);
    const { darkMode, setDarkMode } = useTheme();
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isFileLoading, setIsFileLoading] = useState(false);
    const [fileContext, setFileContext] = useState<FileContextType>(null);
    const [loading, setLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [regeneratingMessageId, setRegeneratingMessageId] = useState<number | null>(null);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const { data: session, status } = useSession();
    const router = useRouter();

    const { sendMessage: sendGeminiMessage, streamMessage: sendGeminiStreamMessage, isConfigured } = useGemini();
    const {
        chatSessions,
        currentSessionId,
        messages,
        messageId,
        isLoading,
        hasHydrated,
        newChat,
        loadChat,
        deleteSession,
        clearChat,
        setMessages,
        setMessageId,
        setCurrentSessionId,
    } = useChatSessions();

    const { isListening, speechSupported, toggleSpeechRecognition } = useSpeechRecognition(
        setInput,
        setIsTyping
    );

    // Lazy load PDF processing when needed
    const { processPDF } = usePDFProcessing(true);

    // Suggested prompts
    const [suggestedPrompts] = useState([
        "Explain quantum computing in simple terms",
        "How do I center a div in CSS?",
        "Write a Python function to calculate factorial",
        "What's the difference between React and Vue?",
        "How to implement authentication in Next.js?",
        "Explain closures in JavaScript",
    ]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Save dark mode preference to localStorage
    useEffect(() => {
        localStorage.setItem("darkMode", darkMode.toString());
    }, [darkMode]);

    // Authentication check
    useEffect(() => {
        if (status === 'loading') return; // Still loading
        if (!session) {
            router.push('/auth/signin');
        }
    }, [session, status, router]);

    // Wrap hook functions to also clear UI state
    const handleNewChat = () => {
        newChat();
        setShowHistory(false);
        setInput("");
        setIsTyping(false);
        setFileContext(null);
    };

    const handleLoadChat = (sessionId: string) => {
        loadChat(sessionId, () => setShowHistory(false));
        setInput("");
        setIsTyping(false);
        setFileContext(null);
    };

    const handleClearChat = () => {
        clearChat();
        setShowHistory(false);
        setInput("");
        setIsTyping(false);
        setFileContext(null);
    };

    const sendMessage = async () => {
        if ((!input.trim() && !fileContext) || loading) return;

        if (!isConfigured) {
            const errorMessage: Message = {
                id: messageId + 1,
                role: "bot",
                content: "Please set your Google API key in the environment variables. Get a free key from Google AI Studio",
            };
            setMessages((prev) => [...prev, errorMessage]);
            setMessageId((id) => id + 2);
            return;
        }

        const displayContent = input.trim();
        const userMessageId = messageId;
        const botMessageId = messageId + 1;

        const userMessage: Message = {
            id: userMessageId,
            role: "user",
            content: displayContent,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsTyping(false);
        setMessageId((id) => id + 2); // Increment by 2 for user + bot
        setLoading(true);

        try {
            let fullContent = "";
            let botMessageAdded = false;
            let isCachedResponse = false;

            const { response, isCached } = await sendGeminiStreamMessage(
                displayContent,
                [...messages, userMessage],
                fileContext,
                userMessageId,
                (chunk) => {
                    // Add placeholder on first chunk only
                    if (!botMessageAdded) {
                        fullContent = chunk;
                        setMessages((prev) => [...prev, {
                            id: botMessageId,
                            role: "bot",
                            content: chunk,
                        }]);
                        botMessageAdded = true;
                    } else {
                        // Update existing message with new content
                        fullContent += chunk;
                        setMessages((prev) =>
                            prev.map((msg) =>
                                msg.id === botMessageId
                                    ? { ...msg, content: fullContent, isCached: isCachedResponse }
                                    : msg
                            )
                        );
                    }
                }
            );

            // Set cached flag after streaming completes
            isCachedResponse = isCached || false;
            if (isCachedResponse) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === botMessageId
                            ? { ...msg, isCached: true, responses: [fullContent], currentResponseIndex: 0 }
                            : msg
                    )
                );
            } else {
                // Initialize responses array for new messages
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === botMessageId
                            ? { ...msg, responses: [fullContent], currentResponseIndex: 0 }
                            : msg
                    )
                );
            }
        } catch (err: any) {
            logError(err, 'Message sending');
            const errorMessage: Message = {
                id: botMessageId,
                role: "bot",
                content: `API Error: ${err.message || "Please check your API key and model configuration"}`,
            };
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === botMessageId ? errorMessage : msg
                ) || [...prev, errorMessage]
            );
        } finally {
            setLoading(false);
            setFileContext(null);
        }
    };

    const regenerateMessage = async (botMessageId: number) => {
        if (loading || regeneratingMessageId !== null) return;

        // Find the bot message and its corresponding user message
        const botMessageIndex = messages.findIndex(msg => msg.id === botMessageId);
        if (botMessageIndex === -1 || messages[botMessageIndex].role !== 'bot') return;

        const userMessageIndex = botMessageIndex - 1;
        if (userMessageIndex < 0 || messages[userMessageIndex].role !== 'user') return;

        const userMessage = messages[userMessageIndex];
        const previousMessages = messages.slice(0, userMessageIndex);

        setRegeneratingMessageId(botMessageId);

        try {
            // Clear the existing bot message content
            setMessages(prev => prev.map(msg =>
                msg.id === botMessageId
                    ? { ...msg, content: "", isCached: false }
                    : msg
            ));

            let fullContent = "";
            let isCachedResponse = false;

            const { response, isCached } = await sendGeminiStreamMessage(
                userMessage.content,
                [...previousMessages, userMessage],
                null, // fileContext is not preserved for regeneration
                userMessage.id,
                (chunk) => {
                    fullContent += chunk;
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === botMessageId
                                ? { ...msg, content: fullContent, isCached: isCachedResponse }
                                : msg
                        )
                    );
                },
                true // skipCache: true for regeneration
            );

            // Set cached flag after streaming completes
            isCachedResponse = isCached || false;

            // Store the new response in the responses array
            setMessages((prev) =>
                prev.map((msg) => {
                    if (msg.id === botMessageId) {
                        const currentResponses = msg.responses || [msg.content];
                        const newResponses = [...currentResponses, fullContent];
                        const newIndex = newResponses.length - 1;

                        return {
                            ...msg,
                            content: fullContent,
                            responses: newResponses,
                            currentResponseIndex: newIndex,
                            isCached: isCachedResponse
                        };
                    }
                    return msg;
                })
            );
        } catch (err: any) {
            logError(err, 'Message regeneration');
            const errorMessage = {
                id: botMessageId,
                role: "bot" as const,
                content: `API Error: ${err.message || "Please check your API key and model configuration"}`,
            };
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === botMessageId ? errorMessage : msg
                )
            );
        } finally {
            setRegeneratingMessageId(null);
        }
    };

    const navigateResponse = (messageId: number, direction: 'prev' | 'next') => {
        setMessages(prev => prev.map(msg => {
            if (msg.id === messageId && msg.responses && msg.responses.length > 1) {
                const currentIndex = msg.currentResponseIndex || 0;
                let newIndex = currentIndex;

                if (direction === 'prev' && currentIndex > 0) {
                    newIndex = currentIndex - 1;
                } else if (direction === 'next' && currentIndex < msg.responses.length - 1) {
                    newIndex = currentIndex + 1;
                }

                return {
                    ...msg,
                    content: msg.responses[newIndex],
                    currentResponseIndex: newIndex,
                    isCached: false // Reset cached flag when navigating
                };
            }
            return msg;
        }));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Handle PDF file upload
    const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || file.type !== "application/pdf") return;

        setIsFileLoading(true);

        try {
            // Lazy load PDF and extract text
            const text = await processPDF(file);
            if (text) {
                setFileContext({
                    type: "pdf",
                    data: text,
                    filename: file.name
                });
            } else {
                setFileContext({
                    type: "pdf",
                    data: "[Failed to extract PDF content]",
                    filename: file.name
                });
            }
        } catch (error) {
            logError(error, 'PDF extraction');
            setFileContext({
                type: "pdf",
                data: "[Failed to extract PDF content]",
                filename: file.name
            });
        } finally {
            setIsFileLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    // Handle image upload
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith("image/")) return;

        setIsFileLoading(true);

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = () => {
                const base64 = reader.result as string;
                // Extract base64 data without the prefix
                const base64Data = base64.split(",")[1];
                setFileContext({
                    type: "image",
                    data: base64Data,
                    filename: file.name
                });
                setIsFileLoading(false);
            };

            reader.onerror = (error) => {
                logError(error, 'Image read');
                setIsFileLoading(false);
            };
        } catch (error) {
            logError(error, 'Image upload');
            setIsFileLoading(false);
        } finally {
            if (imageInputRef.current) {
                imageInputRef.current.value = "";
            }
        }
    };

    // Clear file context
    const clearFileContext = () => {
        setFileContext(null);
    };

    if (!isMounted || isLoading || status === 'loading') {
        return (
            <div
                className={cn(
                    "flex items-center justify-center h-screen",
                    darkMode ? "bg-[#1e1e1e]" : "bg-white"
                )}
            >
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!session) {
        return null; // Will redirect via useEffect
    }

    return (
        <ComponentErrorBoundary componentName="ChatPage">
            <div className={cn(
                "flex flex-col h-screen",
                darkMode ? "bg-[#1e1e1e] text-white" : "bg-white text-black"
            )}>
                <ComponentErrorBoundary componentName="ChatHeader">
                    <ChatHeader
                        darkMode={darkMode}
                        setDarkMode={setDarkMode}
                        clearChat={handleClearChat}
                        showHistory={showHistory}
                        setShowHistory={setShowHistory}
                    />
                </ComponentErrorBoundary>

                <div className="flex flex-1 overflow-hidden relative">
                    <ComponentErrorBoundary componentName="ChatHistory">
                        <ChatHistory
                            chatSessions={chatSessions}
                            currentSessionId={currentSessionId}
                            darkMode={darkMode}
                            showHistory={showHistory}
                            setShowHistory={setShowHistory}
                            newChat={handleNewChat}
                            loadChat={handleLoadChat}
                            deleteSession={deleteSession}
                        />
                    </ComponentErrorBoundary>

                    <div className="flex-1 flex flex-col">
                        <div className="flex-grow overflow-y-auto py-6">
                            <div className="flex flex-col gap-4 w-full max-w-3xl mx-auto px-4">
                                {messages.length === 0 && !loading && (
                                    <ComponentErrorBoundary componentName="SuggestedPrompts">
                                        <SuggestedPrompts
                                            suggestedPrompts={suggestedPrompts}
                                            onSelectPrompt={(prompt) => {
                                                setInput(prompt);
                                                setTimeout(() => {
                                                    const inputEl = document.querySelector("input");
                                                    inputEl?.focus();
                                                }, 100);
                                            }}
                                            darkMode={darkMode}
                                        />
                                    </ComponentErrorBoundary>
                                )}

                                {messages.map((msg) => (
                                    <ComponentErrorBoundary key={msg.id} componentName={`ChatMessage-${msg.id}`}>
                                        <ChatMessage
                                            message={msg}
                                            darkMode={darkMode}
                                            markdownComponents={markdownComponents(darkMode)}
                                            onRegenerate={regenerateMessage}
                                            isRegenerating={regeneratingMessageId === msg.id}
                                            onNavigateResponse={navigateResponse}
                                        />
                                    </ComponentErrorBoundary>
                                ))}

                                {(loading || regeneratingMessageId !== null) && (
                                    <div className={cn(
                                        "py-2 px-4 rounded-md text-base w-fit animate-pulse",
                                        darkMode ? "bg-gray-600 text-white" : "bg-gray-300 text-black"
                                    )}>
                                        Thinking...
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Typing Indicator */}
                        {isTyping && (
                            <div className={cn(
                                "absolute bottom-20 left-1/2 transform -translate-x-1/2 z-50",
                                "text-xs py-1 px-2 rounded-full",
                                darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"
                            )}>
                                Typing...
                            </div>
                        )}

                        {/* Listening Indicator */}
                        {isListening && (
                            <div className={cn(
                                "fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50",
                                "text-xs py-1 px-2 rounded-full flex items-center",
                                darkMode ? "bg-red-700 text-white" : "bg-red-400 text-white"
                            )}>
                                <span className="flex h-2 w-2 mr-2">
                                    <span className="animate-ping absolute h-2 w-2 rounded-full bg-white opacity-75"></span>
                                    <span className="relative h-2 w-2 rounded-full bg-white"></span>
                                </span>
                                Listening...
                            </div>
                        )}

                        <ComponentErrorBoundary componentName="FileContextIndicator">
                            <FileContextIndicator
                                fileContext={fileContext}
                                clearFileContext={clearFileContext}
                                darkMode={darkMode}
                            />
                        </ComponentErrorBoundary>

                        <ComponentErrorBoundary componentName="ChatInput">
                            <ChatInput
                                input={input}
                                setInput={setInput}
                                setIsTyping={setIsTyping}
                                sendMessage={sendMessage}
                                loading={loading}
                                darkMode={darkMode}
                                handlePdfUpload={handlePdfUpload}
                                handleImageUpload={handleImageUpload}
                                isFileLoading={isFileLoading}
                                fileContext={fileContext}
                                clearFileContext={clearFileContext}
                                fileInputRef={fileInputRef}
                                imageInputRef={imageInputRef}
                                onKeyDown={handleKeyDown}
                                isListening={isListening}
                                toggleSpeechRecognition={toggleSpeechRecognition}
                                speechSupported={speechSupported}
                            />
                        </ComponentErrorBoundary>
                    </div>
                </div>
            </div>
        </ComponentErrorBoundary>
    );
}