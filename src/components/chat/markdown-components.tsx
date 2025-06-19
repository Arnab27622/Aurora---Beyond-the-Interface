import { Components } from "react-markdown";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/ui/copy-button";

export const markdownComponents = (darkMode: boolean): Components => ({
    pre: ({ node, ...props }) => (
        <pre
            className={cn(
                "whitespace-pre-wrap break-words overflow-x-auto p-4 my-2 rounded-md max-w-full relative",
                darkMode ? "bg-[#2d2d2d] text-[#f8f8f2]" : "bg-[#f5f5f5] text-[#333]"
            )}
            {...props}
        />
    ),
    code: ({ node, className, children, ...props }) => {
        const codeContent = String(children).replace(/\n$/, "");
        const isInline = !className || !className.includes("language-");

        return isInline ? (
            <code
                className={cn(
                    "rounded px-1 py-0.5 font-mono",
                    darkMode ? "bg-[#3a3a3a]" : "bg-[#eaeaea]"
                )}
                {...props}
            >
                {children}
            </code>
        ) : (
            <div className="relative group">
                <pre
                    className={cn(
                        "whitespace-pre-wrap break-words overflow-x-auto p-4 my-2 rounded-md max-w-full",
                        darkMode ? "bg-[#2d2d2d] text-[#f8f8f2]" : "bg-[#f5f5f5] text-[#333]"
                    )}
                >
                    <code>{codeContent}</code>
                </pre>
                <CopyButton text={codeContent} darkMode={darkMode} />
            </div>
        );
    },
    table: ({ children }) => (
        <div className="overflow-x-auto my-4">
            <table className="border-collapse w-full text-sm">{children}</table>
        </div>
    ),
    thead: ({ children }) => <thead>{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => (
        <tr className={cn(darkMode ? "border-gray-700" : "border-gray-300")}>
            {children}
        </tr>
    ),
    th: ({ children }) => (
        <th
            className={cn(
                "border px-4 py-2 text-left font-semibold",
                darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-200 border-gray-300"
            )}
        >
            {children}
        </th>
    ),
    td: ({ children }) => (
        <td
            className={cn(
                "border px-4 py-2",
                darkMode ? "border-gray-600" : "border-gray-300"
            )}
        >
            {children}
        </td>
    ),
    a: ({ href, children }) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                "hover:underline",
                darkMode ? "text-blue-400" : "text-blue-600"
            )}
        >
            {children}
        </a>
    ),
    blockquote: ({ children }) => (
        <blockquote
            className={cn(
                "border-l-4 pl-4 py-1 my-2 italic",
                darkMode ? "border-gray-500 text-gray-300" : "border-gray-400 text-gray-700"
            )}
        >
            {children}
        </blockquote>
    ),
    ul: ({ children }) => <ul className="list-disc pl-5 my-2">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-5 my-2">{children}</ol>,
    li: ({ children }) => <li className="my-1">{children}</li>,
});