import ReactMarkdown, { Components } from "react-markdown";
import { cn } from "@/lib/utils";
import { Message } from "@/lib/types";

interface ChatMessageProps {
    message: Message;
    darkMode: boolean;
    markdownComponents: Components;
}

export const ChatMessage = ({
    message,
    darkMode,
    markdownComponents
}: ChatMessageProps) => (
    <div
        key={message.id}
        className={cn(
            "whitespace-pre-wrap py-3 px-4 mb-4 rounded-md w-fit break-words max-w-[90%]",
            "text-base",
            message.role === "user"
                ? darkMode
                    ? "bg-[#343541] text-white self-end ml-auto"
                    : "bg-[#e0e0e0] text-black self-end ml-auto"
                : darkMode
                    ? "bg-[#2a2a2a] text-white self-start mr-auto"
                    : "bg-[#f0f0f0] text-black self-start mr-auto"
        )}
    >
        <ReactMarkdown components={markdownComponents}>
            {message.content}
        </ReactMarkdown>
    </div>
);