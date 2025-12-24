'use client';

import dynamic from 'next/dynamic';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

/**
 * Lazy load heavy components with Next.js dynamic imports
 * This reduces initial bundle size and improves performance
 */

const LoadingCard = () => <LoadingSkeleton variant="card" height="h-96" />;
const LoadingInputCard = () => <LoadingSkeleton variant="card" height="h-16" />;
const LoadingFull = () => <LoadingSkeleton variant="full" height="h-48" />;
const LoadingSmall = () => <LoadingSkeleton height="h-8" />;
const LoadingMessage = () => <LoadingSkeleton variant="message" height="h-20" />;

// ChatHistory - Can be deferred as it's not critical on initial render
export const ChatHistoryLazy = dynamic(
  () => import('@/components/chat/ChatHistory').then((mod) => ({ default: mod.ChatHistory })),
  {
    loading: LoadingCard,
    ssr: true,
  }
);

// ChatInput - Can be lazy loaded but keep loading state quick
export const ChatInputLazy = dynamic(
  () => import('@/components/chat/ChatInput').then((mod) => ({ default: mod.ChatInput })),
  {
    loading: LoadingInputCard,
    ssr: true,
  }
);

// SuggestedPrompts - Only shown on empty state, safe to lazy load
export const SuggestedPromptsLazy = dynamic(
  () => import('@/components/chat/SuggestedPrompts').then((mod) => ({ default: mod.SuggestedPrompts })),
  {
    loading: LoadingFull,
    ssr: true,
  }
);

// FileContextIndicator - Only shown when file is selected
export const FileContextIndicatorLazy = dynamic(
  () => import('@/components/chat/FileContextIndicator').then((mod) => ({ default: mod.FileContextIndicator })),
  {
    loading: LoadingSmall,
    ssr: true,
  }
);

/**
 * PDF Processing utilities - Heaviest component
 * Only loaded when user selects a PDF file
 */
export const PDFProcessorConfig = {
  ssr: false,
  loading: LoadingMessage,
};

/**
 * React Markdown - Lazy load for better initial performance
 * Only needed when rendering messages with markdown
 */
export const MarkdownRenderingConfig = {
  ssr: true,
  loading: LoadingMessage,
};
