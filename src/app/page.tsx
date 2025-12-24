"use client";

import { useEffect, useRef, useState } from "react";
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

declare global {
    interface Window {
        pdfjsLib?: any;
    }
}

export default function ChatbotPage() {
    const [isMounted, setIsMounted] = useState(false);
    const [darkMode, setDarkMode] = useState(true);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isFileLoading, setIsFileLoading] = useState(false);
    const [fileContext, setFileContext] = useState<FileContextType>(null);
    const [loading, setLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

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
                            ? { ...msg, isCached: true }
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
            // Load PDF.js library dynamically
            if (!window.pdfjsLib) {
                await loadPdfJs();
            }

            const text = await extractTextFromPDF(file);
            setFileContext({
                type: "pdf",
                data: text.substring(0, 5000), // Limit to 5000 characters
                filename: file.name
            });
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

    // Load PDF.js from CDN
    const loadPdfJs = (): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (window.pdfjsLib) {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
                resolve();
                return;
            }

            const script = document.createElement("script");
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
            script.onload = () => {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    // Extract text from PDF
    const extractTextFromPDF = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const typedArray = new Uint8Array(arrayBuffer);
        const pdf = await window.pdfjsLib.getDocument(typedArray).promise;
        let extractedText = "";

        // Limit to first 5 pages to prevent excessive processing
        const pageLimit = Math.min(pdf.numPages, 5);

        for (let i = 1; i <= pageLimit; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const strings = textContent.items.map((item: any) => item.str);
            extractedText += strings.join(" ") + "\n";

            // Stop if text is getting too long
            if (extractedText.length > 5000) break;
        }

        return extractedText;
    };

    if (!isMounted || isLoading) {
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
                                        />
                                    </ComponentErrorBoundary>
                                ))}

                                {loading && (
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