import { describe, it, expect } from "vitest";
import { UsageTracker, estimateTokens, type TurnUsage } from "./usage.js";

const turn = (sessionId: string, total: number): TurnUsage => ({
  sessionId,
  prompt: total * 0.6,
  completion: total * 0.3,
  embedding: total * 0.1,
  total,
});

describe("UsageTracker", () => {
  it("aggregates per-session and global totals", () => {
    const t = new UsageTracker();
    t.record(turn("a", 100));
    t.record(turn("a", 50));
    t.record(turn("b", 200));

    expect(t.session("a").total).toBe(150);
    expect(t.session("a").turns).toBe(2);
    expect(t.session("b").total).toBe(200);
    const g = t.global();
    expect(g.total).toBe(350);
    expect(g.turns).toBe(3);
    expect(g.sessions).toBe(2);
  });

  it("returns zeroed usage for an unknown session", () => {
    expect(new UsageTracker().session("nope").total).toBe(0);
  });

  it("flags a session over its token budget", () => {
    const t = new UsageTracker(1000);
    t.record(turn("a", 900));
    expect(t.overBudget("a")).toBe(false);
    t.record(turn("a", 200));
    expect(t.overBudget("a")).toBe(true);
    expect(t.overBudget("b")).toBe(false);
  });

  it("never flags when the cap is disabled (0)", () => {
    const t = new UsageTracker(0);
    t.record(turn("a", 10_000_000));
    expect(t.overBudget("a")).toBe(false);
  });

  it("estimateTokens approximates chars/4", () => {
    expect(estimateTokens("12345678")).toBe(2);
  });
});
