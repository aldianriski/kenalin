/**
 * In-memory token-bucket rate limiter (PRD D6). Per-IP, per-server-instance.
 * Good enough for the stateless MVP; a distributed limiter is a P1 concern.
 */
export interface RateLimitOptions {
  maxMessages: number;
  windowMs: number;
}

interface Bucket {
  tokens: number;
  updated: number;
}

export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  constructor(private readonly opts: RateLimitOptions) {}

  /** Returns true if the request is allowed; consumes a token when it is. */
  allow(key: string, now: number = Date.now()): boolean {
    const rate = this.opts.maxMessages / this.opts.windowMs;
    const b = this.buckets.get(key) ?? { tokens: this.opts.maxMessages, updated: now };
    // Refill based on elapsed time.
    b.tokens = Math.min(this.opts.maxMessages, b.tokens + (now - b.updated) * rate);
    b.updated = now;
    if (b.tokens < 1) {
      this.buckets.set(key, b);
      return false;
    }
    b.tokens -= 1;
    this.buckets.set(key, b);
    return true;
  }
}
