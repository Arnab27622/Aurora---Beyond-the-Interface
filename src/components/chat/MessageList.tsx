/**
 * MessageList Component
 * 
 * Container for displaying all chat messages.
 * Features:
 * - Empty state display when no messages exist
 * - Error boundary wrapping for each message
 * - Auto-scroll to bottom with ref
 * - Responsive layout with max-width constraint
 * - Integrates regeneration and response navigation
 */

import { Message } from "@/lib/types";
import { ChatMessage } from "./ChatMessage";
import { ComponentErrorBoundary } from "@/components/errors/ComponentErrorBoundary";
import { EmptyState } from "./EmptyState";

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  darkMode: boolean;
  markdownComponents: any;
  onRegenerate: (messageId: number) => void;
  regeneratingMessageId: number | null;
  onNavigateResponse: (messageId: number, direction: 'prev' | 'next') => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function MessageList({
  messages,
  loading,
  darkMode,
  markdownComponents,
  onRegenerate,
  regeneratingMessageId,
  onNavigateResponse,
  messagesEndRef,
}: MessageListProps) {
  return (
    <div className="flex flex-col gap-4 w-full max-w-3xl mx-auto px-1 sm:px-4">
      {messages.length === 0 && !loading && <EmptyState />}

      {messages.map((msg) => (
        <ComponentErrorBoundary key={msg.id} componentName={`ChatMessage-${msg.id}`}>
          <ChatMessage
            message={msg}
            darkMode={darkMode}
            markdownComponents={markdownComponents}
            onRegenerate={onRegenerate}
            isRegenerating={regeneratingMessageId === msg.id}
            onNavigateResponse={onNavigateResponse}
          />
        </ComponentErrorBoundary>
      ))}

      <div ref={messagesEndRef} />
    </div>
  );
}
