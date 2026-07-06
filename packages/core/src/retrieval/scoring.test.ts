import { describe, it, expect } from "vitest";
import { cosineSimilarity, rankChunks, typePriorForIntent, boostedScore } from "./scoring.js";
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
