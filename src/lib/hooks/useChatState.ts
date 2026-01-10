import { useState } from "react";
import { FileContextType } from "@/lib/types";

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
