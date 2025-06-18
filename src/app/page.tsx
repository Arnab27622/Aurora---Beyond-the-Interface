"use client";

import { useEffect, useRef, useState } from "react";
import { Sun, Moon, Trash2, Copy, Check, Menu, X, Plus, File, Loader2, XCircle, ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ReactMarkdown, { Components } from "react-markdown";

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

interface Message {
  id: number;
  role: "user" | "bot";
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  timestamp: number;
  messages: Message[];
}

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyBFx7fTKDC6jg0NMxI-bhIzbJXaTzsoJ2A";
const MODEL_ID = "gemini-1.5-flash";

interface CopyButtonProps {
  text: string;
  darkMode: boolean;
}

const CopyButton = ({ text, darkMode }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "absolute top-2 right-2 p-1.5 rounded-md transition-all",
        darkMode
          ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300",
        copied
          ? darkMode
            ? "bg-green-700 text-white"
            : "bg-green-200 text-green-800"
          : ""
      )}
      aria-label={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </button>
  );
};

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
  const [fileContext, setFileContext] = useState<{
    type: "pdf" | "image";
    data: string;
    filename: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const [suggestedPrompts] = useState([
    "Explain quantum computing in simple terms",
    "How do I center a div in CSS?",
    "Write a Python function to calculate factorial",
    "What's the difference between React and Vue?",
    "How to implement authentication in Next.js?",
    "Explain closures in JavaScript",
  ]);

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

  // Markdown Components
  const markdownComponents: Components = {
    pre: ({ node, ...props }) => (
      <pre
        className={cn(
          "whitespace-pre-wrap break-words overflow-x-auto p-4 my-2 rounded-md max-w-full relative",
          darkMode ? "bg-[#2d2d2d] text-[#f8f8f2]" : "bg-[#f5f5f5] text-[#333]"
        )}
        {...props}
      />
    ),
    code: ({ node, className, children, ...props }) => {
      const codeContent = String(children).replace(/\n$/, "");
      const isInline = !className || !className.includes("language-");

      return isInline ? (
        <code
          className={cn(
            "rounded px-1 py-0.5 font-mono",
            darkMode ? "bg-[#3a3a3a]" : "bg-[#eaeaea]"
          )}
          {...props}
        >
          {children}
        </code>
      ) : (
        <div className="relative group">
          <pre
            className={cn(
              "whitespace-pre-wrap break-words overflow-x-auto p-4 my-2 rounded-md max-w-full",
              darkMode ? "bg-[#2d2d2d] text-[#f8f8f2]" : "bg-[#f5f5f5] text-[#333]"
            )}
          >
            <code>{codeContent}</code>
          </pre>
          <CopyButton text={codeContent} darkMode={darkMode} />
        </div>
      );
    },
    table: ({ children }) => (
      <div className="overflow-x-auto my-4">
        <table className="border-collapse w-full text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead>{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => (
      <tr className={cn(darkMode ? "border-gray-700" : "border-gray-300")}>
        {children}
      </tr>
    ),
    th: ({ children }) => (
      <th
        className={cn(
          "border px-4 py-2 text-left font-semibold",
          darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-200 border-gray-300"
        )}
      >
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td
        className={cn(
          "border px-4 py-2",
          darkMode ? "border-gray-600" : "border-gray-300"
        )}
      >
        {children}
      </td>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "hover:underline",
          darkMode ? "text-blue-400" : "text-blue-600"
        )}
      >
        {children}
      </a>
    ),
    blockquote: ({ children }) => (
      <blockquote
        className={cn(
          "border-l-4 pl-4 py-1 my-2 italic",
          darkMode ? "border-gray-500 text-gray-300" : "border-gray-400 text-gray-700"
        )}
      >
        {children}
      </blockquote>
    ),
    ul: ({ children }) => <ul className="list-disc pl-5 my-2">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-5 my-2">{children}</ol>,
    li: ({ children }) => <li className="my-1">{children}</li>,
  };

  return (
    <div
      className={cn(
        "flex flex-col h-screen",
        darkMode ? "bg-[#1e1e1e] text-white" : "bg-white text-black"
      )}
    >
      {/* Top Bar */}
      <div
        className={cn(
          "flex justify-between items-center py-4 px-5 sm:px-8 lg:px-10 border-b",
          darkMode ? "border-gray-700" : "border-gray-200"
        )}
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHistory(!showHistory)}
            className={cn(
              "md:hidden",
              darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
            )}
          >
            {showHistory ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <h1 className="text-xl font-semibold">Aurora</h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={clearChat}
            className={cn(
              darkMode
                ? "border-gray-500 bg-transparent hover:bg-white text-white"
                : "border-gray-300 bg-transparent hover:bg-gray-100 text-black"
            )}
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setDarkMode(!darkMode)}
            className={cn(
              darkMode
                ? "border-gray-500 bg-transparent hover:bg-white"
                : "border-gray-300 bg-transparent hover:bg-gray-100"
            )}
          >
            {darkMode ? (
              <Sun className="h-4 w-4 text-yellow-500" />
            ) : (
              <Moon className="h-4 w-4 text-blue-400" />
            )}
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* History Sidebar */}
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

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-grow overflow-y-auto py-6">
            <div className="flex flex-col gap-4 w-full max-w-3xl mx-auto px-4">
              {messages.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center h-full">
                  <h2 className="text-xl font-semibold mb-6">How can I help you today?</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    {suggestedPrompts.map((prompt, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setInput(prompt);
                          setTimeout(() => {
                            const inputEl = document.querySelector("input");
                            inputEl?.focus();
                          }, 100);
                        }}
                        className={cn(
                          "p-4 rounded-lg cursor-pointer transition-transform hover:scale-[1.02]",
                          darkMode
                            ? "bg-gray-800 hover:bg-gray-700"
                            : "bg-gray-100 hover:bg-gray-200"
                        )}
                      >
                        <p className="text-sm">{prompt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "whitespace-pre-wrap py-3 px-4 mb-4 rounded-md w-fit break-words max-w-[90%]",
                    "text-base",
                    msg.role === "user"
                      ? darkMode
                        ? "bg-[#343541] text-white self-end ml-auto"
                        : "bg-[#e0e0e0] text-black self-end ml-auto"
                      : darkMode
                        ? "bg-[#2a2a2a] text-white self-start mr-auto"
                        : "bg-[#f0f0f0] text-black self-start mr-auto"
                  )}
                >
                  <ReactMarkdown components={markdownComponents}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ))}
              {loading && (
                <div
                  className={cn(
                    "py-2 px-4 rounded-md text-base w-fit animate-pulse",
                    darkMode ? "bg-gray-600 text-white" : "bg-gray-300 text-black"
                  )}
                >
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

          {/* File Indicator */}
          {fileContext && (
            <div className={cn(
              "max-w-3xl mx-auto w-full px-4 pb-2 flex items-center",
              darkMode ? "text-gray-300" : "text-gray-700"
            )}>
              {fileContext.type === "pdf" ? (
                <File className="h-4 w-4 mr-2" />
              ) : (
                <ImageIcon className="h-4 w-4 mr-2" />
              )}
              <span className="text-xs truncate mr-2">{fileContext.filename}</span>
              <button
                onClick={clearFileContext}
                className={cn(
                  "p-1 rounded-full",
                  darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                )}
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className={cn(
              "py-4 border-t",
              darkMode ? "border-gray-700 bg-[#1e1e1e]" : "border-gray-200 bg-white"
            )}
          >
            <div className="flex items-center gap-2 max-w-3xl mx-auto w-full px-4">
              {/* PDF Upload Button */}
              <input
                type="file"
                accept=".pdf"
                ref={fileInputRef}
                onChange={handlePdfUpload}
                className="hidden"
                disabled={isFileLoading || loading}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isFileLoading || loading}
                className={cn(
                  "rounded-full shrink-0",
                  darkMode
                    ? "border-gray-500 bg-transparent hover:bg-white text-white"
                    : "border-gray-300 bg-transparent hover:bg-gray-100 text-black"
                )}
              >
                <File className="h-4 w-4" />
              </Button>

              {/* Image Upload Button */}
              <input
                type="file"
                accept="image/*"
                ref={imageInputRef}
                onChange={handleImageUpload}
                className="hidden"
                disabled={isFileLoading || loading}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => imageInputRef.current?.click()}
                disabled={isFileLoading || loading}
                className={cn(
                  "rounded-full shrink-0",
                  darkMode
                    ? "border-gray-500 bg-transparent hover:bg-white text-white"
                    : "border-gray-300 bg-transparent hover:bg-gray-100 text-black"
                )}
              >
                {isFileLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}
              </Button>

              <Input
                placeholder={fileContext ? "Ask about the file..." : "Ask anything or upload file"}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setIsTyping(e.target.value.length > 0);
                }}
                onBlur={() => setIsTyping(false)}
                onKeyDown={handleKeyDown}
                className={cn(
                  "flex-grow rounded-full px-4 py-2 text-sm border placeholder:text-gray-400",
                  darkMode
                    ? "border-gray-500 bg-transparent text-white"
                    : "border-gray-300 bg-white text-black"
                )}
                disabled={loading || isFileLoading}
              />
              <Button
                type="submit"
                className="rounded-full px-4 py-2 text-sm bg-blue-500 text-white hover:bg-blue-600"
                disabled={loading || (!input.trim() && !fileContext) || isFileLoading}
              >
                Send
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}