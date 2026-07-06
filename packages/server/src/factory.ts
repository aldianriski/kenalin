import { join } from "node:path";
import type { KenalinConfig } from "@kenalin/core";
import { LocalKnowledgeStore } from "./knowledge/local-store.js";
import { selectEmbedder } from "./embeddings/index.js";
import { selectChatProvider } from "./chat/index.js";
import type { AppDeps } from "./app.js";

export interface BuildDepsOptions {
  /** Directory containing chunks.jsonl (default `<rootDir>/content/index`). */
  indexDir?: string;
  rootDir?: string;
  /** Force an embedder; otherwise inferred (gemini if key, else hash). */
  embedderKind?: "gemini" | "hash";
  log?: (event: Record<string, unknown>) => void;
}

/**
 * Assemble the orchestrator/app dependencies from a validated config: load the
 * local knowledge index, pick the embedder + chat provider, and calibrate the
 * retrieval threshold to the embedder.
 */
export async function buildAppDeps(
  config: KenalinConfig,
  opts: BuildDepsOptions = {},
): Promise<AppDeps> {
  const rootDir = opts.rootDir ?? process.cwd();
  const indexDir = opts.indexDir ?? join(rootDir, "content", "index");
  const store = await LocalKnowledgeStore.load(indexDir);
  const embedder = selectEmbedder({ kind: opts.embedderKind });
  const chat = selectChatProvider();
  // The lexical hash embedder needs a lower cosine floor than Gemini's 768-dim.
  const retrievalThreshold = embedder.name === "hash-local" ? 0.08 : undefined;
  return { config, store, embedder, chat, retrievalThreshold, log: opts.log };
}
