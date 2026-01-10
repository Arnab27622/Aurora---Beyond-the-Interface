import { Message, FileContextType } from "@/lib/types";
import { logError } from "@/lib/errorHandler";

export const useMessageActions = (
  sendGeminiStreamMessage: any,
  messages: Message[],
  setMessages: (fn: (prev: Message[]) => Message[]) => void,
  messageId: number,
  setMessageId: (fn: (id: number) => number) => void,
  isConfigured: boolean
) => {
  const sendMessage = async (
    input: string,
    fileContext: FileContextType | null,
    loading: boolean,
    setInput: (input: string) => void,
    setIsTyping: (typing: boolean) => void,
    setLoading: (loading: boolean) => void,
    setFileContext: (context: FileContextType | null) => void,
    currentSessionId: string | null,
    setCurrentSessionId: (id: string) => void,
    refreshSessions: () => Promise<void>
  ) => {
    if ((!input.trim() && !fileContext) || loading) return;

    if (!isConfigured) {
      const errorMessage: Message = {
        id: messageId + 1,
        role: "bot",
        content: "Please set your Google API key in the environment variables. Get a free key from Google AI Studio",
      };
      setMessages((prev) => [...prev, errorMessage]);
      setMessageId((id) => id + 2);
      return;
    }

    if (!currentSessionId) {
      try {
        const title = input.trim().substring(0, 30) + (input.trim().length > 30 ? "..." : "") || "New Chat";
        const response = await fetch("/api/chat-sessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            messages: [],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentSessionId(data.session.id);
          await refreshSessions();
        } else {
          console.error("Failed to create chat session");
          return;
        }
      } catch (error) {
        console.error("Error creating chat session:", error);
        return;
      }
    }

    const displayContent = input.trim();
    const userMessageId = messageId;
    const botMessageId = messageId + 1;

    const userMessage: Message = {
      id: userMessageId,
      role: "user",
      content: displayContent,
      file: fileContext || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    setMessageId((id) => id + 2);
    setLoading(true);

    try {
      let fullContent = "";
      let botMessageAdded = false;

      // Create empty placeholder bot message to show thinking indicator
      setMessages((prev) => [...prev, {
        id: botMessageId,
        role: "bot",
        content: "",
      }]);
      botMessageAdded = true;

      await sendGeminiStreamMessage(
        displayContent,
        [...messages, userMessage],
        fileContext,
        userMessageId,
        (chunk: string) => {
          fullContent += chunk;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessageId
                ? { ...msg, content: fullContent }
                : msg
            )
          );
        }
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId
            ? { ...msg, responses: [fullContent], currentResponseIndex: 0 }
            : msg
        )
      );
    } catch (err: any) {
      logError(err, 'Message sending');
      const errorMessage: Message = {
        id: botMessageId,
        role: "bot",
        content: `API Error: ${err.message || "Please check your API key and model configuration"}`,
      };
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId ? errorMessage : msg
        ) || [...prev, errorMessage]
      );
    } finally {
      setLoading(false);
      setIsTyping(false);
      setFileContext(null);
    }
  };

  const regenerateMessage = async (
    botMessageId: number,
    setRegeneratingMessageId: (id: number | null) => void,
    regeneratingMessageId: number | null,
    loading: boolean
  ) => {
    if (loading || regeneratingMessageId !== null) return;

    const botMessageIndex = messages.findIndex(msg => msg.id === botMessageId);
    if (botMessageIndex === -1 || messages[botMessageIndex].role !== 'bot') return;

    const userMessageIndex = botMessageIndex - 1;
    if (userMessageIndex < 0 || messages[userMessageIndex].role !== 'user') return;

    const userMessage = messages[userMessageIndex];
    const previousMessages = messages.slice(0, userMessageIndex);

    setRegeneratingMessageId(botMessageId);

    try {
      setMessages(prev => prev.map(msg =>
        msg.id === botMessageId
          ? { ...msg, content: "" }
          : msg
      ));

      let fullContent = "";

      await sendGeminiStreamMessage(
        userMessage.content,
        [...previousMessages, userMessage],
        userMessage.file || null,
        userMessage.id,
        (chunk: string) => {
          fullContent += chunk;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessageId
                ? { ...msg, content: fullContent }
                : msg
            )
          );
        }
      );

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === botMessageId) {
            const currentResponses = msg.responses || [msg.content];
            const newResponses = [...currentResponses, fullContent];
            const newIndex = newResponses.length - 1;

            return {
              ...msg,
              content: fullContent,
              responses: newResponses,
              currentResponseIndex: newIndex
            };
          }
          return msg;
        })
      );
    } catch (err: any) {
      logError(err, 'Message regeneration');
      const errorMessage = {
        id: botMessageId,
        role: "bot" as const,
        content: `API Error: ${err.message || "Please check your API key and model configuration"}`,
      };
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId ? errorMessage : msg
        )
      );
    } finally {
      setRegeneratingMessageId(null);
    }
  };

  const navigateResponse = (messageId: number, direction: 'prev' | 'next') => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.responses && msg.responses.length > 1) {
        const currentIndex = msg.currentResponseIndex || 0;
        let newIndex = currentIndex;

        if (direction === 'prev' && currentIndex > 0) {
          newIndex = currentIndex - 1;
        } else if (direction === 'next' && currentIndex < msg.responses.length - 1) {
          newIndex = currentIndex + 1;
        }

        return {
          ...msg,
          content: msg.responses[newIndex],
          currentResponseIndex: newIndex
        };
      }
      return msg;
    }));
  };

  return {
    sendMessage,
    regenerateMessage,
    navigateResponse,
  };
};
