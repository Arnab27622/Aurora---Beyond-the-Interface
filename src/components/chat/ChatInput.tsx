import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { File, ImageIcon, Mic, Square, Loader2, Send } from "lucide-react";
import { FileContextType } from "@/lib/types";
import { sanitizeInput } from "@/lib/sanitize";
import React from "react";

interface ChatInputProps {
    input: string;
    setInput: (value: string) => void;
    setIsTyping: (typing: boolean) => void;
    sendMessage: () => void;
    loading: boolean;
    darkMode: boolean;
    handlePdfUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
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
    handlePdfUpload,
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
}: ChatInputProps) => (
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
            <input
                type="file"
                accept=".pdf"
                ref={fileInputRef as React.RefObject<HTMLInputElement>}
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
                    "rounded-full shrink-0 cursor-pointer",
                    darkMode
                        ? "border-gray-500 bg-transparent hover:bg-white text-white"
                        : "border-gray-300 bg-transparent hover:bg-gray-100 text-black"
                )}
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
                >
                    {isListening ? (
                        <Square className="h-4 w-4" />
                    ) : (
                        <Mic className="h-4 w-4" />
                    )}
                </Button>
            )}

            <input
                type="file"
                accept="image/*"
                ref={imageInputRef as React.RefObject<HTMLInputElement>}
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