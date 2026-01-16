/**
 * MessageBubble Component
 * 
 * Core component for rendering a single chat message.
 * Features:
 * - Markdown content rendering
 * - Copy button for message content
 * - Optional children elements (file attachments, etc.)
 * - Action buttons section for bot messages (regenerate, navigate)
 * - Theme-aware styling for user/bot messages
 */

import React from "react";
import ReactMarkdown, { Components } from "react-markdown";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/ui/copy-button";

interface MessageBubbleProps {
    content: string;
    role: "user" | "bot";
    darkMode: boolean;
    markdownComponents: Components;
    isCached?: boolean;
    children?: React.ReactNode;
    actions?: React.ReactNode;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
    content,
    role,
    darkMode,
    markdownComponents,
    isCached,
    children,
    actions,
}) => {
    return (
        <div
            className={cn(
                "whitespace-pre-wrap py-2.5 pl-2 pr-12 sm:py-3 sm:pl-4 mb-2.5 sm:mb-4 rounded-md w-fit break-words max-w-[90%]",
                "text-sm sm:text-base relative",
                role === "user"
                    ? darkMode
                        ? "bg-[#343541] text-white self-end ml-auto"
                        : "bg-[#e0e0e0] text-black self-end ml-auto"
                    : darkMode
                        ? "bg-[#2a2a2a] text-white self-start mr-auto"
                        : "bg-[#f0f0f0] text-black self-start mr-auto"
            )}
        >
            {children}
            <CopyButton text={content} darkMode={darkMode} position={role === "bot" ? "bottom" : "top"} />
            <ReactMarkdown components={markdownComponents}>
                {content}
            </ReactMarkdown>
            {isCached && role === "bot" && (
                // Cached badge is rendered separately but could be included here if needed
                <></>
            )}
            {actions && role === "bot" && (
                <div className="mt-2 flex flex-col gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
};
