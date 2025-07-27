import type { NextApiRequest, NextApiResponse } from "next";
import { AppError } from "./error-handler";

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  message?: string;
}

class RateLimiter {
  private requests = new Map<string, number[]>();

  constructor(private options: RateLimitOptions) {}

  private getKey(req: NextApiRequest): string {
    // Use IP address as key, fallback to a default
    const forwarded = req.headers["x-forwarded-for"];
    const ip = forwarded
      ? (typeof forwarded === "string" ? forwarded : forwarded[0])?.split(",")[0]
      : req.socket.remoteAddress || "unknown";

    return `${req.url}:${ip}`;
  }

  check(req: NextApiRequest): void {
    const key = this.getKey(req);
    const now = Date.now();
    const windowStart = now - this.options.windowMs;

    // Get existing requests for this key
    const requests = this.requests.get(key) || [];

    // Filter out old requests outside the window
    const recentRequests = requests.filter((timestamp) => timestamp > windowStart);

    // Check if limit exceeded
    if (recentRequests.length >= this.options.max) {
      throw new AppError(
        this.options.message || "Too many requests, please try again later",
        429,
        "RATE_LIMIT_EXCEEDED",
      );
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup();
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.options.windowMs;

    for (const [key, requests] of this.requests.entries()) {
      const recentRequests = requests.filter((timestamp) => timestamp > windowStart);
      if (recentRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recentRequests);
      }
    }
  }
}

// Create rate limiters for different endpoints
export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
});

export const cronRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
});

export const withRateLimit = (
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  limiter: RateLimiter = apiRateLimiter,
) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    limiter.check(req);
    await handler(req, res);
  };
};
