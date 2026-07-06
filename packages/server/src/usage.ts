import { LIMITS } from "@kenalin/core";
import { hashToObject, redisCommand, type RedisLike } from "./redis.js";

/**
 * Token-usage accounting (TASK-003). In-memory, per server instance — like the
 * rate limiter. Records authoritative chat tokens (Gemini `usageMetadata`) plus
 * an estimate for embedding tokens (the embed API doesn't return counts), and
 * enforces an optional per-session token budget.
 *
 * Records counts only — never message content or PII.
 */

export interface TurnUsage {
  sessionId: string;
  prompt: number;
  completion: number;
  embedding: number;
  total: number;
  /** Prompt tokens served from provider context cache (observability only; the
   *  trackers don't persist this — it's for cost measurement, e.g. the eval). */
  cached?: number;
}

export interface SessionUsage {
  turns: number;
  prompt: number;
  completion: number;
  embedding: number;
  total: number;
}

export interface UsageSnapshot extends SessionUsage {
  sessions: number;
}

/**
 * Common surface so the app can hold either the in-memory or the Redis tracker.
 * Methods may be sync (in-memory) or async (Redis) — call sites `await`.
 */
export interface UsageStore {
  record(turn: TurnUsage): void | Promise<void>;
  session(sessionId: string): SessionUsage | Promise<SessionUsage>;
  global(): UsageSnapshot | Promise<UsageSnapshot>;
  overBudget(sessionId: string): boolean | Promise<boolean>;
}

const zero = (): SessionUsage => ({ turns: 0, prompt: 0, completion: 0, embedding: 0, total: 0 });

/** Fields of a SessionUsage that accumulate — used for Redis HINCRBY + parsing. */
const USAGE_FIELDS = ["turns", "prompt", "completion", "embedding", "total"] as const;

/** Rough token estimate for text the embed API charges but doesn't report. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export class UsageTracker implements UsageStore {
  private readonly sessions = new Map<string, SessionUsage>();
  private readonly totals = zero();

  constructor(private readonly sessionCap = LIMITS.maxSessionTokens) {}

  record(turn: TurnUsage): void {
    const s = this.sessions.get(turn.sessionId) ?? zero();
    s.turns += 1;
    s.prompt += turn.prompt;
    s.completion += turn.completion;
    s.embedding += turn.embedding;
    s.total += turn.total;
    this.sessions.set(turn.sessionId, s);

    this.totals.turns += 1;
    this.totals.prompt += turn.prompt;
    this.totals.completion += turn.completion;
    this.totals.embedding += turn.embedding;
    this.totals.total += turn.total;
  }

  session(sessionId: string): SessionUsage {
    return { ...(this.sessions.get(sessionId) ?? zero()) };
  }

  global(): UsageSnapshot {
    return { ...this.totals, sessions: this.sessions.size };
  }

  /** True when a session has spent its token budget (0/disabled = never). */
  overBudget(sessionId: string): boolean {
    if (!this.sessionCap) return false;
    return this.session(sessionId).total >= this.sessionCap;
  }
}

/** Parse a Redis usage hash into a SessionUsage (missing fields → 0). */
function parseSessionUsage(hash: Record<string, string>): SessionUsage {
  const s = zero();
  for (const f of USAGE_FIELDS) s[f] = Number(hash[f] ?? 0);
  return s;
}

const DEFAULT_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Distributed usage tracker backed by Upstash Redis (TASK-007, resolves TD-006).
 * Session and global counters live in Redis, so the per-session budget cap holds
 * across serverless instances instead of resetting per process. Records counts
 * only — never message content or PII (same guarantee as the in-memory tracker).
 *
 * Session hashes carry a rolling TTL so abandoned sessions self-expire; a session
 * id set (SCARD) gives the distinct-session count for the global snapshot.
 */
export class RedisUsageTracker implements UsageStore {
  constructor(
    private readonly redis: RedisLike,
    private readonly sessionCap = LIMITS.maxSessionTokens,
    private readonly prefix = "usage",
    private readonly ttlMs = DEFAULT_SESSION_TTL_MS,
  ) {}

  private sessKey(id: string): string {
    return `${this.prefix}:sess:${id}`;
  }
  private get globalKey(): string {
    return `${this.prefix}:global`;
  }
  private get sessionsKey(): string {
    return `${this.prefix}:sessions`;
  }

  async record(turn: TurnUsage): Promise<void> {
    const sk = this.sessKey(turn.sessionId);
    const commands: (string | number)[][] = [
      ["HINCRBY", sk, "turns", 1],
      ["HINCRBY", this.globalKey, "turns", 1],
      ["SADD", this.sessionsKey, turn.sessionId],
      ["PEXPIRE", sk, this.ttlMs],
    ];
    for (const f of ["prompt", "completion", "embedding", "total"] as const) {
      commands.push(["HINCRBY", sk, f, turn[f]]);
      commands.push(["HINCRBY", this.globalKey, f, turn[f]]);
    }
    await this.redis.pipeline(commands);
  }

  async session(sessionId: string): Promise<SessionUsage> {
    const hash = hashToObject(await redisCommand(this.redis, "HGETALL", this.sessKey(sessionId)));
    return parseSessionUsage(hash);
  }

  async global(): Promise<UsageSnapshot> {
    const [rawHash, sessions] = await this.redis.pipeline([
      ["HGETALL", this.globalKey],
      ["SCARD", this.sessionsKey],
    ]);
    return { ...parseSessionUsage(hashToObject(rawHash)), sessions: Number(sessions ?? 0) };
  }

  async overBudget(sessionId: string): Promise<boolean> {
    if (!this.sessionCap) return false;
    const total = await redisCommand(this.redis, "HGET", this.sessKey(sessionId), "total");
    return Number(total ?? 0) >= this.sessionCap;
  }
}
