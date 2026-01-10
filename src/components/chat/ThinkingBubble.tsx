import React from "react";
import { cn } from "@/lib/utils";

interface ThinkingBubbleProps {
    darkMode: boolean;
}

export const ThinkingBubble: React.FC<ThinkingBubbleProps> = ({ darkMode }) => {
    return (
        <div
            className={cn(
                "py-2 px-4 rounded-md text-base w-fit animate-pulse",
                darkMode ? "bg-gray-600 text-white" : "bg-gray-300 text-black"
            )}
        >
            Thinking...
        </div>
    );
};
