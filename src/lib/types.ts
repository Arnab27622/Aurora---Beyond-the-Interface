export interface Message {
    id: number;
    role: "user" | "bot";
    content: string;
    file?: FileContextType; // Attached file for user messages
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
    data: string; // extracted text for API
    binaryData?: string; // base64 encoded binary data for download
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
