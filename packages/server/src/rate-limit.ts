import { type RedisLike } from "./redis.js";

/**
 * In-memory token-bucket rate limiter (PRD D6). Per-IP, per-server-instance.
 * Good enough for the stateless MVP; a distributed limiter is a P1 concern.
 */
export interface RateLimitOptions {
  maxMessages: number;
  windowMs: number;
}

/**
 * Common surface so the Hono app can hold either the in-memory or the Redis
 * limiter. `allow` may be sync (in-memory) or async (Redis) — call sites `await`.
 */
export interface RateLimiterLike {
  allow(key: string, now?: number): boolean | Promise<boolean>;
}

interface Bucket {
  tokens: number;
  updated: number;
}

export class RateLimiter implements RateLimiterLike {
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

/**
 * Distributed rate limiter backed by Upstash Redis (TASK-007, resolves TD-005).
 * Holds across serverless instances because the count lives in Redis, not process
 * memory. Uses a fixed-window counter (INCR + PEXPIRE ... NX) rather than the
 * in-memory token bucket: it is atomic per request in a single round-trip and is
 * the standard shape for an abuse guard. The first request in a window sets the
 * expiry (NX = only when unset); the key self-expires, so no cleanup is needed.
 */
export class RedisRateLimiter implements RateLimiterLike {
  constructor(
    private readonly redis: RedisLike,
    private readonly opts: RateLimitOptions,
    private readonly prefix = "rl",
  ) {}

  async allow(key: string): Promise<boolean> {
    const k = `${this.prefix}:${key}`;
    const [count] = await this.redis.pipeline([
      ["INCR", k],
      ["PEXPIRE", k, this.opts.windowMs, "NX"],
    ]);
    return Number(count) <= this.opts.maxMessages;
  }
}
