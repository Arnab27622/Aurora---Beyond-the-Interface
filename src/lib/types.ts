/**
 * Type Definitions
 * 
 * Core TypeScript interfaces for application data structures:
 * - Message: Chat message with optional file attachment
 * - ChatSession: Persistent chat history with metadata
 * - FileContextType: File data for chat context (images, PDFs, documents)
 * - SpeechRecognitionState: Speech input state tracking
 * - SearchResult: Search result metadata
 */

/**
 * Chat message structure
 */
export interface Message {
    id: number;
    role: "user" | "bot";
    content: string;
    file?: FileContextType; // Attached file for user messages
    isCached?: boolean;
    responses?: string[]; // Multiple responses for bot messages
    currentResponseIndex?: number; // Current response being displayed
}

/**
 * Chat session structure for history
 */
export interface ChatSession {
    id: string;
    title: string;
    timestamp: number;
    messages: Message[];
}

/**
 * File context for attachments (images, documents)
 */
export type FileContextType = {
    type: "pdf" | "image" | "txt" | "docx" | "xlsx" | "csv" | "pptx";
    data: string; // extracted text for API
    binaryData?: string; // base64 encoded binary data for download
    filename: string;
} | null;

/**
 * State tracking for speech recognition
 */
export interface SpeechRecognitionState {
    isListening: boolean;
    isAvailable: boolean;
}

/**
 * Search result structure for chat history search
 */
export interface SearchResult {
    sessionId: string;
    sessionTitle: string;
    messageId: number;
    messageContent: string;
    messageRole: "user" | "bot";
    timestamp: number;
}
