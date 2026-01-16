/**
 * RegenerateButton Component
 * 
 * Allows users to regenerate the current bot response.
 * Shows loading state while regeneration is in progress.
 * Disabled when already regenerating.
 */

import React from "react";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface RegenerateButtonProps {
    onRegenerate: (messageId: number) => void;
    messageId: number;
    isRegenerating: boolean;
    darkMode: boolean;
}

export const RegenerateButton: React.FC<RegenerateButtonProps> = ({
    onRegenerate,
    messageId,
    isRegenerating,
    darkMode,
}) => {
    return (
        <div className="flex justify-start">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => onRegenerate(messageId)}
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
    );
};
