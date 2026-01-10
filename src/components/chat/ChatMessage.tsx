import React, { useState } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import { cn } from "@/lib/utils";
import { Message, FileContextType } from "@/lib/types";
import { Zap, RotateCcw, ChevronLeft, ChevronRight, File, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { FilePreviewModal } from "./FilePreviewModal";

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

    // Don't render the message if it's being regenerated (to avoid showing empty block)
    if (isRegenerating) {
        return null;
    }

    const downloadFile = (file: FileContextType | null) => {
        if (!file) return;
        if (file.type === "image") {
            // For images, create a downloadable link
            const link = document.createElement("a");
            link.href = `data:image/*;base64,${file.data}`;
            link.download = file.filename;
            link.click();
        } else {
            // For other files, decode base64 and create blob with appropriate MIME type
            try {
                const binaryString = atob(file.data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                // Determine MIME type based on file type
                let mimeType = "application/octet-stream"; // default
                switch (file.type) {
                    case "pdf":
                        mimeType = "application/pdf";
                        break;
                    case "txt":
                        mimeType = "text/plain";
                        break;
                    case "docx":
                        mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                        break;
                    case "xlsx":
                        mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                        break;
                    case "csv":
                        mimeType = "text/csv";
                        break;
                    case "pptx":
                        mimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
                        break;
                }

                const blob = new Blob([bytes], { type: mimeType });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = file.filename;
                link.click();
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error("Failed to download file:", error);
                // Fallback: create text file with error message
                const blob = new Blob([`Failed to download ${file.filename}: ${error}`], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = file.filename;
                link.click();
                URL.revokeObjectURL(url);
            }
        }
    };

    const handleFileClick = (file: FileContextType | null) => {
        if (!file) return;
        if (file.type === "image") {
            setPreviewFile(file);
        } else {
            downloadFile(file);
        }
    };

    const closePreview = () => {
        setPreviewFile(null);
    };

    return (
        <>
            <div
                key={message.id}
                className={cn(
                    "whitespace-pre-wrap py-2.5 pl-2 pr-12 sm:py-3 sm:pl-4 mb-2.5 sm:mb-4 rounded-md w-fit break-words max-w-[90%]",
                    "text-sm sm:text-base relative",
                    message.role === "user"
                        ? darkMode
                            ? "bg-[#343541] text-white self-end ml-auto"
                            : "bg-[#e0e0e0] text-black self-end ml-auto"
                        : darkMode
                            ? "bg-[#2a2a2a] text-white self-start mr-auto"
                            : "bg-[#f0f0f0] text-black self-start mr-auto"
                )}
            >
                {/* File attachment for user messages */}
                {message.role === "user" && message.file && (
                    <div className="mb-2">
                        <button
                            onClick={() => handleFileClick(message.file!)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer transition-colors",
                                darkMode
                                    ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                            )}
                            title="Click to preview file"
                        >
                            {message.file.type === "image" ? (
                                <ImageIcon className="h-4 w-4" />
                            ) : (
                                <File className="h-4 w-4" />
                            )}
                            <span className="truncate max-w-[200px]">{message.file.filename}</span>
                        </button>
                    </div>
                )}

                <CopyButton text={message.content} darkMode={darkMode} position={message.role === "bot" ? "bottom" : "top"} />
                <ReactMarkdown components={markdownComponents}>
                    {message.content}
                </ReactMarkdown>
                {message.isCached && message.role === "bot" && (
                    <div
                        className={cn(
                            "text-xs mt-2 flex items-center gap-1",
                            darkMode ? "text-gray-400" : "text-gray-600"
                        )}
                        title="This response was retrieved from cache"
                    >
                        <Zap className="h-3 w-3" />
                        Cached response
                    </div>
                )}
                {message.role === "bot" && (
                    <div className="mt-2 flex flex-col gap-2">
                        {/* Response Navigation */}
                        {message.responses && message.responses.length > 1 && (
                            <div className="flex items-center justify-between gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onNavigateResponse?.(message.id, 'prev')}
                                    disabled={message.currentResponseIndex === 0}
                                    className={cn(
                                        "text-xs h-6 px-1 cursor-pointer",
                                        darkMode ? "text-gray-400 hover:text-black" : "text-gray-600 hover:text-gray-800"
                                    )}
                                    title="Previous response"
                                >
                                    <ChevronLeft className="h-3 w-3" />
                                </Button>

                                <span className={cn(
                                    "text-xs",
                                    darkMode ? "text-gray-400" : "text-gray-600"
                                )}>
                                    {message.currentResponseIndex !== undefined ? message.currentResponseIndex + 1 : 1} / {message.responses.length}
                                </span>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onNavigateResponse?.(message.id, 'next')}
                                    disabled={message.currentResponseIndex === (message.responses.length - 1)}
                                    className={cn(
                                        "text-xs h-6 px-1 cursor-pointer",
                                        darkMode ? "text-gray-400 hover:text-black" : "text-gray-600 hover:text-gray-800"
                                    )}
                                    title="Next response"
                                >
                                    <ChevronRight className="h-3 w-3" />
                                </Button>
                            </div>
                        )}

                        {/* Regenerate Button */}
                        {onRegenerate && (
                            <div className="flex justify-start">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onRegenerate(message.id)}
                                    disabled={isRegenerating}
                                    className={cn(
                                        "text-xs h-6 px-2 cursor-pointer",
                                        darkMode ? "text-gray-400 hover:text-black" : "text-gray-600 hover:text-gray-800"
                                    )}
                                    title="Regenerate response"
                                >
                                    <RotateCcw className="h-3 w-3 mr-1" />
                                    Regenerate
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

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
