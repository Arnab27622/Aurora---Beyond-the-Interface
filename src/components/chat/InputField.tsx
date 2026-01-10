import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { sanitizeInput } from "@/lib/sanitize";
import React from "react";

interface InputFieldProps {
  input: string;
  setInput: (value: string) => void;
  setIsTyping: (typing: boolean) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  loading: boolean;
  isFileLoading: boolean;
  darkMode: boolean;
  fileContext: { filename?: string } | null;
}

export const InputField = ({
  input,
  setInput,
  setIsTyping,
  onKeyDown,
  loading,
  isFileLoading,
  darkMode,
  fileContext,
}: InputFieldProps) => {
  return (
    <Input
      placeholder={fileContext ? "Ask about the file..." : "Ask anything or upload file"}
      value={input}
      onChange={(e) => {
        const value = e.target.value;
        const sanitized = sanitizeInput(value);
        setInput(sanitized);
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
  );
};
