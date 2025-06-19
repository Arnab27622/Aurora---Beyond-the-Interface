import { cn } from "@/lib/utils";

interface SuggestedPromptsProps {
    suggestedPrompts: string[];
    onSelectPrompt: (prompt: string) => void;
    darkMode: boolean;
}

export const SuggestedPrompts = ({
    suggestedPrompts,
    onSelectPrompt,
    darkMode,
}: SuggestedPromptsProps) => (
    <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-xl font-semibold mb-6">How can I help you today?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {suggestedPrompts.map((prompt, i) => (
                <div
                    key={i}
                    onClick={() => onSelectPrompt(prompt)}
                    className={cn(
                        "p-4 rounded-lg cursor-pointer transition-transform hover:scale-[1.02]",
                        darkMode
                            ? "bg-gray-800 hover:bg-gray-700"
                            : "bg-gray-100 hover:bg-gray-200"
                    )}
                >
                    <p className="text-sm">{prompt}</p>
                </div>
            ))}
        </div>
    </div>
);