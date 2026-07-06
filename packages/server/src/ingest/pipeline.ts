import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import {
  chunkText,
  type EmbeddingProvider,
  type KenalinConfig,
  type KnowledgeChunk,
} from "@kenalin/core";
import type { RawDocument, SourceLoadResult } from "./types.js";
import { loadMarkdown } from "./sources/markdown.js";
import { loadJson } from "./sources/json.js";
import { loadUrl } from "./sources/url.js";
import { loadSitemap } from "./sources/sitemap.js";
import { loadPdf } from "./sources/pdf.js";

export interface IngestOptions {
  /** Root the config's relative source paths resolve against (repo root). */
  rootDir: string;
  /** Where to write the index. Default: `<rootDir>/content/index`. */
  outDir?: string;
  embedder: EmbeddingProvider;
}

export interface IngestManifest {
  owner: string;
  embedder: string;
  dimensions: number;
  chunkCount: number;
  sources: { source: string; documents: number; chunks: number }[];
  /** Deterministic content hash — stable across identical re-runs (idempotency). */
  contentHash: string;
}

export interface IngestResult {
  manifest: IngestManifest;
  chunks: KnowledgeChunk[];
  outDir: string;
}

async function loadSource(
  kind: string,
  path: string,
  rootDir: string,
): Promise<SourceLoadResult> {
  switch (kind) {
    case "markdown":
      return loadMarkdown(path, rootDir);
    case "json":
      return loadJson(path, rootDir);
    case "url":
      return loadUrl(path);
    case "sitemap":
      return loadSitemap(path);
    case "pdf":
      return loadPdf(path, rootDir);
    default:
      throw new Error(`unknown knowledge source kind: ${kind}`);
  }
}

/** Deterministic FNV-1a hex over a string — used for the manifest content hash. */
function hashString(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function documentsToChunks(docs: RawDocument[], owner: string): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];
  for (const doc of docs) {
    const parts = chunkText(doc.content);
    // A document with no splittable body still yields one chunk from its title.
    const effective = parts.length ? parts : [{ content: doc.content || doc.title, index: 0 }];
    for (const part of effective) {
      chunks.push({
        id: effective.length > 1 ? `${doc.sourceId}#${part.index}` : doc.sourceId,
        type: doc.type,
        title: doc.title,
        url: doc.url,
        topics: doc.topics,
        visibility: "public",
        owner,
        projectId: doc.projectId,
        content: part.content,
      });
    }
  }
  // Deterministic order → idempotent output.
  chunks.sort((a, b) => a.id.localeCompare(b.id));
  return chunks;
}

/**
 * Run the full ingest pipeline: load all configured sources → chunk → attach
 * metadata → embed → write index (chunks.jsonl + meta) + human-review manifest.
 * Deterministic: identical inputs produce byte-identical output (idempotent).
 */
export async function ingest(config: KenalinConfig, opts: IngestOptions): Promise<IngestResult> {
  const owner = config.owner.name;
  const outDir = opts.outDir ?? join(opts.rootDir, "content", "index");

  const loaded: SourceLoadResult[] = [];
  for (const src of config.knowledge.sources) {
    loaded.push(await loadSource(src.kind, src.path, opts.rootDir));
  }

  const perSource = loaded.map((r) => ({ result: r, chunks: documentsToChunks(r.documents, owner) }));
  const chunks = perSource.flatMap((p) => p.chunks).sort((a, b) => a.id.localeCompare(b.id));

  // Embed (batched by the provider).
  const vectors = await opts.embedder.embed(chunks.map((c) => c.content));
  chunks.forEach((c, i) => {
    c.vector = vectors[i];
  });

  const contentHash = hashString(chunks.map((c) => `${c.id}:${c.content}`).join("\n"));
  const manifest: IngestManifest = {
    owner,
    embedder: opts.embedder.name,
    dimensions: opts.embedder.dimensions,
    chunkCount: chunks.length,
    sources: perSource.map((p) => ({
      source: p.result.source,
      documents: p.result.documents.length,
      chunks: p.chunks.length,
    })),
    contentHash,
  };

  await mkdir(outDir, { recursive: true });
  const jsonl = chunks.map((c) => JSON.stringify(c)).join("\n") + (chunks.length ? "\n" : "");
  await writeFile(join(outDir, "chunks.jsonl"), jsonl, "utf8");
  await writeFile(
    join(outDir, "index.meta.json"),
    JSON.stringify({ embedder: manifest.embedder, dimensions: manifest.dimensions, chunkCount: manifest.chunkCount, contentHash }, null, 2) + "\n",
    "utf8",
  );
  // The curation manifest lives beside the index (…/content/index.manifest.json
  // for the default layout) for human review (PRD FR-K3).
  await writeFile(
    resolve(outDir, "..", "index.manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
    "utf8",
  );

  return { manifest, chunks, outDir };
}
