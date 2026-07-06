import type { ContentType } from "../schemas/primitives.js";
import type { ScoredChunk } from "../schemas/knowledge.js";
import type { Lead } from "../schemas/lead.js";

/**
 * Store interfaces (PRD D4). Concrete implementations live in `server`:
 * a local JSONL+vectors index for MVP, a SQLite lead store, webhook emit.
 */

export interface KnowledgeSearchOptions {
  topK: number;
  filter?: {
    types?: ContentType[];
    projectId?: string;
    /** Locked to "public" — the curation gate guarantees nothing else is retrievable. */
    visibility: "public";
  };
}

export interface KnowledgeStore {
  search(queryVector: number[], opts: KnowledgeSearchOptions): Promise<ScoredChunk[]>;
}

export interface LeadStore {
  save(lead: Lead): Promise<void>;
}
