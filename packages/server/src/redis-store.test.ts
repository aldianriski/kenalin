import { describe, expect, it } from "vitest";
import { RedisRateLimiter } from "./rate-limit.js";
import { RedisUsageTracker } from "./usage.js";
import type { RedisLike } from "./redis.js";

/**
 * In-process fake of the Upstash surface the stores use. It is shared between two
 * store instances to simulate two serverless instances hitting one Redis with
 * separate process memory — the exact cross-instance property TASK-007 must prove
 * (SPRINT-002 T1 DoD) without live credentials.
 */
class FakeRedis implements RedisLike {
  private nums = new Map<string, number>();
  private hashes = new Map<string, Map<string, number>>();
  private sets = new Map<string, Set<string>>();

  private hash(key: string): Map<string, number> {
    let h = this.hashes.get(key);
    if (!h) this.hashes.set(key, (h = new Map()));
    return h;
  }
  private set(key: string): Set<string> {
    let s = this.sets.get(key);
    if (!s) this.sets.set(key, (s = new Set()));
    return s;
  }

  async pipeline(commands: (string | number)[][]): Promise<unknown[]> {
    return commands.map((cmd) => {
      const [op, key] = [String(cmd[0]).toUpperCase(), String(cmd[1])];
      switch (op) {
        case "INCR": {
          const v = (this.nums.get(key) ?? 0) + 1;
          this.nums.set(key, v);
          return v;
        }
        case "PEXPIRE":
          return 1; // TTL is a no-op in the fake; window/expiry timing isn't under test.
        case "HINCRBY": {
          const field = String(cmd[2]);
          const h = this.hash(key);
          const v = (h.get(field) ?? 0) + Number(cmd[3]);
          h.set(field, v);
          return v;
        }
        case "HGETALL": {
          const flat: string[] = [];
          for (const [f, v] of this.hash(key)) flat.push(f, String(v));
          return flat;
        }
        case "HGET": {
          const v = this.hash(key).get(String(cmd[2]));
          return v === undefined ? null : String(v);
        }
        case "SADD": {
          const s = this.set(key);
          const before = s.size;
          s.add(String(cmd[2]));
          return s.size - before;
        }
        case "SCARD":
          return this.set(key).size;
        default:
          throw new Error(`FakeRedis: unsupported command ${op}`);
      }
    });
  }
}

describe("RedisRateLimiter (cross-instance)", () => {
  it("holds the cap across two instances sharing one Redis", async () => {
    const redis = new FakeRedis();
    const opts = { maxMessages: 3, windowMs: 60_000 };
    const a = new RedisRateLimiter(redis, opts);
    const b = new RedisRateLimiter(redis, opts); // a second "serverless instance"

    // 3 allowed total across BOTH instances, then blocked everywhere.
    expect(await a.allow("1.2.3.4")).toBe(true);
    expect(await b.allow("1.2.3.4")).toBe(true);
    expect(await a.allow("1.2.3.4")).toBe(true);
    expect(await b.allow("1.2.3.4")).toBe(false); // 4th request, on the other instance
    expect(await a.allow("1.2.3.4")).toBe(false);
  });

  it("keys are independent", async () => {
    const redis = new FakeRedis();
    const limiter = new RedisRateLimiter(redis, { maxMessages: 1, windowMs: 60_000 });
    expect(await limiter.allow("a")).toBe(true);
    expect(await limiter.allow("a")).toBe(false);
    expect(await limiter.allow("b")).toBe(true);
  });
});

describe("RedisUsageTracker (cross-instance)", () => {
  const turn = (sessionId: string, total: number) => ({
    sessionId,
    prompt: total / 2,
    completion: total / 2,
    embedding: 0,
    total,
  });

  it("accumulates and enforces the budget across two instances", async () => {
    const redis = new FakeRedis();
    const cap = 1000;
    const a = new RedisUsageTracker(redis, cap);
    const b = new RedisUsageTracker(redis, cap); // second instance, separate memory

    await a.record(turn("s1", 400));
    await b.record(turn("s1", 400)); // recorded on the other instance
    expect((await a.session("s1")).total).toBe(800);
    expect(await b.overBudget("s1")).toBe(false); // 800 < 1000, seen cross-instance

    await b.record(turn("s1", 300));
    expect(await a.overBudget("s1")).toBe(true); // 1100 ≥ 1000, seen on instance a
  });

  it("global snapshot counts distinct sessions across instances", async () => {
    const redis = new FakeRedis();
    const a = new RedisUsageTracker(redis);
    const b = new RedisUsageTracker(redis);
    await a.record(turn("s1", 100));
    await b.record(turn("s2", 200));
    await a.record(turn("s1", 100));

    const snap = await a.global();
    expect(snap.sessions).toBe(2);
    expect(snap.total).toBe(400);
    expect(snap.turns).toBe(3);
  });

  it("never flags over budget when the cap is disabled (0)", async () => {
    const redis = new FakeRedis();
    const t = new RedisUsageTracker(redis, 0);
    await t.record(turn("s1", 999_999));
    expect(await t.overBudget("s1")).toBe(false);
  });
});
