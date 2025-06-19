import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { File, ImageIcon, Loader2 } from "lucide-react";
import { FileContextType } from "@/lib/types";
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
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void; // Added this
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
    onKeyDown, // Added this
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
                    "rounded-full shrink-0",
                    darkMode
                        ? "border-gray-500 bg-transparent hover:bg-white text-white"
                        : "border-gray-300 bg-transparent hover:bg-gray-100 text-black"
                )}
            >
                <File className="h-4 w-4" />
            </Button>

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
                onKeyDown={onKeyDown} // Added this
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
);