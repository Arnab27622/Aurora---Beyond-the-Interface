/**
 * Environment Validation Module
 * Validates required environment variables on server startup
 */

export interface EnvironmentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config?: {
    geminiApiKey: string;
    geminiModelId: string;
  };
}

/**
 * Validates all required environment variables
 * Throws error if critical configuration is missing
 */
export function validateEnvironment(): EnvironmentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let isValid = true;

  // Validate GEMINI_API_KEY
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    errors.push("GEMINI_API_KEY is not set");
    isValid = false;
  } else if (geminiApiKey.trim() === "") {
    errors.push("GEMINI_API_KEY is empty or only whitespace");
    isValid = false;
  } else if (geminiApiKey.length < 10) {
    warnings.push("GEMINI_API_KEY seems too short (< 10 characters)");
  }

  // Validate GEMINI_MODEL_ID
  const geminiModelId = process.env.GEMINI_MODEL_ID;
  if (!geminiModelId) {
    errors.push("GEMINI_MODEL_ID is not set");
    isValid = false;
  } else if (geminiModelId.trim() === "") {
    errors.push("GEMINI_MODEL_ID is empty or only whitespace");
    isValid = false;
  } else if (!geminiModelId.includes("gemini")) {
    warnings.push(
      "GEMINI_MODEL_ID does not contain 'gemini' - ensure it's a valid Gemini model ID"
    );
  }

  // Check for NEXT_PUBLIC_ prefixed keys (security issue)
  const nextPublicApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (nextPublicApiKey) {
    errors.push(
      "Found NEXT_PUBLIC_GEMINI_API_KEY - API keys should not be exposed to client. Remove NEXT_PUBLIC_ prefix and use private environment variables instead."
    );
    isValid = false;
  }

  const nextPublicModelId = process.env.NEXT_PUBLIC_GEMINI_MODEL_ID;
  if (nextPublicModelId) {
    warnings.push(
      "Found NEXT_PUBLIC_GEMINI_MODEL_ID - consider removing NEXT_PUBLIC_ prefix for consistency"
    );
  }

  // Return validation result
  const result: EnvironmentValidationResult = {
    isValid,
    errors,
    warnings,
  };

  // Add config if valid
  if (isValid && geminiApiKey && geminiModelId) {
    result.config = {
      geminiApiKey,
      geminiModelId,
    };
  }

  return result;
}

/**
 * Logs environment validation results
 * Throws error if validation fails
 */
export function logEnvironmentValidation(
  result: EnvironmentValidationResult
): void {
  // Log warnings
  if (result.warnings.length > 0) {
    console.warn("⚠️ Environment Validation Warnings:");
    result.warnings.forEach((warning) => {
      console.warn(`  • ${warning}`);
    });
  }

  // Throw error if validation failed
  if (!result.isValid) {
    const errorMessage = `❌ Environment Validation Failed:\n${result.errors
      .map((error) => `  • ${error}`)
      .join("\n")}`;

    console.error(errorMessage);
    throw new Error(
      `Critical Configuration Error: ${result.errors.join("; ")}`
    );
  }

  // Log success
  console.log("✅ Environment validation successful");
  if (result.config) {
    console.log(`   API Key: ${result.config.geminiApiKey.substring(0, 10)}...`);
    console.log(`   Model ID: ${result.config.geminiModelId}`);
  }
}

/**
 * Validates environment and returns config
 * Throws error if validation fails
 */
export function getValidatedEnvironment(): {
  geminiApiKey: string;
  geminiModelId: string;
} {
  const result = validateEnvironment();
  logEnvironmentValidation(result);

  if (!result.config) {
    throw new Error("Environment validation failed - no config available");
  }

  return result.config;
}

/**
 * Safe environment validation for runtime checks
 * Does not throw, useful for graceful handling
 */
export function safeValidateEnvironment(): EnvironmentValidationResult {
  try {
    return validateEnvironment();
  } catch (error) {
    return {
      isValid: false,
      errors: [
        error instanceof Error
          ? error.message
          : "Unknown error during environment validation",
      ],
      warnings: [],
    };
  }
}
