export interface Message {
    id: number;
    role: "user" | "bot";
    content: string;
    isCached?: boolean;
    responses?: string[]; // Multiple responses for bot messages
    currentResponseIndex?: number; // Current response being displayed
}

export interface ChatSession {
    id: string;
    title: string;
    timestamp: number;
    messages: Message[];
}

export type FileContextType = {
    type: "pdf" | "image" | "txt" | "docx" | "xlsx" | "csv" | "pptx";
    data: string;
    filename: string;
} | null;

export interface SpeechRecognitionState {
    isListening: boolean;
    isAvailable: boolean;
}

export interface SearchResult {
    sessionId: string;
    sessionTitle: string;
    messageId: number;
    messageContent: string;
    messageRole: "user" | "bot";
    timestamp: number;
}
