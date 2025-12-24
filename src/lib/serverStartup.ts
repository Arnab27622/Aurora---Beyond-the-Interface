/**
 * Server-side environment validation on application startup
 * This file runs only on the server and validates configuration
 */

import { logEnvironmentValidation, validateEnvironment } from "@/lib/validateEnvironment";

// Validate environment on server startup
const envValidation = validateEnvironment();

// Log validation results
if (process.env.NODE_ENV === "development") {
  logEnvironmentValidation(envValidation);
} else if (!envValidation.isValid) {
  // In production, always validate and throw on errors
  logEnvironmentValidation(envValidation);
}

// Export validation status for potential runtime use
export const isEnvironmentValid = envValidation.isValid;
export const environmentConfig = envValidation.config || {
  geminiApiKey: "",
  geminiModelId: "",
};
