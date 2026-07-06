import { describe, expect, it } from "vitest";
import { MemoryResponseCache, responseCacheKey } from "./response-cache.js";
import type { ChatResponse } from "@kenalin/core";

const resp = (answer: string): ChatResponse => ({ answer }) as ChatResponse;

describe("responseCacheKey", () => {
  const chunksA = [{ id: "quickhub", content: "QuickHub is an approval tool." }];
  const chunksB = [{ id: "ledgerlens", content: "LedgerLens is a reconciliation dashboard." }];

  it("is stable for the same query + language + evidence", () => {
    expect(responseCacheKey("What is QuickHub?", "en", chunksA)).toBe(
      responseCacheKey("what is   quickhub?", "en", chunksA), // normalized (case + whitespace)
    );
  });

  it("differs when the retrieved evidence differs (no cross-entity hit — D2)", () => {
    // Same question text, different retrieved chunks → different key → a miss.
    expect(responseCacheKey("Tell me about it", "en", chunksA)).not.toBe(
      responseCacheKey("Tell me about it", "en", chunksB),
    );
  });

  it("differs when a chunk's CONTENT changes (re-ingest self-invalidates)", () => {
    const changed = [{ id: "quickhub", content: "QuickHub is a DIFFERENT tool now." }];
    expect(responseCacheKey("What is QuickHub?", "en", chunksA)).not.toBe(
      responseCacheKey("What is QuickHub?", "en", changed),
    );
  });

  it("differs by language", () => {
    expect(responseCacheKey("q", "id", chunksA)).not.toBe(responseCacheKey("q", "en", chunksA));
  });
});

describe("MemoryResponseCache", () => {
  it("round-trips and returns a clone (caller mutation can't corrupt the cache)", () => {
    const c = new MemoryResponseCache();
    c.set("k", resp("hello"));
    const got = c.get("k")!;
    expect(got.answer).toBe("hello");
    got.answer = "mutated";
    expect(c.get("k")!.answer).toBe("hello");
  });

  it("misses on an unknown key", () => {
    expect(new MemoryResponseCache().get("nope")).toBeUndefined();
  });

  it("evicts the oldest entry past the cap", () => {
    const c = new MemoryResponseCache(2);
    c.set("a", resp("A"));
    c.set("b", resp("B"));
    c.set("c", resp("C")); // evicts "a"
    expect(c.get("a")).toBeUndefined();
    expect(c.get("b")!.answer).toBe("B");
    expect(c.get("c")!.answer).toBe("C");
  });
});
