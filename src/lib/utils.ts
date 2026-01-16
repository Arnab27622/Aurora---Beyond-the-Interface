/**
 * Utility Function: Class Name Merge Helper
 * 
 * Combines clsx and tailwind-merge for:
 * - Conditional CSS class generation
 * - Tailwind class conflict resolution
 * - Type-safe class composition
 * 
 * Usage: cn('bg-red-500', condition && 'text-white', otherClasses)
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility Function: Class Name Merge Helper
 * Combines clsx and tailwind-merge for conditional CSS and conflict resolution.
 * 
 * @param inputs Class values to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
