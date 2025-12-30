import { File, ImageIcon, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileContextType } from "@/lib/types";

interface FileContextIndicatorProps {
    fileContext: FileContextType;
    clearFileContext: () => void;
    darkMode: boolean;
}

export const FileContextIndicator = ({
    fileContext,
    clearFileContext,
    darkMode,
}: FileContextIndicatorProps) => {
    // Truncate filename to prevent input field from becoming too long
    const truncatedFilename = fileContext?.filename
        ? fileContext.filename.length > 20
            ? fileContext.filename.substring(0, 20) + "..."
            : fileContext.filename
        : "";

    return (
        fileContext && (
            <div className={cn(
                "max-w-3xl mx-auto w-full px-4 pb-2 flex items-center",
                darkMode ? "text-gray-300" : "text-gray-700"
            )}>
                {fileContext.type === "pdf" ? (
                    <File className="h-4 w-4 mr-2" />
                ) : (
                    <ImageIcon className="h-4 w-4 mr-2" />
                )}
                <span className="text-xs mr-2">{truncatedFilename}</span>
                <button
                    onClick={clearFileContext}
                    className={cn(
                        "p-1 rounded-full cursor-pointer",
                        darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                    )}
                >
                    <XCircle className="h-4 w-4" />
                </button>
            </div>
        )
    );
};
