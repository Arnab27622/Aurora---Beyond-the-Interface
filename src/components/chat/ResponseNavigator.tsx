import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ResponseNavigatorProps {
    currentIndex: number | undefined;
    totalResponses: number;
    onNavigate: (direction: 'prev' | 'next') => void;
    darkMode: boolean;
}

export const ResponseNavigator: React.FC<ResponseNavigatorProps> = ({
    currentIndex,
    totalResponses,
    onNavigate,
    darkMode,
}) => {
    if (totalResponses <= 1) return null;

    const displayIndex = currentIndex !== undefined ? currentIndex + 1 : 1;

    return (
        <div className="flex items-center justify-between gap-2">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('prev')}
                disabled={currentIndex === 0}
                className={cn(
                    "text-xs h-6 px-1 cursor-pointer",
                    darkMode ? "text-gray-400 hover:text-black" : "text-gray-600 hover:text-gray-800"
                )}
                title="Previous response"
            >
                <ChevronLeft className="h-3 w-3" />
            </Button>

            <span
                className={cn(
                    "text-xs",
                    darkMode ? "text-gray-400" : "text-gray-600"
                )}
            >
                {displayIndex} / {totalResponses}
            </span>

            <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('next')}
                disabled={currentIndex === totalResponses - 1}
                className={cn(
                    "text-xs h-6 px-1 cursor-pointer",
                    darkMode ? "text-gray-400 hover:text-black" : "text-gray-600 hover:text-gray-800"
                )}
                title="Next response"
            >
                <ChevronRight className="h-3 w-3" />
            </Button>
        </div>
    );
};
