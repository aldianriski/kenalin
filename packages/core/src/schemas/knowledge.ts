import { z } from "zod";
import { ContentTypeSchema } from "./primitives.js";

/**
 * Knowledge data contracts (PRD E4, E6).
 */

/**
 * A single retrievable chunk of curated public knowledge about the owner.
 * `visibility` is locked to "public" — the curation gate (FR-K3) guarantees
 * nothing else is ever retrievable.
 */
export const KnowledgeChunkSchema = z
  .object({
    id: z.string().min(1),
    type: ContentTypeSchema,
    title: z.string().min(1),
    url: z.string().url().optional(),
    topics: z.array(z.string()).default([]),
    visibility: z.literal("public"),
    owner: z.string().min(1),
    projectId: z.string().optional(),
    content: z.string().min(1),
    /** Embedding vector; absent until the ingest embed step runs. */
    vector: z.array(z.number()).optional(),
  })
  .refine(
    // Chunks missing `url` are allowed only for profile | skill | custom (PRD FR-K2 AC).
    (c) => c.url !== undefined || ["profile", "skill", "custom"].includes(c.type),
    { message: "chunk missing `url` is only allowed for type profile | skill | custom", path: ["url"] },
  );
export type KnowledgeChunk = z.infer<typeof KnowledgeChunkSchema>;

/**
 * An evidence item shown to the visitor to back a claim about the owner.
 * Every evidence id must trace back to a retrieved chunk (validated in the policy layer).
 */
export const EvidenceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url().optional(),
  type: ContentTypeSchema,
  snippet: z.string().optional(),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

/** A chunk with its cosine similarity score, returned by KnowledgeStore.search. */
export const ScoredChunkSchema = z.object({
  chunk: KnowledgeChunkSchema,
  score: z.number(),
});
export type ScoredChunk = z.infer<typeof ScoredChunkSchema>;
