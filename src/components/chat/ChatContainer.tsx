/**
 * ChatContainer Component
 * 
 * Main wrapper component for the chat interface.
 * Provides a full-screen flex container with theme-aware styling.
 * Handles dark mode background and text colors.
 */

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ChatContainerProps {
  darkMode: boolean;
  children: ReactNode;
}

export function ChatContainer({ darkMode, children }: ChatContainerProps) {
  return (
    <div
      className={cn(
        "flex flex-col h-screen",
        darkMode ? "bg-[#1e1e1e] text-white" : "bg-white text-black"
      )}
    >
      {children}
    </div>
  );
}
