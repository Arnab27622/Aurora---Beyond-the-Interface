export interface Message {
    id: number;
    role: "user" | "bot";
    content: string;
}

export interface ChatSession {
    id: string;
    title: string;
    timestamp: number;
    messages: Message[];
}

export type FileContextType = {
    type: "pdf" | "image";
    data: string;
    filename: string;
} | null;