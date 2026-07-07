import { describe, it, expect } from "vitest";
import { cosineSimilarity, rankChunks, typePriorForIntent, boostedScore, dedupeByProject } from "./scoring.js";
import type { KnowledgeChunk } from "../schemas/knowledge.js";

function chunk(id: string, vector: number[], extra: Partial<KnowledgeChunk> = {}): KnowledgeChunk {
  return {
    id,
    type: "case_study",
    title: id,
    url: "https://demo.example/" + id,
    topics: [],
    visibility: "public",
    owner: "Demo",
    content: id,
    vector,
    ...extra,
  };
}

describe("cosineSimilarity", () => {
  it("is 1 for identical, 0 for orthogonal", () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });
  it("handles length mismatch / zero safely", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2])).toBe(0);
    expect(cosineSimilarity([0, 0], [0, 0])).toBe(0);
  });
});

describe("rankChunks", () => {
  it("drops chunks below the cosine threshold", () => {
    const q = [1, 0, 0];
    const chunks = [chunk("hit", [1, 0, 0]), chunk("miss", [0, 1, 0])];
    const ranked = rankChunks(q, chunks, { topK: 5, threshold: 0.35 });
    expect(ranked.map((r) => r.chunk.id)).toEqual(["hit"]);
  });

  it("boosts a projectId match above a marginally-better raw match", () => {
    const q = [1, 0, 0];
    const chunks = [
      chunk("plain", [0.95, 0.31, 0]),
      chunk("proj", [0.9, 0.44, 0], { projectId: "quickhub" }),
    ];
    const ranked = rankChunks(q, chunks, { topK: 5, ctx: { projectId: "quickhub" } });
    expect(ranked[0]?.chunk.id).toBe("proj");
  });

  it("respects topK", () => {
    const q = [1, 0, 0];
    const chunks = [chunk("a", [1, 0, 0]), chunk("b", [0.9, 0.1, 0]), chunk("c", [0.8, 0.2, 0])];
    expect(rankChunks(q, chunks, { topK: 2 })).toHaveLength(2);
  });
});

describe("dedupeByProject (TASK-017)", () => {
  const sc = (id: string, projectId: string | undefined, url: string, score: number) => ({
    chunk: chunk(id, [1, 0, 0], { projectId, url }),
    score,
  });

  it("collapses same-project variants, preferring the conversation language", () => {
    const scored = [
      sc("id#0", "gbu", "https://x/id/case-studies/gbu", 0.9),
      sc("en#0", "gbu", "https://x/en/case-studies/gbu", 0.85),
      sc("qh#0", "quickhub", "https://x/en/case-studies/quickhub", 0.8),
    ];
    const out = dedupeByProject(scored, "en");
    expect(out).toHaveLength(2);
    expect(out.map((s) => s.chunk.projectId)).toEqual(["gbu", "quickhub"]);
    // the en variant of gbu wins even though the id variant scored higher
    expect(out[0]!.chunk.url).toContain("/en/");
  });

  it("keeps the highest-scored when no url matches the language; passes through no-projectId chunks", () => {
    const scored = [
      sc("a", undefined, "https://x/en/a", 0.9),
      sc("g1", "g", "https://x/id/g", 0.7),
      sc("g2", "g", "https://x/id/g", 0.6),
    ];
    const out = dedupeByProject(scored, "en");
    expect(out).toHaveLength(2);
    expect(out[1]!.chunk.id).toBe("g1"); // higher score kept
  });
});

describe("type priors", () => {
  it("hiring boosts experience/project", () => {
    expect(typePriorForIntent("hiring", "experience")).toBeGreaterThan(1);
    expect(typePriorForIntent("hiring", "testimonial")).toBe(1);
  });
  it("boostedScore compounds project + intent boosts", () => {
    const c = chunk("x", [1, 0, 0], { type: "project", projectId: "p1" });
    expect(boostedScore(1, c, { intent: "hiring", projectId: "p1" })).toBeCloseTo(1.5 * 1.25);
  });
});
