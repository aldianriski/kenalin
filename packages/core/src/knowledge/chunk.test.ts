import { describe, it, expect } from "vitest";
import { chunkText, estimateTokens } from "./chunk.js";

const para = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(" ");

describe("chunkText", () => {
  it("keeps a short doc as a single chunk", () => {
    const md = "# Title\n\nA short paragraph about the owner.";
    const chunks = chunkText(md);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.heading).toBe("Title");
  });

  it("splits a long doc into multiple bounded chunks with overlap", () => {
    // ~4 paragraphs of ~300 tokens each → multiple chunks.
    const md = ["# Big", "", para(225), "", para(225), "", para(225), "", para(225)].join("\n");
    const chunks = chunkText(md, { minTokens: 300, maxTokens: 500, overlapTokens: 50 });
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) {
      expect(estimateTokens(c.content)).toBeLessThanOrEqual(700); // max + overlap slack
    }
    // overlap: some word from the end of chunk 0 reappears at the start of chunk 1
    const firstTail = chunks[0]!.content.split(/\s+/).slice(-5);
    expect(firstTail.some((w) => chunks[1]!.content.startsWith(w) || chunks[1]!.content.includes(w))).toBe(true);
  });

  it("assigns headings per section", () => {
    const md = "# One\n\n" + para(10) + "\n\n## Two\n\n" + para(10);
    const chunks = chunkText(md);
    const headings = chunks.map((c) => c.heading);
    expect(headings).toContain("One");
    expect(headings).toContain("Two");
  });
});
