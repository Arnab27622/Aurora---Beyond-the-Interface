/**
 * Sanitization utilities to prevent XSS and injection attacks
 */

/**
 * Sanitize user input by removing potentially dangerous HTML characters and patterns
 * Does NOT use DOMPurify as it's not available in Node.js backend
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";

  return input
    // Decode any HTML entities first to catch encoded attacks
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    // Remove any script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove any iframe tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    // Remove event handlers
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/on\w+\s*=\s*[^\s>]*/gi, "")
    // Remove javascript: protocol
    .replace(/javascript:/gi, "")
    .replace(/vbscript:/gi, "")
    // Remove data: protocol (used for embedded code)
    .replace(/data:text\/html/gi, "")
    // Remove style attributes with expressions
    .replace(/style\s*=\s*["'].*?expression.*?["']/gi, "");
}

/**
 * Sanitize filename to prevent directory traversal and other attacks
 */
export function sanitizeFilename(filename: string): string {
  if (typeof filename !== "string") return "file";

  return filename
    // Remove path traversal sequences
    .replace(/\.\./g, "")
    .replace(/\\/g, "")
    .replace(/\//g, "")
    // Remove null bytes
    .replace(/\0/g, "")
    // Remove control characters
    .replace(/[\x00-\x1F\x7F]/g, "")
    // Keep only safe characters (alphanumeric, dots, hyphens, underscores)
    .replace(/[^\w.-]/g, "")
    // Limit length
    .substring(0, 255)
    .trim() || "file";
}

/**
 * Validate and sanitize base64 data (for images, PDFs)
 */
export function sanitizeBase64(data: string): string {
  if (typeof data !== "string") {
    throw new Error("Base64 data must be a string");
  }

  // Remove whitespace first
  let cleaned = data.replace(/\s/g, "");

  if (cleaned.length === 0) {
    throw new Error("Base64 data cannot be empty");
  }

  // Check if it looks like base64 (only alphanumeric, +, /, =)
  if (!/^[A-Za-z0-9+/=-]*$/.test(cleaned)) {
    throw new Error("Invalid base64 characters detected");
  }

  // Add padding if necessary (base64 length must be multiple of 4)
  const remainder = cleaned.length % 4;
  if (remainder !== 0) {
    cleaned += "=".repeat(4 - remainder);
  }

  // Validate that only the last characters are padding
  const paddingMatch = cleaned.match(/=+$/);
  if (paddingMatch && paddingMatch[0].length > 2) {
    throw new Error("Invalid base64 data: too much padding");
  }

  return cleaned;
}

/**
 * Escape HTML special characters for safe display
 */
export function escapeHtml(text: string): string {
  if (typeof text !== "string") return "";

  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

/**
 * Check if input contains suspicious patterns
 */
export function detectSuspiciousPatterns(input: string): {
  isSuspicious: boolean;
  reason?: string;
} {
  if (typeof input !== "string") {
    return { isSuspicious: true, reason: "Input must be a string" };
  }

  const suspiciousPatterns = [
    /<script/i,
    /<iframe/i,
    /javascript:/i,
    /vbscript:/i,
    /onerror\s*=/i,
    /onload\s*=/i,
    /onclick\s*=/i,
    /data:text\/html/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(input)) {
      return {
        isSuspicious: true,
        reason: `Detected potentially malicious pattern: ${pattern.source}`,
      };
    }
  }

  return { isSuspicious: false };
}
