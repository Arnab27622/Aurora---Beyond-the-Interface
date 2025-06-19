import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
    text: string;
    darkMode: boolean;
}

export const CopyButton = ({ text, darkMode }: CopyButtonProps) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className={cn(
                "absolute top-2 right-2 p-1.5 rounded-md transition-all",
                darkMode
                    ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300",
                copied
                    ? darkMode
                        ? "bg-green-700 text-white"
                        : "bg-green-200 text-green-800"
                    : ""
            )}
            aria-label={copied ? "Copied!" : "Copy to clipboard"}
        >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
    );
};