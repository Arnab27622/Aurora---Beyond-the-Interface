import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  darkMode: boolean;
}

export function TypingIndicator({ darkMode }: TypingIndicatorProps) {
  return (
    <div
      className={cn(
        "absolute bottom-20 left-1/2 transform -translate-x-1/2 z-50",
        "text-xs py-1 px-2 rounded-full",
        darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"
      )}
    >
      Typing...
    </div>
  );
}
