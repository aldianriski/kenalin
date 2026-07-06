import type { ContentType } from "@kenalin/core";

/**
 * A loaded, pre-chunk document from any source. The pipeline chunks these,
 * attaches metadata, embeds, and writes the index.
 */
export interface RawDocument {
  /** Stable id derived from the source (used to make chunk ids deterministic). */
  sourceId: string;
  type: ContentType;
  title: string;
  url?: string;
  projectId?: string;
  topics: string[];
  content: string;
}

export interface SourceLoadResult {
  /** Human-readable label for the manifest (e.g. file path or URL). */
  source: string;
  documents: RawDocument[];
}
