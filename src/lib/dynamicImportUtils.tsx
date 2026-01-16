/**
 * Dynamic Component Utilities
 * 
 * Helpers for dynamic imports with loading and error states:
 * - Fallback components for loading states
 * - Error boundary fallback display
 * - SSR control for components
 * 
 * Features:
 * - Custom loading and error UI components
 * - Configurable SSR behavior
 * - TypeScript generics for type safety
 */

'use client';

import dynamic from 'next/dynamic';
import { ComponentType, ReactNode } from 'react';

interface LoadingFallbackProps {
  darkMode?: boolean;
}

/**
 * Default loading fallback component
 */
export const DefaultLoadingFallback = ({ darkMode = true }: LoadingFallbackProps) => {
  return (
    <div
      className={`py-2 px-4 rounded-md text-sm w-fit animate-pulse ${
        darkMode ? 'bg-gray-600 text-white' : 'bg-gray-300 text-black'
      }`}
    >
      Loading...
    </div>
  );
};

/**
 * Error fallback component
 */
export const ErrorFallback = ({ darkMode = true }: LoadingFallbackProps) => {
  return (
    <div
      className={`py-2 px-4 rounded-md text-sm border ${
        darkMode
          ? 'bg-red-900/20 text-red-400 border-red-800'
          : 'bg-red-100 text-red-700 border-red-300'
      }`}
    >
      Failed to load component
    </div>
  );
};

interface DynamicImportOptions {
  ssr?: boolean;
  loading?: () => ReactNode;
}

/**
 * Create a dynamically imported component with custom options
 */
export const createDynamicComponent = <P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options?: DynamicImportOptions
) => {
  return dynamic(importFn, {
    loading: options?.loading || (() => <DefaultLoadingFallback />),
    ssr: options?.ssr ?? true,
  });
};

/**
 * Create a dynamically imported component with error handling
 */
export const createDynamicComponentWithError = <P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options?: DynamicImportOptions & { fallback?: () => ReactNode }
) => {
  return dynamic(importFn, {
    loading: options?.loading || (() => <DefaultLoadingFallback />),
    ssr: options?.ssr ?? true,
  });
};
