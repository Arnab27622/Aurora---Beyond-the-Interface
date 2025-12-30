import { Button } from "@/components/ui/button";
import { Sun, Moon, Trash2, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ChatHeaderProps {
    darkMode: boolean;
    setDarkMode: (mode: boolean) => void;
    clearChat?: () => void;
    showHistory?: boolean;
    setShowHistory?: (show: boolean) => void;
    isAuthPage?: boolean;
}

export const ChatHeader = ({
    darkMode,
    setDarkMode,
    clearChat,
    showHistory,
    setShowHistory,
    isAuthPage = false,
}: ChatHeaderProps) => (
    <div
        className={cn(
            "flex justify-between items-center py-4 px-2 md:px-8 lg:px-10 border-b",
            darkMode ? "border-gray-700" : "border-gray-200"
        )}
    >
        <div className="flex items-center gap-3">
            {!isAuthPage && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowHistory?.(!showHistory)}
                    className={cn(
                        "md:hidden cursor-pointer",
                        darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
                    )}
                >
                    {showHistory ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
            )}
            <h1 className="text-xl font-semibold">
                <Image src="/favicon.ico" alt="Logo" width={30} height={30} className="inline-block mr-2" />
                Aurora</h1>
        </div>

        <Button
            variant="outline"
            size="sm"
            onClick={() => setDarkMode(!darkMode)}
            className={cn(
                "cursor-pointer",
                darkMode
                    ? "border-gray-500 bg-transparent hover:bg-white"
                    : "border-gray-300 bg-transparent hover:bg-gray-100"
            )}
        >
            {darkMode ? (
                <Sun className="h-4 w-4 text-yellow-500" />
            ) : (
                <Moon className="h-4 w-4 text-blue-400" />
            )}
        </Button>
    </div>
);
