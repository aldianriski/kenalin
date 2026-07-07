import type { Intent } from "../schemas/primitives.js";
import type { ContentType } from "../schemas/primitives.js";
import type { KnowledgeChunk, ScoredChunk } from "../schemas/knowledge.js";
import { RETRIEVAL_SCORE_THRESHOLD } from "../policy/constants.js";

/**
 * Pure retrieval scoring (PRD D5). `core` owns the math; the `server`
 * KnowledgeStore supplies the chunks + query vector and calls these helpers.
 */

/** Cosine similarity between two equal-length vectors. Returns 0 on mismatch/zero. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i] as number;
    const y = b[i] as number;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * Per-intent content-type priors (PRD D5 step 4): hiring boosts experience|project,
 * business boosts service|case_study. Returns a multiplier for a chunk type.
 */
export function typePriorForIntent(intent: Intent, type: ContentType): number {
  const priors: Partial<Record<Intent, ContentType[]>> = {
    hiring: ["experience", "project"],
    business_opportunity: ["service", "case_study"],
    partnership: ["service", "case_study", "project"],
    explore: ["project", "case_study", "profile"],
  };
  const boosted = priors[intent];
  return boosted?.includes(type) ? 1.25 : 1;
}

export interface BoostContext {
  intent?: Intent;
  /** Page-context project — matching chunks get a ×1.5 boost (PRD D5). */
  projectId?: string;
}

/** Apply metadata boosts to a raw cosine score for one chunk (PRD D5 step 4). */
export function boostedScore(
  rawScore: number,
  chunk: KnowledgeChunk,
  ctx: BoostContext,
): number {
  let score = rawScore;
  if (ctx.projectId && chunk.projectId === ctx.projectId) score *= 1.5;
  if (ctx.intent) score *= typePriorForIntent(ctx.intent, chunk.type);
  return score;
}

/**
 * Rank chunks against a query vector: cosine → metadata boosts → threshold
 * filter → topK. Chunks scoring below the cosine floor are dropped ("no evidence").
 */
export function rankChunks(
  queryVector: number[],
  chunks: KnowledgeChunk[],
  opts: { topK: number; ctx?: BoostContext; threshold?: number },
): ScoredChunk[] {
  const threshold = opts.threshold ?? RETRIEVAL_SCORE_THRESHOLD;
  const ctx = opts.ctx ?? {};
  const scored: ScoredChunk[] = [];
  for (const chunk of chunks) {
    if (!chunk.vector) continue;
    const raw = cosineSimilarity(queryVector, chunk.vector);
    // Threshold is applied on the RAW cosine (semantic match), before boosts —
    // boosts re-rank relevant chunks, they don't rescue irrelevant ones.
    if (raw < threshold) continue;
    scored.push({ chunk, score: boostedScore(raw, chunk, ctx) });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, opts.topK);
}

/**
 * Collapse localized/duplicate variants of one project to a single evidence chunk
 * (TASK-017). Chunks sharing a `projectId` are grouped; within a group the chunk whose
 * url matches the conversation language (`/{language}/`) wins, else the highest-scored
 * (input is assumed score-sorted). Chunks without a projectId pass through unchanged;
 * relative order is preserved. Prevents the same case study appearing as two cards
 * (its id + en chunks) in the evidence list.
 */
export function dedupeByProject(scored: ScoredChunk[], language: string): ScoredChunk[] {
  const byProject = new Map<string, ScoredChunk>();
  const out: ScoredChunk[] = [];
  const langSeg = `/${language}/`;
  for (const s of scored) {
    const pid = s.chunk.projectId;
    if (!pid) {
      out.push(s);
      continue;
    }
    const existing = byProject.get(pid);
    if (!existing) {
      byProject.set(pid, s);
      out.push(s);
      continue;
    }
    const sMatches = s.chunk.url?.includes(langSeg) ?? false;
    const eMatches = existing.chunk.url?.includes(langSeg) ?? false;
    if ((sMatches && !eMatches) || (sMatches === eMatches && s.score > existing.score)) {
      const idx = out.indexOf(existing);
      if (idx >= 0) out[idx] = s;
      byProject.set(pid, s);
    }
  }
  return out;
}
