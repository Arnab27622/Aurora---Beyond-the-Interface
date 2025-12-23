import { useState, useEffect, useCallback } from "react";
import { Message, ChatSession } from "@/lib/types";

interface UseChatSessionsReturn {
  chatSessions: ChatSession[];
  currentSessionId: string | null;
  messages: Message[];
  messageId: number;
  isLoading: boolean;
  hasHydrated: boolean;
  newChat: () => void;
  loadChat: (sessionId: string, onHistoryClose?: () => void) => void;
  deleteSession: (sessionId: string, e: React.MouseEvent) => void;
  clearChat: () => void;
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  setMessageId: (id: number | ((prev: number) => number)) => void;
  setCurrentSessionId: (id: string | null) => void;
}

export function useChatSessions(): UseChatSessionsReturn {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageId, setMessageId] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasHydrated, setHasHydrated] = useState(false);

  // Hydrate state from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem("chatSessions");
    const savedCurrentSession = localStorage.getItem("currentSessionId");
    const savedMessages = localStorage.getItem("chatMessages");

    let initialSessions: ChatSession[] = [];
    let initialMessages: Message[] = [];
    let initialSessionId: string | null = null;
    let nextMessageId = 1;

    try {
      if (savedSessions) {
        initialSessions = JSON.parse(savedSessions);
      }

      if (savedCurrentSession) {
        initialSessionId = savedCurrentSession;
        const session = initialSessions.find((s) => s.id === savedCurrentSession);
        if (session) {
          initialMessages = session.messages;
          nextMessageId = Math.max(...session.messages.map((m) => m.id), 0) + 1;
        }
      } else if (savedMessages) {
        initialMessages = JSON.parse(savedMessages);
        if (initialMessages.length > 0) {
          nextMessageId = Math.max(...initialMessages.map((m) => m.id), 0) + 1;
        }
      }
    } catch (e) {
      console.error("Error parsing localStorage data:", e);
    }

    setChatSessions(initialSessions);
    setMessages(initialMessages);
    setMessageId(nextMessageId);
    setCurrentSessionId(initialSessionId);
    setHasHydrated(true);
    setIsLoading(false);
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!hasHydrated) return;

    localStorage.setItem("chatSessions", JSON.stringify(chatSessions));

    if (currentSessionId) {
      localStorage.setItem("currentSessionId", currentSessionId);
      localStorage.removeItem("chatMessages");
    } else {
      localStorage.setItem("chatMessages", JSON.stringify(messages));
      localStorage.removeItem("currentSessionId");
    }
  }, [messages, chatSessions, currentSessionId, hasHydrated]);

  // Update existing session when messages change
  useEffect(() => {
    if (!hasHydrated || !currentSessionId) return;

    setChatSessions((prev) =>
      prev.map((session) =>
        session.id === currentSessionId
          ? { ...session, messages, timestamp: Date.now() }
          : session
      )
    );
  }, [messages, currentSessionId, hasHydrated]);

  // Create new chat session
  const newChat = useCallback(() => {
    if (!currentSessionId && messages.length > 0) {
      const title =
        messages[0].content.substring(0, 30) +
        (messages[0].content.length > 30 ? "..." : "");

      const newSession: ChatSession = {
        id: Date.now().toString(),
        title,
        timestamp: Date.now(),
        messages: [...messages],
      };

      setChatSessions((prev) => [newSession, ...prev]);
    }

    setMessages([]);
    setMessageId(1);
    setCurrentSessionId(null);
  }, [currentSessionId, messages]);

  // Load chat session
  const loadChat = useCallback(
    (sessionId: string, onHistoryClose?: () => void) => {
      const session = chatSessions.find((s) => s.id === sessionId);
      if (session) {
        setMessages(session.messages);
        setCurrentSessionId(sessionId);

        const maxId = Math.max(...session.messages.map((m) => m.id), 0);
        setMessageId(maxId + 1);

        if (window.innerWidth < 768 && onHistoryClose) {
          onHistoryClose();
        }
      }
    },
    [chatSessions]
  );

  // Delete chat session
  const deleteSession = useCallback(
    (sessionId: string, e: React.MouseEvent) => {
      e.stopPropagation();

      setChatSessions((prev) => prev.filter((session) => session.id !== sessionId));

      if (currentSessionId === sessionId) {
        setMessages([]);
        setMessageId(1);
        setCurrentSessionId(null);
      }
    },
    [currentSessionId]
  );

  // Clear current chat
  const clearChat = useCallback(() => {
    if (currentSessionId) {
      setChatSessions((prev) => prev.filter((s) => s.id !== currentSessionId));
    }
    setMessages([]);
    setMessageId(1);
    setCurrentSessionId(null);
  }, [currentSessionId]);

  return {
    chatSessions,
    currentSessionId,
    messages,
    messageId,
    isLoading,
    hasHydrated,
    newChat,
    loadChat,
    deleteSession,
    clearChat,
    setMessages,
    setMessageId,
    setCurrentSessionId,
  };
}
