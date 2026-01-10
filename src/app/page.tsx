"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatHistory } from "@/components/chat/ChatHistory";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { FileContextIndicator } from "@/components/chat/FileContextIndicator";
import { ChevronDown } from "lucide-react";

import { markdownComponents } from "@/components/chat/markdown-components";
import { Message, FileContextType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useGemini } from "@/lib/useGemini";
import { useChatSessions } from "@/lib/useChatSessions";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { ComponentErrorBoundary } from "@/components/errors/ComponentErrorBoundary";
import { logError } from "@/lib/errorHandler";
import { usePDFProcessing } from "@/lib/usePDFLoader";
import { useFileLoader, SupportedFileType } from "@/lib/useFileLoader";
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
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [hasScrollbar, setHasScrollbar] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
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
        refreshSessions,
        setMessages,
        setMessageId,
        setCurrentSessionId,
    } = useChatSessions(session?.user?.id);

    const { isListening, speechSupported, toggleSpeechRecognition } = useSpeechRecognition(
        setInput,
        setIsTyping
    );

    // Lazy load PDF processing when needed
    const { processPDF } = usePDFProcessing(true);
    const { processFile, isProcessing: isFileProcessing, error: fileError } = useFileLoader();



    useEffect(() => {
        setIsMounted(true);
    }, []);

    // useEffect(() => {
    //     if (!isLoadingChat) {
    //         // Delay scrolling to allow layout to stabilize
    //         const timeoutId = setTimeout(() => {
    //             messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    //         }, 150);
    //         return () => clearTimeout(timeoutId);
    //     }
    // }, [messages, isLoadingChat]);

    // Authentication check
    useEffect(() => {
        if (status === 'loading') return; // Still loading
        if (!session) {
            router.push('/auth/signin');
        }
    }, [session, status, router]);

    // Detect scroll position to show/hide down arrow button
    useEffect(() => {
        if (!isMounted) return;

        const setupScrollListener = () => {
            const scrollContainer = scrollContainerRef.current;
            if (!scrollContainer) {
                setTimeout(setupScrollListener, 100);
                return;
            }

            const updateScrollState = () => {
                const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
                const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px tolerance
                // Only consider it having a scrollbar if there's significant overflow (more than 50px)
                const hasScrollbar = scrollHeight > clientHeight + 50 && messages.length > 0;
                setIsAtBottom(isAtBottom);
                setHasScrollbar(hasScrollbar);
            };

            scrollContainer.addEventListener('scroll', updateScrollState);
            // Delay to ensure DOM has updated after messages change
            setTimeout(updateScrollState, 0);

            return () => {
                scrollContainer.removeEventListener('scroll', updateScrollState);
            };
        };

        const cleanup = setupScrollListener();
        return cleanup;
    }, [isMounted, messages.length]);

    // Wrap hook functions to also clear UI state
    const handleNewChat = async () => {
        setIsLoadingChat(true);
        await newChat();
        setShowHistory(false);
        setInput("");
        setIsTyping(false);
        setFileContext(null);
        // Reset scroll state for new chat
        setIsAtBottom(true);
        setHasScrollbar(false);
        setIsLoadingChat(false);
    };

    const handleLoadChat = async (sessionId: string) => {
        // Save current scroll position
        const scrollContainer = messagesEndRef.current?.parentElement?.parentElement;
        const savedScrollTop = scrollContainer?.scrollTop || 0;

        setIsLoadingChat(true);
        await loadChat(sessionId, () => setShowHistory(false));
        setInput("");
        setIsTyping(false);
        setFileContext(null);

        // Restore scroll position after a brief delay to allow layout to stabilize
        setTimeout(() => {
            if (scrollContainer) {
                scrollContainer.scrollTop = savedScrollTop;
            }
            setIsLoadingChat(false);
        }, 100);
    };

    const handleClearChat = async () => {
        await clearChat();
        setShowHistory(false);
        setInput("");
        setIsTyping(false);
        setFileContext(null);
        // Reset scroll state for cleared chat
        setIsAtBottom(true);
        setHasScrollbar(false);
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

        // Create a new chat session if none exists
        if (!currentSessionId) {
            try {
                const title = input.trim().substring(0, 30) + (input.trim().length > 30 ? "..." : "") || "New Chat";
                const response = await fetch("/api/chat-sessions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        title,
                        messages: [],
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setCurrentSessionId(data.session.id);
                    // Refresh sessions to update the sidebar immediately
                    await refreshSessions();
                } else {
                    console.error("Failed to create chat session");
                    return;
                }
            } catch (error) {
                console.error("Error creating chat session:", error);
                return;
            }
        }

        const displayContent = input.trim();
        const userMessageId = messageId;
        const botMessageId = messageId + 1;

        const userMessage: Message = {
            id: userMessageId,
            role: "user",
            content: displayContent,
            file: fileContext || undefined,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsTyping(false);
        setMessageId((id) => id + 2); // Increment by 2 for user + bot
        setLoading(true);

        try {
            let fullContent = "";
            let botMessageAdded = false;

            await sendGeminiStreamMessage(
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
                                    ? { ...msg, content: fullContent }
                                    : msg
                            )
                        );
                    }
                }
            );

            // Initialize responses array for new messages
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === botMessageId
                        ? { ...msg, responses: [fullContent], currentResponseIndex: 0 }
                        : msg
                )
            );
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
                    ? { ...msg, content: "" }
                    : msg
            ));

            let fullContent = "";

            const { response } = await sendGeminiStreamMessage(
                userMessage.content,
                [...previousMessages, userMessage],
                userMessage.file || null, // Preserve file context from original user message
                userMessage.id,
                (chunk) => {
                    fullContent += chunk;
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === botMessageId
                                ? { ...msg, content: fullContent }
                                : msg
                        )
                    );
                }
            );

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
                            currentResponseIndex: newIndex
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
                    currentResponseIndex: newIndex
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

    const scrollToBottom = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                top: scrollContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    // Get file type from file extension
    const getFileType = (file: File): SupportedFileType | null => {
        const extension = file.name.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'txt':
                return 'txt';
            case 'docx':
                return 'docx';
            case 'xlsx':
                return 'xlsx';
            case 'csv':
                return 'csv';
            case 'pptx':
                return 'pptx';
            default:
                if (file.type === 'application/pdf') {
                    return null; // Handle PDF separately
                }
                return null;
        }
    };

    // Handle file upload (documents)
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsFileLoading(true);

        try {
            let fileType: SupportedFileType | "pdf" = "txt"; // default
            let fileData: string = "";

            if (file.type === "application/pdf") {
                fileType = "pdf";
                // Extract text content from PDF using the PDF processing hook
                const extractedText = await processPDF(file);
                if (extractedText) {
                    fileData = extractedText;
                } else {
                    fileData = `[Failed to extract text from PDF file: ${file.name}]`;
                }
            } else {
                const detectedType = getFileType(file);
                if (detectedType) {
                    fileType = detectedType;
                    // Extract text content for supported file types
                    const extractedText = await processFile(file, detectedType);
                    if (extractedText) {
                        fileData = extractedText;
                    } else {
                        fileData = `[Failed to extract text from ${fileType.toUpperCase()} file: ${file.name}]`;
                    }
                } else {
                    // Fallback for unsupported text files
                    const reader = new FileReader();
                    reader.readAsText(file);

                    await new Promise<void>((resolve, reject) => {
                        reader.onload = () => {
                            fileData = reader.result as string;
                            resolve();
                        };
                        reader.onerror = () => reject(new Error('Failed to read file'));
                    });
                }
            }

            setFileContext({
                type: fileType,
                data: fileData,
                filename: file.name
            });

            setIsFileLoading(false);
        } catch (error) {
            logError(error, 'File upload');
            const detectedType = getFileType(file) || "txt";
            setFileContext({
                type: detectedType,
                data: `[Failed to process file: ${file.name}]`,
                filename: file.name
            });
            setIsFileLoading(false);
        } finally {
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
                            userName={session?.user?.name}
                        />
                    </ComponentErrorBoundary>

                    <div className="flex-1 flex flex-col relative">
                        <div className="flex-grow overflow-y-auto py-4 sm:py-6 relative" ref={scrollContainerRef}>
                            <div className="flex flex-col gap-4 w-full max-w-3xl mx-auto px-1 sm:px-4">
                                {messages.length === 0 && !loading && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-normal text-center">What can I help with?</h2>
                                    </div>
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


                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Scroll to bottom button */}
                        {(() => {
                            const shouldShow = messages.length > 0 && hasScrollbar && !isAtBottom;
                            return shouldShow && (
                                <button
                                    onClick={scrollToBottom}
                                    className={cn(
                                        "absolute bottom-20 right-2.5 sm:right-6 z-50 p-3 rounded-full shadow-lg transition-all duration-200 cursor-pointer hover:scale-110",
                                        darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-white text-gray-700 hover:bg-gray-50"
                                    )}
                                    aria-label="Scroll to bottom"
                                >
                                    <ChevronDown className="w-5 h-5" />
                                </button>
                            );
                        })()}

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
                                handleFileUpload={handleFileUpload}
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