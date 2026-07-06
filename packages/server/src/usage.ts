import { LIMITS } from "@kenalin/core";

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

const zero = (): SessionUsage => ({ turns: 0, prompt: 0, completion: 0, embedding: 0, total: 0 });

/** Rough token estimate for text the embed API charges but doesn't report. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export class UsageTracker {
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
