/**
 * Response caching system for identical questions
 * Caches AI responses to reduce API calls and improve performance
 */

interface CacheEntry {
  question: string;
  response: string;
  timestamp: number;
  fileContext: {
    type: string;
    filename: string;
  } | null;
}

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 100; // Maximum number of cached entries

class ResponseCache {
  private cache: Map<string, CacheEntry> = new Map();

  /**
   * Generate a cache key from question and file context
   * This ensures identical questions with different files are cached separately
   */
  private generateKey(question: string, fileContext: any): string {
    const normalized = question.toLowerCase().trim();
    const fileKey = fileContext
      ? `${fileContext.type}:${fileContext.filename}`
      : "no-file";
    return `${normalized}|${fileKey}`;
  }

  /**
   * Get cached response for a question
   */
  get(question: string, fileContext: any): string | null {
    const key = this.generateKey(question, fileContext);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if cache entry has expired
    const now = Date.now();
    if (now - entry.timestamp > CACHE_DURATION_MS) {
      this.cache.delete(key);
      return null;
    }

    return entry.response;
  }

  /**
   * Set cached response for a question
   */
  set(
    question: string,
    response: string,
    fileContext: any
  ): void {
    const key = this.generateKey(question, fileContext);

    // Enforce max cache size - remove oldest entry if limit exceeded
    if (
      this.cache.size >= MAX_CACHE_SIZE &&
      !this.cache.has(key)
    ) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const entry: CacheEntry = {
      question,
      response,
      timestamp: Date.now(),
      fileContext: fileContext
        ? { type: fileContext.type, filename: fileContext.filename }
        : null,
    };

    this.cache.set(key, entry);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics for debugging
   */
  getStats(): {
    size: number;
    entries: Array<{
      question: string;
      filename: string | null;
      age: number;
    }>;
  } {
    const entries = Array.from(this.cache.values()).map((entry) => ({
      question: entry.question,
      filename: entry.fileContext?.filename || null,
      age: Date.now() - entry.timestamp,
    }));

    return {
      size: this.cache.size,
      entries,
    };
  }
}

// Singleton instance
export const responseCache = new ResponseCache();
