/**
 * Error Handler Utilities
 * 
 * Custom error classes and utilities for consistent error handling:
 * - AppError: Base error class with code and status
 * - ValidationError: For validation failures (400)
 * - NotFoundError: For missing resources (404)
 * - APIError: For API failures with custom status codes
 * 
 * Features:
 * - Type guards for error checking
 * - Consistent error message extraction
 * - Structured error logging
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class APIError extends AppError {
  constructor(message: string, statusCode?: number) {
    super(message, 'API_ERROR', statusCode || 500);
    this.name = 'APIError';
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

export function logError(error: unknown, context?: string): void {
  const message = getErrorMessage(error);
  const contextStr = context ? ` [${context}]` : '';
  console.error(`Error${contextStr}:`, message, error);
}
