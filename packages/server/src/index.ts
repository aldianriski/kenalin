/**
 * @kenalin/server — the I/O layer: config file loading, ingest pipeline,
 * local knowledge store, and embedding providers. The Hono API app and Gemini
 * chat provider land in Phase 2.
 */

export const KENALIN_SERVER_VERSION = "0.1.0";

export { loadConfigFile } from "./config/load-file.js";
export { ingest } from "./ingest/pipeline.js";
export type { IngestOptions, IngestManifest, IngestResult } from "./ingest/pipeline.js";
export { LocalKnowledgeStore } from "./knowledge/local-store.js";
export {
  selectEmbedder,
  HashEmbeddingProvider,
  GeminiEmbeddingProvider,
  type EmbedderKind,
} from "./embeddings/index.js";
export { resolveLlmApiKey, resolveWebhookSecret, resolvePort } from "./env.js";
