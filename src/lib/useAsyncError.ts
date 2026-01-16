/**
 * Async Error Handling Hooks
 * 
 * Custom React hooks for handling Promise-based async operations:
 * - useAsyncError: Execute promise with state management and error boundaries
 * - useAsyncHandler: Simplified async function wrapper with error callbacks
 * 
 * Features:
 * - Loading and error state tracking
 * - Automatic error logging
 * - Type-safe result handling
 * - Promise rejection catching
 */

'use client';

import { useState, useCallback } from 'react';
import { getErrorMessage, logError } from './errorHandler';

interface UseAsyncErrorState {
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
}

interface UseAsyncErrorResult<T> extends UseAsyncErrorState {
  execute: (promise: Promise<T>) => Promise<T | null>;
  clearError: () => void;
}

/**
 * Hook for handling async operations with error boundaries
 * Useful for Promise-based operations that can't be caught by error boundaries
 */
export function useAsyncError<T = void>(): UseAsyncErrorResult<T> {
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (promise: Promise<T>): Promise<T | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await promise;
        setIsLoading(false);
        return result;
      } catch (err: unknown) {
        const error = new Error(getErrorMessage(err));
        logError(error, 'Async operation');
        setError(error);
        setIsLoading(false);
        return null;
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    isLoading,
    isError: error !== null,
    execute,
    clearError,
  };
}

/**
 * Hook for handling async operations with try-catch pattern
 * Returns a function that can be used with async operations
 */
export function useAsyncHandler(
  onError?: (error: Error, context: string) => void
) {
  const handleAsync = useCallback(
    async <T,>(
      asyncFn: () => Promise<T>,
      context: string = 'Operation'
    ): Promise<T | null> => {
      try {
        return await asyncFn();
      } catch (err: unknown) {
        const error = new Error(getErrorMessage(err));
        logError(error, context);
        onError?.(error, context);
        return null;
      }
    },
    [onError]
  );

  return { handleAsync };
}
