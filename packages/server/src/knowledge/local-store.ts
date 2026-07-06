import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  rankChunks,
  type Intent,
  type KnowledgeChunk,
  type KnowledgeSearchOptions,
  type KnowledgeStore,
  type ScoredChunk,
} from "@kenalin/core";

/**
 * Local KnowledgeStore (PRD D4): loads `chunks.jsonl` into memory and answers
 * searches with brute-force cosine (via core's `rankChunks`). Portfolio scale
 * (10²–10³ chunks) makes an in-memory scan the right call — see ADR-002.
 */
export class LocalKnowledgeStore implements KnowledgeStore {
  private constructor(private readonly chunks: KnowledgeChunk[]) {}

  /** Build directly from in-memory chunks (used by tests + after ingest). */
  static fromChunks(chunks: KnowledgeChunk[]): LocalKnowledgeStore {
    return new LocalKnowledgeStore(chunks);
  }

  /** Load an index directory written by the ingest pipeline. */
  static async load(indexDir: string): Promise<LocalKnowledgeStore> {
    const raw = await readFile(join(indexDir, "chunks.jsonl"), "utf8");
    const chunks = raw
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as KnowledgeChunk);
    return new LocalKnowledgeStore(chunks);
  }

  get size(): number {
    return this.chunks.length;
  }

  async search(
    queryVector: number[],
    opts: KnowledgeSearchOptions & { intent?: Intent; threshold?: number },
  ): Promise<ScoredChunk[]> {
    const filter = opts.filter;
    // Retrieval-time visibility gate (FR-K3): only `public` is ever retrievable.
    const wantVisibility = filter?.visibility ?? "public";
    let candidates = this.chunks.filter((c) => c.visibility === wantVisibility);
    if (filter?.types?.length) {
      candidates = candidates.filter((c) => filter.types!.includes(c.type));
    }
    // The cosine floor is calibrated per embedder (Gemini 768-dim vs the lexical
    // hash embedder); callers may override the core default.
    return rankChunks(queryVector, candidates, {
      topK: opts.topK,
      ctx: { intent: opts.intent, projectId: filter?.projectId },
      threshold: opts.threshold,
    });
  }
}
