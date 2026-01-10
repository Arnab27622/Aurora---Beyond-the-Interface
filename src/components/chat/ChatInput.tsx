import { cn } from "@/lib/utils";
import { FileContextType } from "@/lib/types";
import React from "react";
import { HiddenFileInputs } from "./HiddenFileInputs";
import { AttachmentButtons } from "./AttachmentButtons";
import { MobileAttachmentDropdown } from "./MobileAttachmentDropdown";
import { InputField } from "./InputField";
import { SendButton } from "./SendButton";

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
    return (
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
                <HiddenFileInputs
                    fileInputRef={fileInputRef}
                    imageInputRef={imageInputRef}
                    handleFileUpload={handleFileUpload}
                    handleImageUpload={handleImageUpload}
                    isFileLoading={isFileLoading}
                    loading={loading}
                />

                <AttachmentButtons
                    darkMode={darkMode}
                    loading={loading}
                    isFileLoading={isFileLoading}
                    isListening={isListening}
                    speechSupported={speechSupported}
                    fileInputRef={fileInputRef}
                    imageInputRef={imageInputRef}
                    toggleSpeechRecognition={toggleSpeechRecognition}
                />

                <MobileAttachmentDropdown
                    darkMode={darkMode}
                    loading={loading}
                    isFileLoading={isFileLoading}
                    isListening={isListening}
                    speechSupported={speechSupported}
                    fileInputRef={fileInputRef}
                    imageInputRef={imageInputRef}
                    toggleSpeechRecognition={toggleSpeechRecognition}
                />

                <InputField
                    input={input}
                    setInput={setInput}
                    setIsTyping={setIsTyping}
                    onKeyDown={onKeyDown}
                    loading={loading}
                    isFileLoading={isFileLoading}
                    darkMode={darkMode}
                    fileContext={fileContext}
                />

                <SendButton
                    loading={loading}
                    isFileLoading={isFileLoading}
                    input={input}
                    fileContext={fileContext}
                    darkMode={darkMode}
                />
            </div>
        </form>
    );
};
