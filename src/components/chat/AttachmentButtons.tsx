/**
 * AttachmentButtons Component
 * 
 * Renders a set of icon buttons for file, image, and voice input attachments.
 * Visible only on medium (md) screens and above, providing quick access to:
 * - PDF/document file uploads
 * - Voice input toggle (when supported)
 * - Image file uploads
 */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { File, ImageIcon, Mic, Square, Loader2 } from "lucide-react";
import React from "react";

interface AttachmentButtonsProps {
  darkMode: boolean;
  loading: boolean;
  isFileLoading: boolean;
  isListening: boolean;
  speechSupported: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  toggleSpeechRecognition: () => void;
}

const buttonClassName = (darkMode: boolean) =>
  cn(
    "rounded-full shrink-0 cursor-pointer",
    darkMode
      ? "border-gray-500 bg-transparent hover:bg-white text-white"
      : "border-gray-300 bg-transparent hover:bg-gray-100 text-black"
  );

export const AttachmentButtons = ({
  darkMode,
  loading,
  isFileLoading,
  isListening,
  speechSupported,
  fileInputRef,
  imageInputRef,
  toggleSpeechRecognition,
}: AttachmentButtonsProps) => {
  return (
    <div className="hidden md:flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={isFileLoading || loading}
        className={buttonClassName(darkMode)}
        aria-label="Upload PDF file"
      >
        <File className="h-4 w-4" />
      </Button>

      {speechSupported && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={toggleSpeechRecognition}
          disabled={loading || isFileLoading}
          className={cn(
            buttonClassName(darkMode),
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
        className={buttonClassName(darkMode)}
      >
        {isFileLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ImageIcon className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};
