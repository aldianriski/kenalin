import { describe, it, expect } from "vitest";
import { LIMITS, type ChatRequest } from "@kenalin/core";
import { guardRequest } from "./guard.js";

function req(over: Partial<ChatRequest>): ChatRequest {
  return { sessionId: "s", messages: [{ role: "user", content: "hi" }], state: {} as never, ...over } as ChatRequest;
}

describe("guardRequest", () => {
  it("allows a normal request", () => {
    expect(guardRequest(req({})).ok).toBe(true);
  });

  it("rejects an empty message list", () => {
    const r = guardRequest(req({ messages: [] }));
    expect(r).toEqual({ ok: false, error: "empty_messages", status: 400 });
  });

  it("rejects an over-long message (413)", () => {
    const r = guardRequest(req({ messages: [{ role: "user", content: "x".repeat(LIMITS.maxMessageChars + 1) }] }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(413);
  });

  it("rejects too many messages (400)", () => {
    const many = Array.from({ length: LIMITS.maxMessagesPerRequest + 1 }, () => ({ role: "user" as const, content: "hi" }));
    const r = guardRequest(req({ messages: many }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("too_many_messages");
  });

  it("rejects an over-long conversation (429)", () => {
    const turns = Array.from({ length: LIMITS.maxSessionTurns + 1 }, () => ({ role: "assistant" as const, content: "a" }));
    const r = guardRequest(req({ messages: [...turns, { role: "user", content: "hi" }] }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(429);
  });
});
