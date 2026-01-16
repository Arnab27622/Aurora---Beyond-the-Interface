/**
 * CopyButton Component
 * 
 * Button for copying text to clipboard with visual feedback.
 * Features:
 * - Copy-to-clipboard functionality using Clipboard API
 * - Visual feedback with check icon on successful copy
 * - Auto-revert to copy icon after 2 seconds
 * - Theme-aware styling (light/dark mode)
 * - Positioned at top or bottom of content
 * - Accessible with proper aria labels
 */

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
    text: string;
    darkMode: boolean;
    position?: 'top' | 'bottom';
}

export const CopyButton = ({ text, darkMode, position }: CopyButtonProps) => {
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
                "absolute right-2 p-1.5 rounded-md transition-all cursor-pointer",
                position === 'top' ? "top-1.5 sm:top-2" : "bottom-2 sm:bottom-3 sm:right-3.5",
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