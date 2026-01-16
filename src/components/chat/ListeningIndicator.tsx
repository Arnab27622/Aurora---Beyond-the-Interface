/**
 * ListeningIndicator Component
 * 
 * Shows a fixed position indicator while voice input is being recorded.
 * Displays "Listening..." text with animated pulsing dot animation.
 * Positioned at bottom-center of screen with theme-aware colors.
 */

import { cn } from "@/lib/utils";

interface ListeningIndicatorProps {
  darkMode: boolean;
}

export function ListeningIndicator({ darkMode }: ListeningIndicatorProps) {
  return (
    <div
      className={cn(
        "fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50",
        "text-xs py-1 px-2 rounded-full flex items-center",
        darkMode ? "bg-red-700 text-white" : "bg-red-400 text-white"
      )}
    >
      <span className="flex h-2 w-2 mr-2">
        <span className="animate-ping absolute h-2 w-2 rounded-full bg-white opacity-75"></span>
        <span className="relative h-2 w-2 rounded-full bg-white"></span>
      </span>
      Listening...
    </div>
  );
}
