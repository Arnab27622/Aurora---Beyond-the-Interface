/**
 * Chat State Management Hook
 * 
 * Centralized state for all chat UI interactions:
 * - User input and typing indicators
 * - File attachment context
 * - Loading and history panel states
 * - Message regeneration tracking
 * 
 * Features:
 * - Typing detection for speech recognition
 * - File loading progress
 * - Message regeneration state tracking
 * - Chat history sidebar toggle
 * - Consolidated state for easy prop passing
 */

import { useState } from "react";
import { FileContextType } from "@/lib/types";

/**
 * Chat State Management Hook
 * 
 * Centralized state for all chat UI interactions:
 * - User input and typing indicators
 * - File attachment context
 * - Loading and history panel states
 * - Message regeneration tracking
 * - Consolidated state for easy prop passing
 * 
 * @returns Object containing all chat state variables and setters
 */
export const useChatState = () => {
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [fileContext, setFileContext] = useState<FileContextType>(null);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [regeneratingMessageId, setRegeneratingMessageId] = useState<number | null>(null);
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  return {
    input,
    setInput,
    isTyping,
    setIsTyping,
    isFileLoading,
    setIsFileLoading,
    fileContext,
    setFileContext,
    loading,
    setLoading,
    showHistory,
    setShowHistory,
    regeneratingMessageId,
    setRegeneratingMessageId,
    isLoadingChat,
    setIsLoadingChat,
  };
};
