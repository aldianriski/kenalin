import type { EmbeddingProvider } from "@kenalin/core";
import { HashEmbeddingProvider } from "./hash.js";
import { GeminiEmbeddingProvider } from "./gemini.js";
import { resolveLlmApiKey } from "../env.js";

export { HashEmbeddingProvider } from "./hash.js";
export { GeminiEmbeddingProvider } from "./gemini.js";

export type EmbedderKind = "gemini" | "hash";

export interface SelectEmbedderOptions {
  /** Force a specific embedder; otherwise inferred from the environment. */
  kind?: EmbedderKind;
  apiKey?: string;
}

/**
 * Pick an embedding provider. Prefers Gemini when a key is available; falls
 * back to the deterministic hash embedder (offline dev / CI / demo).
 */
export function selectEmbedder(opts: SelectEmbedderOptions = {}): EmbeddingProvider {
  const kind = opts.kind ?? (opts.apiKey || resolveLlmApiKey() ? "gemini" : "hash");
  if (kind === "gemini") {
    const apiKey = opts.apiKey ?? resolveLlmApiKey();
    if (!apiKey) {
      throw new Error("gemini embedder requested but no API key found (set KENALIN_LLM_API_KEY)");
    }
    return new GeminiEmbeddingProvider({ apiKey });
  }
  return new HashEmbeddingProvider();
}
