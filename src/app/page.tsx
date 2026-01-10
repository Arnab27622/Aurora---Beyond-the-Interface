"use client";

import { useEffect, useState } from "react";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatHistory } from "@/components/chat/ChatHistory";
import { ChatInput } from "@/components/chat/ChatInput";
import { FileContextIndicator } from "@/components/chat/FileContextIndicator";
import { MessageList } from "@/components/chat/MessageList";
import { ScrollToBottomButton } from "@/components/chat/ScrollToBottomButton";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { ListeningIndicator } from "@/components/chat/ListeningIndicator";
import { ChatContainer } from "@/components/chat/ChatContainer";

import { markdownComponents } from "@/components/chat/markdown-components";
import { cn } from "@/lib/utils";
import { useGemini } from "@/lib/useGemini";
import { useChatSessions } from "@/lib/useChatSessions";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { ComponentErrorBoundary } from "@/components/errors/ComponentErrorBoundary";
import { useTheme } from "@/components/ThemeProvider";
import { useChatState } from "@/lib/hooks/useChatState";
import { useScrollManagement } from "@/lib/hooks/useScrollManagement";
import { useFileHandling } from "@/lib/hooks/useFileHandling";
import { useMessageActions } from "@/lib/hooks/useMessageActions";

declare global {
    interface Window {
        pdfjsLib?: any;
    }
}

export default function ChatbotPage() {
    const [isMounted, setIsMounted] = useState(false);
    const { darkMode, setDarkMode } = useTheme();

    // Use custom hooks for state management
    const chatState = useChatState();
    
    const { data: session, status } = useSession();
    const router = useRouter();

    const { streamMessage: sendGeminiStreamMessage, isConfigured } = useGemini();
    const {
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
        refreshSessions,
        setMessages,
        setMessageId,
        setCurrentSessionId,
    } = useChatSessions(session?.user?.id);

    // Now we can use messages.length with scroll management
    const {
        scrollContainerRef,
        messagesEndRef,
        isAtBottom: scrollIsAtBottom,
        hasScrollbar: scrollHasScrollbar,
        scrollToBottom,
    } = useScrollManagement(isMounted, messages.length);

    const { isListening, speechSupported, toggleSpeechRecognition } = useSpeechRecognition(
        chatState.setInput,
        chatState.setIsTyping
    );

    const { fileInputRef, imageInputRef, handleFileUpload, handleImageUpload, clearFileContext } = useFileHandling(
        chatState.setFileContext,
        chatState.setIsFileLoading
    );

    const { sendMessage, regenerateMessage, navigateResponse } = useMessageActions(
        sendGeminiStreamMessage,
        messages,
        setMessages,
        messageId,
        setMessageId,
        isConfigured
    );

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Authentication check
    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.push('/auth/signin');
        }
    }, [session, status, router]);

    // Wrap hook functions to also clear UI state
    const handleNewChat = async () => {
        chatState.setIsLoadingChat(true);
        await newChat();
        chatState.setShowHistory(false);
        chatState.setInput("");
        chatState.setIsTyping(false);
        chatState.setFileContext(null);
        chatState.setIsLoadingChat(false);
    };

    const handleLoadChat = async (sessionId: string) => {
        const scrollContainer = messagesEndRef.current?.parentElement?.parentElement;
        const savedScrollTop = scrollContainer?.scrollTop || 0;

        chatState.setIsLoadingChat(true);
        await loadChat(sessionId, () => chatState.setShowHistory(false));
        chatState.setInput("");
        chatState.setIsTyping(false);
        chatState.setFileContext(null);

        setTimeout(() => {
            if (scrollContainer) {
                scrollContainer.scrollTop = savedScrollTop;
            }
            chatState.setIsLoadingChat(false);
        }, 100);
    };

    const handleClearChat = async () => {
        await clearChat();
        chatState.setShowHistory(false);
        chatState.setInput("");
        chatState.setIsTyping(false);
        chatState.setFileContext(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(
                chatState.input,
                chatState.fileContext,
                chatState.loading,
                chatState.setInput,
                chatState.setIsTyping,
                chatState.setLoading,
                chatState.setFileContext,
                currentSessionId,
                setCurrentSessionId,
                refreshSessions
            );
        }
    };

    const handleSendMessage = () => {
        sendMessage(
            chatState.input,
            chatState.fileContext,
            chatState.loading,
            chatState.setInput,
            chatState.setIsTyping,
            chatState.setLoading,
            chatState.setFileContext,
            currentSessionId,
            setCurrentSessionId,
            refreshSessions
        );
    };

    const handleRegenerate = (messageId: number) => {
        regenerateMessage(
            messageId,
            chatState.setRegeneratingMessageId,
            chatState.regeneratingMessageId,
            chatState.loading
        );
    };

    if (!isMounted || isLoading || status === 'loading') {
        return (
            <div
                className={cn(
                    "flex items-center justify-center h-screen",
                    darkMode ? "bg-[#1e1e1e]" : "bg-white"
                )}
            >
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <ComponentErrorBoundary componentName="ChatPage">
            <ChatContainer darkMode={darkMode}>
                <ComponentErrorBoundary componentName="ChatHeader">
                    <ChatHeader
                        darkMode={darkMode}
                        setDarkMode={setDarkMode}
                        clearChat={handleClearChat}
                        showHistory={chatState.showHistory}
                        setShowHistory={chatState.setShowHistory}
                    />
                </ComponentErrorBoundary>

                <div className="flex flex-1 overflow-hidden relative">
                    <ComponentErrorBoundary componentName="ChatHistory">
                        <ChatHistory
                            chatSessions={chatSessions}
                            currentSessionId={currentSessionId}
                            darkMode={darkMode}
                            showHistory={chatState.showHistory}
                            setShowHistory={chatState.setShowHistory}
                            newChat={handleNewChat}
                            loadChat={handleLoadChat}
                            deleteSession={deleteSession}
                            userName={session?.user?.name}
                        />
                    </ComponentErrorBoundary>

                    <div className="flex-1 flex flex-col relative">
                        <div className="flex-grow overflow-y-auto py-4 sm:py-6 relative" ref={scrollContainerRef}>
                            <MessageList
                                messages={messages}
                                loading={chatState.loading}
                                darkMode={darkMode}
                                markdownComponents={markdownComponents(darkMode)}
                                onRegenerate={handleRegenerate}
                                regeneratingMessageId={chatState.regeneratingMessageId}
                                onNavigateResponse={navigateResponse}
                                messagesEndRef={messagesEndRef}
                            />
                        </div>

                        <ScrollToBottomButton
                            onClick={scrollToBottom}
                            darkMode={darkMode}
                            show={messages.length > 0 && scrollHasScrollbar && !scrollIsAtBottom}
                        />

                        {chatState.isTyping && <TypingIndicator darkMode={darkMode} />}

                        {isListening && <ListeningIndicator darkMode={darkMode} />}

                        <ComponentErrorBoundary componentName="FileContextIndicator">
                            <FileContextIndicator
                                fileContext={chatState.fileContext}
                                clearFileContext={clearFileContext}
                                darkMode={darkMode}
                            />
                        </ComponentErrorBoundary>

                        <ComponentErrorBoundary componentName="ChatInput">
                            <ChatInput
                                input={chatState.input}
                                setInput={chatState.setInput}
                                setIsTyping={chatState.setIsTyping}
                                sendMessage={handleSendMessage}
                                loading={chatState.loading}
                                darkMode={darkMode}
                                handleFileUpload={handleFileUpload}
                                handleImageUpload={handleImageUpload}
                                isFileLoading={chatState.isFileLoading}
                                fileContext={chatState.fileContext}
                                clearFileContext={clearFileContext}
                                fileInputRef={fileInputRef}
                                imageInputRef={imageInputRef}
                                onKeyDown={handleKeyDown}
                                isListening={isListening}
                                toggleSpeechRecognition={toggleSpeechRecognition}
                                speechSupported={speechSupported}
                            />
                        </ComponentErrorBoundary>
                    </div>
                </div>
            </ChatContainer>
        </ComponentErrorBoundary>
    );
}