import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { File, ImageIcon, Mic, Square, Loader2, Plus } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";

interface MobileAttachmentDropdownProps {
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

export const MobileAttachmentDropdown = ({
  darkMode,
  loading,
  isFileLoading,
  isListening,
  speechSupported,
  fileInputRef,
  imageInputRef,
  toggleSpeechRecognition,
}: MobileAttachmentDropdownProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <div className="md:hidden relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={buttonClassName(darkMode)}
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
            className={buttonClassName(darkMode)}
            aria-label="Upload document file"
          >
            <File className="h-4 w-4" />
          </Button>

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
                buttonClassName(darkMode),
                isListening ? (darkMode ? "bg-red-500" : "bg-red-400") : ""
              )}
              aria-label={
                isListening ? "Stop voice input" : "Start voice input"
              }
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
            className={buttonClassName(darkMode)}
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
  );
};
