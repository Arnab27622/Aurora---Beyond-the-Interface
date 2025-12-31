import React from "react";
import { X, File, ImageIcon, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileContextType } from "@/lib/types";
import Image from "next/image";

interface FilePreviewModalProps {
    file: FileContextType;
    isOpen: boolean;
    onClose: () => void;
    darkMode: boolean;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
    file,
    isOpen,
    onClose,
    darkMode,
}) => {
    if (!isOpen || !file) return null;

    const handleDownload = () => {
        if (file.type === "image") {
            // For images, create a downloadable link
            const link = document.createElement("a");
            link.href = `data:image/*;base64,${file.data}`;
            link.download = file.filename;
            link.click();
        } else {
            // For documents, create a text file download
            const blob = new Blob([file.data], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = file.filename;
            link.click();
            URL.revokeObjectURL(url);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div
                className={cn(
                    "relative max-w-4xl max-h-[90vh] w-full mx-4 rounded-lg shadow-lg overflow-hidden",
                    darkMode ? "bg-[#1e1e1e] text-white" : "bg-white text-black"
                )}
            >
                {/* Header */}
                <div className={cn(
                    "flex items-center justify-between p-4 border-b",
                    darkMode ? "border-gray-700" : "border-gray-200"
                )}>
                    <div className="flex items-center gap-2">
                        {file.type === "image" ? (
                            <ImageIcon className="h-5 w-5" />
                        ) : (
                            <File className="h-5 w-5" />
                        )}
                        <span className="font-medium truncate">{file.filename}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownload}
                            className={cn(
                                "p-2 rounded-full hover:bg-gray-100 transition-colors",
                                darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                            )}
                            title="Download file"
                        >
                            <Download className="h-4 w-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className={cn(
                                "p-2 rounded-full hover:bg-gray-100 transition-colors",
                                darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                            )}
                            title="Close preview"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 overflow-auto max-h-[calc(90vh-120px)]">
                    {file.type === "image" ? (
                        <div className="flex justify-center relative w-full h-96">
                            <Image
                                src={`data:image/*;base64,${file.data}`}
                                alt={file.filename}
                                fill
                                className="object-contain" />
                        </div>
                    ) : (
                        <div className={cn(
                            "whitespace-pre-wrap font-mono text-sm p-4 rounded border",
                            darkMode ? "bg-gray-800 border-gray-600" : "bg-gray-50 border-gray-200"
                        )}>
                            {file.data}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
