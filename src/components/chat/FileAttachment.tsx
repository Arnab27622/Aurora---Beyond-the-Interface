import React from "react";
import { File, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileContextType } from "@/lib/types";

interface FileAttachmentProps {
    file: FileContextType;
    darkMode: boolean;
    onFileClick: (file: FileContextType) => void;
}

export const FileAttachment: React.FC<FileAttachmentProps> = ({
    file,
    darkMode,
    onFileClick,
}) => {
    if (!file) return null;

    return (
        <div className="mb-2">
            <button
                onClick={() => onFileClick(file)}
                className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer transition-colors",
                    darkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                )}
                title="Click to preview file"
            >
                {file.type === "image" ? (
                    <ImageIcon className="h-4 w-4" />
                ) : (
                    <File className="h-4 w-4" />
                )}
                <span className="truncate max-w-[200px]">{file.filename}</span>
            </button>
        </div>
    );
};
