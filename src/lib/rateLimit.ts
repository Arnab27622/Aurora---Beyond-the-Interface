/**
 * In-memory rate limiter for API endpoints
 * In production, use Redis for distributed systems
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if a request from an IP should be rate limited
 * @param ip Client IP address
 * @param limit Maximum requests allowed
 * @param windowMs Time window in milliseconds
 * @returns { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(
  ip: string,
  limit: number = 5,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  // Initialize or reset expired entry
  if (!entry || entry.resetAt < now) {
    const newEntry = { count: 1, resetAt: now + windowMs };
    rateLimitStore.set(ip, newEntry);
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: newEntry.resetAt,
    };
  }

  // Increment count
  entry.count++;

  return {
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}

/**
 * Get client IP address from request headers
 * Handles proxies and load balancers
 */
export function getClientIp(request: Request): string {
  const headersList = new Headers(request.headers);

  // Check for IP forwarded by proxies (most reliable in production)
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs; take the first one
    return forwardedFor.split(",")[0].trim();
  }

  // Check for other proxy headers
  const realIp = headersList.get("x-real-ip");
  if (realIp) return realIp;

  // Fallback to connection IP (won't work behind proxies)
  return "127.0.0.1";
}

/**
 * Cleanup old entries from rate limit store periodically
 * Call this in a background task or at server startup
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  let cleaned = 0;

  for (const [ip, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(ip);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`Rate limit store cleanup: removed ${cleaned} expired entries`);
  }
}
