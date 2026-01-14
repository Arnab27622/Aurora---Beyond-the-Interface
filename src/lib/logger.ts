/**
 * Environment-aware logging utility
 * Reduces verbose logging in development while keeping production logs clean
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Log error with environment awareness
 * In development: includes stack trace and details
 * In production: only logs essential information (no stack traces)
 */
export function logError(
  message: string,
  error: unknown,
  context?: string
): void {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` [${context}]` : '';

  if (isDevelopment) {
    // Development: Verbose logging with full stack traces
    console.error(`[${timestamp}] ERROR${contextStr}: ${message}`, error);
  } else {
    // Production: Minimal logging (no sensitive details)
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error(`[${timestamp}] ERROR${contextStr}: ${message}`, errorMessage);
  }
}

/**
 * Log warning with environment awareness
 * In development: includes full details
 * In production: minimal information
 */
export function logWarn(
  message: string,
  data?: unknown,
  context?: string
): void {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` [${context}]` : '';

  if (isDevelopment) {
    // Development: Include data for debugging
    console.warn(`[${timestamp}] WARN${contextStr}: ${message}`, data);
  } else {
    // Production: No data logged
    console.warn(`[${timestamp}] WARN${contextStr}: ${message}`);
  }
}

/**
 * Log info message (minimal in both environments)
 */
export function logInfo(
  message: string,
  context?: string
): void {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` [${context}]` : '';
  console.log(`[${timestamp}] INFO${contextStr}: ${message}`);
}

/**
 * Log debug message (only in development)
 */
export function logDebug(
  message: string,
  data?: unknown,
  context?: string
): void {
  if (!isDevelopment) return;

  const timestamp = new Date().toISOString();
  const contextStr = context ? ` [${context}]` : '';
  console.debug(`[${timestamp}] DEBUG${contextStr}: ${message}`, data);
}
