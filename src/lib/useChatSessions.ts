import { useState, useEffect, useCallback } from "react";
import { Message, ChatSession } from "@/lib/types";

interface UseChatSessionsReturn {
  chatSessions: ChatSession[];
  currentSessionId: string | null;
  messages: Message[];
  messageId: number;
  isLoading: boolean;
  hasHydrated: boolean;
  newChat: () => Promise<void>;
  loadChat: (sessionId: string, onHistoryClose?: () => void) => Promise<void>;
  deleteSession: (sessionId: string, e: React.MouseEvent) => Promise<void>;
  clearChat: () => Promise<void>;
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  setMessageId: (id: number | ((prev: number) => number)) => void;
  setCurrentSessionId: (id: string | null) => void;
}

export function useChatSessions(userId?: string): UseChatSessionsReturn {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageId, setMessageId] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasHydrated, setHasHydrated] = useState(false);

  // Load chat sessions from database when userId changes
  useEffect(() => {
    if (!userId) {
      setChatSessions([]);
      setMessages([]);
      setMessageId(1);
      setCurrentSessionId(null);
      setHasHydrated(true);
      setIsLoading(false);
      return;
    }

    const loadChatSessions = async () => {
      try {
        const response = await fetch("/api/chat-sessions");
        if (!response.ok) {
          throw new Error("Failed to fetch chat sessions");
        }

        const data = await response.json();
        setChatSessions(data.sessions || []);
      } catch (error) {
        console.error("Error loading chat sessions:", error);
        setChatSessions([]);
      } finally {
        setHasHydrated(true);
        setIsLoading(false);
      }
    };

    loadChatSessions();
  }, [userId]);

  // Save current session to database when messages change
  useEffect(() => {
    if (!hasHydrated || !currentSessionId || !userId || messages.length === 0) return;

    const saveSession = async () => {
      try {
        const title = messages[0]?.content.substring(0, 30) + (messages[0]?.content.length > 30 ? "..." : "") || "New Chat";

        const response = await fetch("/api/chat-sessions", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId: currentSessionId,
            messages,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save chat session");
        }

        // Update the session in local state
        setChatSessions(prev =>
          prev.map(session =>
            session.id === currentSessionId
              ? { ...session, messages, timestamp: Date.now() }
              : session
          )
        );
      } catch (error) {
        console.error("Error saving chat session:", error);
      }
    };

    const timeoutId = setTimeout(saveSession, 500); // Debounce saves
    return () => clearTimeout(timeoutId);
  }, [messages, currentSessionId, userId, hasHydrated]);

  // Create new chat session
  const newChat = useCallback(async (): Promise<void> => {
    if (!userId) return;

    // Save current session if it has messages
    if (!currentSessionId && messages.length > 0) {
      try {
        const title = messages[0].content.substring(0, 30) +
          (messages[0].content.length > 30 ? "..." : "");

        const response = await fetch("/api/chat-sessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            messages: [...messages],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setChatSessions(prev => [data.session, ...prev]);
        }
      } catch (error) {
        console.error("Error saving new session:", error);
      }
    }

    setMessages([]);
    setMessageId(1);
    setCurrentSessionId(null);
  }, [currentSessionId, messages, userId]);

  // Load chat session
  const loadChat = useCallback(
    async (sessionId: string, onHistoryClose?: () => void) => {
      if (!userId) return;

      try {
        // Find the session in the current chatSessions state
        const session = chatSessions.find(s => s.id === sessionId);

        if (session) {
          setMessages(session.messages);
          setCurrentSessionId(sessionId);

          const maxId = Math.max(...session.messages.map((m: Message) => m.id), 0);
          setMessageId(maxId + 1);

          if (window.innerWidth < 768 && onHistoryClose) {
            onHistoryClose();
          }
        }
      } catch (error) {
        console.error("Error loading chat session:", error);
      }
    },
    [userId, chatSessions]
  );

  // Delete chat session
  const deleteSession = useCallback(
    async (sessionId: string, e: React.MouseEvent) => {
      if (!userId) return;

      e.stopPropagation();

      try {
        const response = await fetch(`/api/chat-sessions?sessionId=${sessionId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setChatSessions(prev => prev.filter(session => session.id !== sessionId));

          if (currentSessionId === sessionId) {
            setMessages([]);
            setMessageId(1);
            setCurrentSessionId(null);
          }
        }
      } catch (error) {
        console.error("Error deleting chat session:", error);
      }
    },
    [currentSessionId, userId]
  );

  // Clear current chat
  const clearChat = useCallback(async () => {
    if (!userId || !currentSessionId) return;

    try {
      const response = await fetch(`/api/chat-sessions?sessionId=${currentSessionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setChatSessions(prev => prev.filter(s => s.id !== currentSessionId));
        setMessages([]);
        setMessageId(1);
        setCurrentSessionId(null);
      }
    } catch (error) {
      console.error("Error clearing chat:", error);
    }
  }, [currentSessionId, userId]);

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
