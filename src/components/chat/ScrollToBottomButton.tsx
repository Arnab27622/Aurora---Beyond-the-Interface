import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScrollToBottomButtonProps {
  onClick: () => void;
  darkMode: boolean;
  show: boolean;
}

export function ScrollToBottomButton({ onClick, darkMode, show }: ScrollToBottomButtonProps) {
  if (!show) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "absolute bottom-20 right-2.5 sm:right-6 z-50 p-3 rounded-full shadow-lg transition-all duration-200 cursor-pointer hover:scale-110",
        darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-white text-gray-700 hover:bg-gray-50"
      )}
      aria-label="Scroll to bottom"
    >
      <ChevronDown className="w-5 h-5" />
    </button>
  );
}
