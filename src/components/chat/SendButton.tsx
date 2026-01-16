/**
 * SendButton Component
 * 
 * Submit button for sending chat messages.
 * Features:
 * - Disabled when message is empty and no file context exists
 * - Loading spinner animation while message is being sent
 * - Prevents multiple submissions during processing
 * - Accessible with semantic labels
 */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Send, Loader2 } from "lucide-react";
import React from "react";

interface SendButtonProps {
  loading: boolean;
  isFileLoading: boolean;
  input: string;
  fileContext: { filename?: string } | null;
  darkMode: boolean;
}

export const SendButton = ({
  loading,
  isFileLoading,
  input,
  fileContext,
  darkMode,
}: SendButtonProps) => {
  return (
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
  );
};
