/**
 * LoadingSkeleton Component
 * 
 * Reusable loading placeholder component with multiple variants.
 * Used as fallback during async operations and data loading.
 * Features:
 * - Multiple variants: text, card, message, full
 * - Customizable width and height
 * - Theme-aware colors (light/dark mode)
 * - Animated pulse effect
 * - Responsive sizing
 */

'use client';

import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  darkMode?: boolean;
  width?: string;
  height?: string;
  variant?: 'text' | 'card' | 'message' | 'full';
}

export const LoadingSkeleton = ({
  darkMode = true,
  width = 'w-full',
  height = 'h-10',
  variant = 'text',
}: LoadingSkeletonProps) => {
  const baseClasses = `${width} ${height} rounded-md animate-pulse`;

  switch (variant) {
    case 'card':
      return (
        <div
          className={cn(
            baseClasses,
            darkMode ? 'bg-gradient-to-r from-gray-700 to-gray-600' : 'bg-gradient-to-r from-gray-300 to-gray-200'
          )}
        />
      );

    case 'message':
      return (
        <div className="space-y-2 w-full">
          <div
            className={cn(
              'h-4 rounded-md',
              darkMode ? 'bg-gray-700' : 'bg-gray-300'
            )}
            style={{ width: '70%' }}
          />
          <div
            className={cn(
              'h-4 rounded-md',
              darkMode ? 'bg-gray-700' : 'bg-gray-300'
            )}
            style={{ width: '85%' }}
          />
          <div
            className={cn(
              'h-4 rounded-md',
              darkMode ? 'bg-gray-700' : 'bg-gray-300'
            )}
            style={{ width: '60%' }}
          />
        </div>
      );

    case 'full':
      return (
        <div className="space-y-4 w-full">
          <div
            className={cn(
              'h-12 rounded-md',
              darkMode ? 'bg-gray-700' : 'bg-gray-300'
            )}
          />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-4 rounded-md',
                  darkMode ? 'bg-gray-700' : 'bg-gray-300'
                )}
                style={{ width: `${Math.random() * 30 + 60}%` }}
              />
            ))}
          </div>
        </div>
      );

    default:
      return (
        <div
          className={cn(
            baseClasses,
            darkMode ? 'bg-gray-700' : 'bg-gray-300'
          )}
        />
      );
  }
};
