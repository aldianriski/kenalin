import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { loadConfig, type KenalinConfig } from "@kenalin/core";
import { ingest } from "./pipeline.js";
import { HashEmbeddingProvider } from "../embeddings/hash.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../../..");

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

describe("ingest pipeline (demo content)", () => {
  let outA: string;
  let outB: string;

  beforeAll(async () => {
    outA = await mkdtemp(join(tmpdir(), "kenalin-a-"));
    outB = await mkdtemp(join(tmpdir(), "kenalin-b-"));
  });

  it("produces chunks with public visibility and required metadata", async () => {
    const res = await ingest(demoConfig(), {
      rootDir: repoRoot,
      outDir: outA,
      embedder: new HashEmbeddingProvider(),
    });
    expect(res.chunks.length).toBeGreaterThan(0);
    for (const c of res.chunks) {
      expect(c.visibility).toBe("public");
      expect(c.owner).toBe("Sari Wibowo");
      expect(c.vector?.length).toBe(512);
    }
    // case studies carry projectId from frontmatter
    expect(res.chunks.some((c) => c.projectId === "quickhub")).toBe(true);
    expect(res.chunks.some((c) => c.projectId === "ledgerlens")).toBe(true);
  });

  it("is idempotent — a re-run yields an identical index + content hash", async () => {
    const r1 = await ingest(demoConfig(), { rootDir: repoRoot, outDir: outB, embedder: new HashEmbeddingProvider() });
    const jsonl1 = await readFile(join(outB, "chunks.jsonl"), "utf8");
    const r2 = await ingest(demoConfig(), { rootDir: repoRoot, outDir: outB, embedder: new HashEmbeddingProvider() });
    const jsonl2 = await readFile(join(outB, "chunks.jsonl"), "utf8");
    expect(jsonl1).toBe(jsonl2);
    expect(r1.manifest.contentHash).toBe(r2.manifest.contentHash);
  });

  it("writes a curation manifest listing every source + chunk count", async () => {
    await ingest(demoConfig(), { rootDir: repoRoot, outDir: outA, embedder: new HashEmbeddingProvider() });
    const manifest = JSON.parse(await readFile(resolve(repoRoot, "content", "index.manifest.json"), "utf8"));
    expect(manifest.sources.length).toBe(2);
    expect(manifest.chunkCount).toBeGreaterThan(0);
    expect(manifest.embedder).toBe("hash-local");
  });

  afterAll(async () => {
    await rm(outA, { recursive: true, force: true });
    await rm(outB, { recursive: true, force: true });
  });
});
