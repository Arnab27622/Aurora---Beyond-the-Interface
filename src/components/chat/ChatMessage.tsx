import React, { useState } from "react";
import { Message, FileContextType } from "@/lib/types";
import { Components } from "react-markdown";
import { ThinkingBubble } from "./ThinkingBubble";
import { MessageBubble } from "./MessageBubble";
import { FileAttachment } from "./FileAttachment";
import { CachedBadge } from "./CachedBadge";
import { ResponseNavigator } from "./ResponseNavigator";
import { RegenerateButton } from "./RegenerateButton";
import { FilePreviewModal } from "./FilePreviewModal";
import { downloadFile } from "@/lib/fileDownload";

interface ChatMessageProps {
    message: Message;
    darkMode: boolean;
    markdownComponents: Components;
    onRegenerate?: (messageId: number) => void;
    isRegenerating?: boolean;
    onNavigateResponse?: (messageId: number, direction: 'prev' | 'next') => void;
}

export const ChatMessage = ({
    message,
    darkMode,
    markdownComponents,
    onRegenerate,
    isRegenerating,
    onNavigateResponse
}: ChatMessageProps) => {
    const [previewFile, setPreviewFile] = useState<FileContextType | null>(null);

    // Show thinking bubble if regenerating or bot message content is empty
    if (isRegenerating || (message.role === "bot" && !message.content)) {
        return <ThinkingBubble darkMode={darkMode} />;
    }

    const handleFileClick = (file: FileContextType | null) => {
        if (!file) return;
        if (file.type === "image") {
            setPreviewFile(file);
        } else {
            downloadFile(file);
        }
    };

    const handleNavigateResponse = (direction: 'prev' | 'next') => {
        onNavigateResponse?.(message.id, direction);
    };

    const closePreview = () => {
        setPreviewFile(null);
    };

    return (
        <>
            <MessageBubble
                content={message.content}
                role={message.role}
                darkMode={darkMode}
                markdownComponents={markdownComponents}
                isCached={message.isCached}
                actions={
                    message.role === "bot" ? (
                        <>
                            {message.responses && message.responses.length > 1 && (
                                <ResponseNavigator
                                    currentIndex={message.currentResponseIndex}
                                    totalResponses={message.responses.length}
                                    onNavigate={handleNavigateResponse}
                                    darkMode={darkMode}
                                />
                            )}

                            {onRegenerate && (
                                <RegenerateButton
                                    onRegenerate={onRegenerate}
                                    messageId={message.id}
                                    isRegenerating={isRegenerating || false}
                                    darkMode={darkMode}
                                />
                            )}
                        </>
                    ) : undefined
                }
            >
                {/* File attachment for user messages */}
                {message.role === "user" && message.file && (
                    <FileAttachment
                        file={message.file}
                        darkMode={darkMode}
                        onFileClick={handleFileClick}
                    />
                )}
            </MessageBubble>

            {/* Cached badge */}
            {message.isCached && message.role === "bot" && (
                <CachedBadge darkMode={darkMode} />
            )}

            {/* File Preview Modal */}
            <FilePreviewModal
                file={previewFile}
                isOpen={!!previewFile}
                onClose={closePreview}
                darkMode={darkMode}
            />
        </>
    );
};
