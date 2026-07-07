import { describe, it, expect } from "vitest";
import {
  serializeSession,
  deserializeSession,
  sessionKey,
  SESSION_VERSION,
} from "./session-store.js";

describe("session-store (TASK-013)", () => {
  it("round-trips sessionId, state, and messages", () => {
    const messages = [{ role: "user", content: "hi" }, { role: "assistant", content: "hello" }];
    const state = { intent: "explore", language: "en" };
    const restored = deserializeSession(serializeSession("s-1", state, messages));
    expect(restored?.sessionId).toBe("s-1");
    expect(restored?.state).toEqual(state);
    expect(restored?.messages).toEqual(messages);
    expect(restored?.v).toBe(SESSION_VERSION);
  });

  it("returns null for missing / corrupt / non-object input", () => {
    expect(deserializeSession(null)).toBeNull();
    expect(deserializeSession(undefined)).toBeNull();
    expect(deserializeSession("")).toBeNull();
    expect(deserializeSession("{not json")).toBeNull();
    expect(deserializeSession("42")).toBeNull();
  });

  it("rejects a version mismatch or a malformed payload", () => {
    expect(deserializeSession(JSON.stringify({ v: 999, sessionId: "s", messages: [] }))).toBeNull();
    expect(deserializeSession(JSON.stringify({ v: SESSION_VERSION, sessionId: 5, messages: [] }))).toBeNull();
    expect(deserializeSession(JSON.stringify({ v: SESSION_VERSION, sessionId: "s", messages: "no" }))).toBeNull();
  });

  it("namespaces the storage key by apiUrl", () => {
    expect(sessionKey("https://a.example")).not.toBe(sessionKey("https://b.example"));
    expect(sessionKey("https://a.example")).toContain("kenalin:session:");
  });
});
