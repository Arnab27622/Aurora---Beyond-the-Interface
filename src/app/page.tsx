"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatHistory } from "@/components/chat/ChatHistory";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { FileContextIndicator } from "@/components/chat/FileContextIndicator";
import { SuggestedPrompts } from "@/components/chat/SuggestedPrompts";
import { markdownComponents } from "@/components/chat/markdown-components";
import { Message, ChatSession, FileContextType } from "@/lib/types";
import { cn } from "@/lib/utils";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const MODEL_ID = process.env.NEXT_PUBLIC_GEMINI_MODEL_ID;

declare global {
    interface Window {
        pdfjsLib?: any;
    }
}

export default function ChatbotPage() {
    const [isMounted, setIsMounted] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [hasHydrated, setHasHydrated] = useState(false);
    const [messageId, setMessageId] = useState(1);
    const [loading, setLoading] = useState(false);
    const [darkMode, setDarkMode] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [isFileLoading, setIsFileLoading] = useState(false);
    const [fileContext, setFileContext] = useState<FileContextType>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const recognitionRef = useRef<any>(null);
    const finalTranscriptRef = useRef("");

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

    // Initialize speech recognition
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
            setSpeechSupported(true);
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event: any) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscriptRef.current += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }

                setInput(finalTranscriptRef.current + interimTranscript);
                setIsTyping(true);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                stopListening();
            };

            recognitionRef.current.onend = () => {
                if (isListening) {
                    startListening();
                }
            };
        }

        return () => {
            stopListening();
        };
    }, []);

    // Hydrate state from localStorage
    useEffect(() => {
        const savedDarkMode = localStorage.getItem("darkMode");
        const savedSessions = localStorage.getItem("chatSessions");
        const savedCurrentSession = localStorage.getItem("currentSessionId");
        const savedMessages = localStorage.getItem("chatMessages");

        let initialSessions: ChatSession[] = [];
        let initialMessages: Message[] = [];
        let initialSessionId: string | null = null;
        let nextMessageId = 1;

        try {
            if (savedSessions) {
                initialSessions = JSON.parse(savedSessions);
            }

            if (savedCurrentSession) {
                initialSessionId = savedCurrentSession;
                const session = initialSessions.find((s) => s.id === savedCurrentSession);
                if (session) {
                    initialMessages = session.messages;
                    nextMessageId = Math.max(...session.messages.map((m) => m.id), 0) + 1;
                }
            } else if (savedMessages) {
                initialMessages = JSON.parse(savedMessages);
                if (initialMessages.length > 0) {
                    nextMessageId = Math.max(...initialMessages.map((m) => m.id), 0) + 1;
                }
            }
        } catch (e) {
            console.error("Error parsing localStorage data:", e);
        }

        setChatSessions(initialSessions);
        setMessages(initialMessages);
        setMessageId(nextMessageId);
        setCurrentSessionId(initialSessionId);

        if (savedDarkMode) {
            setDarkMode(savedDarkMode === "true");
        }

        setHasHydrated(true);
        setIsLoading(false);
    }, []);

    // Save state to localStorage
    useEffect(() => {
        if (!hasHydrated) return;

        localStorage.setItem("darkMode", darkMode.toString());
        localStorage.setItem("chatSessions", JSON.stringify(chatSessions));

        if (currentSessionId) {
            localStorage.setItem("currentSessionId", currentSessionId);
            localStorage.removeItem("chatMessages");
        } else {
            localStorage.setItem("chatMessages", JSON.stringify(messages));
            localStorage.removeItem("currentSessionId");
        }
    }, [messages, darkMode, chatSessions, currentSessionId, hasHydrated]);

    // Update existing session when messages change
    useEffect(() => {
        if (!hasHydrated || !currentSessionId) return;

        setChatSessions((prev) =>
            prev.map((session) =>
                session.id === currentSessionId
                    ? { ...session, messages, timestamp: Date.now() }
                    : session
            )
        );
    }, [messages, currentSessionId, hasHydrated]);

    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            finalTranscriptRef.current = input;
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    const toggleSpeechRecognition = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    // Create new chat session
    const newChat = () => {
        if (!currentSessionId && messages.length > 0) {
            const title = messages[0].content.substring(0, 30) +
                (messages[0].content.length > 30 ? "..." : "");

            const newSession: ChatSession = {
                id: Date.now().toString(),
                title,
                timestamp: Date.now(),
                messages: [...messages],
            };

            setChatSessions((prev) => [newSession, ...prev]);
        }

        setMessages([]);
        setMessageId(1);
        setCurrentSessionId(null);
        setShowHistory(false);
        setInput("");
        setIsTyping(false);
        setFileContext(null);
    };

    // Load chat session
    const loadChat = (sessionId: string) => {
        const session = chatSessions.find((s) => s.id === sessionId);
        if (session) {
            setMessages(session.messages);
            setCurrentSessionId(sessionId);

            const maxId = Math.max(...session.messages.map((m) => m.id), 0);
            setMessageId(maxId + 1);

            if (window.innerWidth < 768) {
                setShowHistory(false);
            }

            setInput("");
            setIsTyping(false);
            setFileContext(null);
        }
    };

    // Delete chat session
    const deleteSession = (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        setChatSessions((prev) => prev.filter((session) => session.id !== sessionId));

        if (currentSessionId === sessionId) {
            setMessages([]);
            setMessageId(1);
            setCurrentSessionId(null);
        }
    };

    // Clear current chat function
    const clearChat = () => {
        if (currentSessionId) {
            setChatSessions((prev) => prev.filter((s) => s.id !== currentSessionId));
        }
        setMessages([]);
        setMessageId(1);
        setCurrentSessionId(null);
        setInput("");
        setIsTyping(false);
        setFileContext(null);
    };

    const sendMessage = async () => {
        if ((!input.trim() && !fileContext) || loading) return;

        if (API_KEY === "YOUR_API_KEY_HERE") {
            const errorMessage: Message = {
                id: messageId + 1,
                role: "bot",
                content: "Please set your Google API key in the code. Get a free key from Google AI Studio",
            };
            setMessages((prev) => [...prev, errorMessage]);
            setMessageId((id) => id + 2);
            return;
        }

        // Create user message with only the input text for display
        const displayContent = input.trim();
        const userMessage: Message = {
            id: messageId,
            role: "user",
            content: displayContent,
        };

        const newMessageList = [...messages, userMessage];
        setMessages(newMessageList);
        setInput("");
        setIsTyping(false);
        setMessageId((id) => id + 1);
        setLoading(true);

        try {
            // Prepare API content with file context if available
            let apiContent = "";
            let filePart = null;

            if (fileContext) {
                if (fileContext.type === "pdf") {
                    apiContent = `[PDF: ${fileContext.filename}]\n${fileContext.data}\n\n[Question]: ${input.trim()}`;
                } else if (fileContext.type === "image") {
                    // For images, we'll send as a separate part
                    filePart = {
                        inline_data: {
                            mime_type: "image/jpeg",
                            data: fileContext.data
                        }
                    };
                    apiContent = input.trim() || `Please analyze this image: ${fileContext.filename}`;
                }
            } else {
                apiContent = input.trim();
            }

            // Prepare messages for API
            const contents = [
                ...newMessageList.map((m) => ({
                    role: m.role === "user" ? "user" : "model",
                    parts: [{ text: m.content }],
                })),
                {
                    role: "user",
                    parts: filePart
                        ? [
                            { text: apiContent },
                            filePart
                        ]
                        : [{ text: apiContent }]
                }
            ];

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${API_KEY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents,
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 2048,
                        },
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    `API error: ${response.status} ${errorData.error?.message || response.statusText}`
                );
            }

            const data = await response.json();
            const botText = data.candidates?.[0]?.content?.parts?.[0]?.text ||
                "Sorry, I couldn't process that request.";

            const botMessage: Message = {
                id: messageId + 1,
                role: "bot",
                content: botText,
            };

            setMessages((prev) => [...prev, botMessage]);
            setMessageId((id) => id + 2);
        } catch (err: any) {
            console.error("API Error:", err);
            const errorMessage: Message = {
                id: messageId + 1,
                role: "bot",
                content: `API Error: ${err.message || "Please check your API key and model configuration"}`,
            };
            setMessages((prev) => [...prev, errorMessage]);
            setMessageId((id) => id + 2);
        } finally {
            setLoading(false);
            // Clear file context after sending
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
            console.error("PDF extraction failed:", error);
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
                console.error("Image read error:", error);
                setIsFileLoading(false);
            };
        } catch (error) {
            console.error("Image upload failed:", error);
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
        <div className={cn(
            "flex flex-col h-screen",
            darkMode ? "bg-[#1e1e1e] text-white" : "bg-white text-black"
        )}>
            <ChatHeader
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                clearChat={clearChat}
                showHistory={showHistory}
                setShowHistory={setShowHistory}
            />

            <div className="flex flex-1 overflow-hidden relative">
                <ChatHistory
                    chatSessions={chatSessions}
                    currentSessionId={currentSessionId}
                    darkMode={darkMode}
                    showHistory={showHistory}
                    setShowHistory={setShowHistory}
                    newChat={newChat}
                    loadChat={loadChat}
                    deleteSession={deleteSession}
                />

                <div className="flex-1 flex flex-col">
                    <div className="flex-grow overflow-y-auto py-6">
                        <div className="flex flex-col gap-4 w-full max-w-3xl mx-auto px-4">
                            {messages.length === 0 && !loading && (
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
                            )}

                            {messages.map((msg) => (
                                <ChatMessage
                                    key={msg.id}
                                    message={msg}
                                    darkMode={darkMode}
                                    markdownComponents={markdownComponents(darkMode)}
                                />
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


                    <FileContextIndicator
                        fileContext={fileContext}
                        clearFileContext={clearFileContext}
                        darkMode={darkMode}
                    />

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
                </div>
            </div>
        </div>
    );
}