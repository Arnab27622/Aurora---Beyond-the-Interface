import React from "react";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface CachedBadgeProps {
    darkMode: boolean;
}

export const CachedBadge: React.FC<CachedBadgeProps> = ({ darkMode }) => {
    return (
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
    );
};
