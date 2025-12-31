import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { File, ImageIcon, Mic, Square, Loader2, Send, Plus } from "lucide-react";
import { FileContextType } from "@/lib/types";
import { sanitizeInput } from "@/lib/sanitize";
import React, { useState, useRef, useEffect } from "react";

interface ChatInputProps {
    input: string;
    setInput: (value: string) => void;
    setIsTyping: (typing: boolean) => void;
    sendMessage: () => void;
    loading: boolean;
    darkMode: boolean;
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    isFileLoading: boolean;
    fileContext: FileContextType;
    clearFileContext: () => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    imageInputRef: React.RefObject<HTMLInputElement | null>;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    isListening: boolean;
    toggleSpeechRecognition: () => void;
    speechSupported: boolean;
}

export const ChatInput = ({
    input,
    setInput,
    setIsTyping,
    sendMessage,
    loading,
    darkMode,
    handleFileUpload,
    handleImageUpload,
    isFileLoading,
    fileContext,
    clearFileContext,
    fileInputRef,
    imageInputRef,
    onKeyDown,
    isListening,
    toggleSpeechRecognition,
    speechSupported,
}: ChatInputProps) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                setIsDropdownOpen(false);
                sendMessage();
            }}
            className={cn(
                "py-4 border-t",
                darkMode ? "border-gray-700 bg-[#1e1e1e]" : "border-gray-200 bg-white"
            )}
        >
            <div className="flex items-center gap-2 max-w-3xl mx-auto w-full px-4">
                <input
                    type="file"
                    accept=".pdf,.txt,.docx,.xlsx,.csv,.pptx"
                    ref={fileInputRef as React.RefObject<HTMLInputElement>}
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isFileLoading || loading}
                    aria-label="Upload document file"
                />
                <input
                    type="file"
                    accept="image/*"
                    ref={imageInputRef as React.RefObject<HTMLInputElement>}
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isFileLoading || loading}
                    aria-label="Upload image file"
                />

                {/* Desktop buttons */}
                <div className="hidden md:flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isFileLoading || loading}
                        className={cn(
                            "rounded-full shrink-0 cursor-pointer",
                            darkMode
                                ? "border-gray-500 bg-transparent hover:bg-white text-white"
                                : "border-gray-300 bg-transparent hover:bg-gray-100 text-black"
                        )}
                        aria-label="Upload PDF file"
                    >
                        <File className="h-4 w-4" />
                    </Button>

                    {/* Microphone button */}
                    {speechSupported && (
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={toggleSpeechRecognition}
                            disabled={loading || isFileLoading}
                            className={cn(
                                "rounded-full shrink-0 cursor-pointer",
                                darkMode
                                    ? "border-gray-500 bg-transparent hover:bg-white text-white"
                                    : "border-gray-300 bg-transparent hover:bg-gray-100 text-black",
                                isListening ? (darkMode ? "bg-red-500" : "bg-red-400") : ""
                            )}
                            aria-label={isListening ? "Stop voice input" : "Start voice input"}
                        >
                            {isListening ? (
                                <Square className="h-4 w-4" />
                            ) : (
                                <Mic className="h-4 w-4" />
                            )}
                        </Button>
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={isFileLoading || loading}
                        className={cn(
                            "rounded-full shrink-0 cursor-pointer",
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
                </div>

                {/* Mobile plus button and dropdown */}
                <div className="md:hidden relative">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={cn(
                            "rounded-full shrink-0 cursor-pointer",
                            darkMode
                                ? "border-gray-500 bg-transparent hover:bg-white text-white"
                                : "border-gray-300 bg-transparent hover:bg-gray-100 text-black"
                        )}
                        aria-label="Open attachment options"
                        aria-expanded={isDropdownOpen}
                        aria-haspopup="menu"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>

                    {isDropdownOpen && (
                        <div
                            ref={dropdownRef}
                            className={cn(
                                "absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 flex flex-col gap-2 p-2 border rounded shadow z-10",
                                darkMode ? "bg-[#1e1e1e] border-gray-700" : "bg-white border-gray-300"
                            )}
                        >
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                    fileInputRef.current?.click();
                                    setIsDropdownOpen(false);
                                }}
                                disabled={isFileLoading || loading}
                                className={cn(
                                    "rounded-full shrink-0 cursor-pointer",
                                    darkMode
                                        ? "border-gray-500 bg-transparent hover:bg-white text-white"
                                        : "border-gray-300 bg-transparent hover:bg-gray-100 text-black"
                                )}
                                aria-label="Upload document file"
                            >
                                <File className="h-4 w-4" />
                            </Button>

                            {/* Microphone button */}
                            {speechSupported && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                        toggleSpeechRecognition();
                                        setIsDropdownOpen(false);
                                    }}
                                    disabled={loading || isFileLoading}
                                    className={cn(
                                        "rounded-full shrink-0 cursor-pointer",
                                        darkMode
                                            ? "border-gray-500 bg-transparent hover:bg-white text-white"
                                            : "border-gray-300 bg-transparent hover:bg-gray-100 text-black",
                                        isListening ? (darkMode ? "bg-red-500" : "bg-red-400") : ""
                                    )}
                                    aria-label={isListening ? "Stop voice input" : "Start voice input"}
                                >
                                    {isListening ? (
                                        <Square className="h-4 w-4" />
                                    ) : (
                                        <Mic className="h-4 w-4" />
                                    )}
                                </Button>
                            )}

                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                    imageInputRef.current?.click();
                                    setIsDropdownOpen(false);
                                }}
                                disabled={isFileLoading || loading}
                                className={cn(
                                    "rounded-full shrink-0 cursor-pointer",
                                    darkMode
                                        ? "border-gray-500 bg-transparent hover:bg-white text-white"
                                        : "border-gray-300 bg-transparent hover:bg-gray-100 text-black"
                                )}
                                aria-label={isFileLoading ? "Uploading image" : "Upload image file"}
                            >
                                {isFileLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <ImageIcon className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    )}
                </div>

                <Input
                    placeholder={fileContext ? "Ask about the file..." : "Ask anything or upload file"}
                    value={input}
                    onChange={(e) => {
                        const value = e.target.value;
                        // Sanitize input in real-time
                        const sanitized = sanitizeInput(value);
                        setInput(sanitized);
                        // Check if there's actual content (not just whitespace)
                        setIsTyping(sanitized.trim().length > 0);
                    }}
                    onBlur={() => setIsTyping(false)}
                    onKeyDown={onKeyDown}
                    className={cn(
                        "flex-grow rounded-full px-4 py-2 text-sm border placeholder:text-gray-400",
                        darkMode
                            ? "border-gray-500 bg-transparent text-white"
                            : "border-gray-300 bg-white text-black"
                    )}
                    disabled={loading || isFileLoading}
                />

                {/* Updated Send Button with Icon */}
                <Button
                    type="submit"
                    size="icon"
                    className={cn(
                        "rounded-full shrink-0 cursor-pointer",
                        darkMode
                            ? "bg-blue-500 hover:bg-blue-600 text-white"
                            : "bg-blue-500 hover:bg-blue-600 text-white",
                        (loading || isFileLoading) && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={loading || (!input.trim() && !fileContext) || isFileLoading}
                    aria-label={loading ? "Sending message" : "Send message"}
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </Button>
            </div>
        </form>
    );
};
