import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadConfig, type KenalinConfig, type KnowledgeChunk } from "@kenalin/core";
import { ingest } from "../ingest/pipeline.js";
import { HashEmbeddingProvider } from "../embeddings/hash.js";
import { LocalKnowledgeStore } from "./local-store.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../../..");
const embedder = new HashEmbeddingProvider();

function demoConfig(): KenalinConfig {
  return loadConfig({
    owner: { name: "Sari Wibowo", role: "Engineer", website: "https://demo.kenalin.dev" },
    assistant: { name: "NARA" },
    handoff: { email: { address: "hi@demo.kenalin.dev" } },
    knowledge: {
      sources: [
        { kind: "json", path: "content/demo/profile.json" },
        { kind: "markdown", path: "content/demo/case-studies" },
      ],
    },
  });
}

async function embedQuery(q: string): Promise<number[]> {
  return (await embedder.embed([q]))[0]!;
}

describe("local retrieval (golden queries)", () => {
  let store: LocalKnowledgeStore;
  let out: string;

  beforeAll(async () => {
    out = await mkdtemp(join(tmpdir(), "kenalin-r-"));
    const { chunks } = await ingest(demoConfig(), { rootDir: repoRoot, outDir: out, embedder });
    store = LocalKnowledgeStore.fromChunks(chunks);
  });

  const golden: { q: string; expectProject: string }[] = [
    { q: "approval workflow automation logistics auditable dispatch", expectProject: "quickhub" },
    { q: "reconciliation dashboard payments settlement mismatch drill-down", expectProject: "ledgerlens" },
  ];

  for (const { q, expectProject } of golden) {
    it(`"${q.slice(0, 32)}…" → ${expectProject}`, async () => {
      const vec = await embedQuery(q);
      const results = await store.search(vec, { topK: 5, filter: { visibility: "public" }, threshold: 0.05 });
      expect(results.length).toBeGreaterThan(0);
      // The relevant case study is retrieved among the top results (the
      // orchestrator uses the whole retrieved set as evidence).
      expect(results.some((r) => r.chunk.projectId === expectProject)).toBe(true);
    });
  }

  it("returns nothing for an unrelated query above the real threshold", async () => {
    const vec = await embedQuery("quantum astrophysics recipe gardening");
    const results = await store.search(vec, { topK: 5, filter: { visibility: "public" } });
    expect(results).toHaveLength(0);
  });

  it("projectId filter + boost surfaces the matching project first", async () => {
    const vec = await embedQuery("what was the role on this project");
    const results = await store.search(vec, {
      topK: 5,
      filter: { visibility: "public", projectId: "quickhub" },
      threshold: 0,
    });
    expect(results[0]?.chunk.projectId).toBe("quickhub");
  });

  afterAll(async () => {
    await rm(out, { recursive: true, force: true });
  });
});

describe("visibility gate (FR-K3)", () => {
  it("never retrieves a non-public chunk, even with a top-matching vector", async () => {
    const vec = [1, 0, 0];
    const publicChunk: KnowledgeChunk = {
      id: "pub", type: "profile", title: "Public", topics: [], visibility: "public",
      owner: "Demo", content: "public", vector: [0.6, 0.1, 0],
    };
    // Bypass the schema (which locks visibility to "public") to simulate a
    // leaked internal chunk reaching the store.
    const internalChunk = {
      id: "int", type: "profile", title: "Internal", topics: [], visibility: "internal",
      owner: "Demo", content: "secret", vector: [1, 0, 0],
    } as unknown as KnowledgeChunk;

    const store = LocalKnowledgeStore.fromChunks([publicChunk, internalChunk]);
    const results = await store.search(vec, { topK: 5, filter: { visibility: "public" }, threshold: 0 });
    expect(results.some((r) => r.chunk.id === "int")).toBe(false);
    expect(results.some((r) => r.chunk.id === "pub")).toBe(true);
  });
});
