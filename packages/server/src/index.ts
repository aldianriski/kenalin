/**
 * @kenalin/server — the I/O layer: config loading, ingest pipeline, local
 * knowledge store, embedding + chat providers, the single-pass orchestrator,
 * and the Hono API app. Consumed by the dev server and host integrations
 * (e.g. a Next.js API route on the reference portfolio).
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
export { selectChatProvider, GeminiChatProvider, FakeChatProvider } from "./chat/index.js";
export { Orchestrator } from "./orchestrator/orchestrator.js";
export type {
  OrchestratorDeps,
  OrchestrationResult,
  RetrievalStore,
} from "./orchestrator/orchestrator.js";
export { createApp } from "./app.js";
export type { AppDeps } from "./app.js";
export { buildAppDeps } from "./factory.js";
export type { BuildDepsOptions } from "./factory.js";
export { toPublicConfig } from "./public-config.js";
export type { PublicConfig } from "./public-config.js";
export { RateLimiter } from "./rate-limit.js";
export { guardRequest } from "./guard.js";
export type { GuardResult } from "./guard.js";
export { UsageTracker, estimateTokens } from "./usage.js";
export type { TurnUsage, SessionUsage, UsageSnapshot } from "./usage.js";
export { WebhookEmitter, signPayload } from "./webhook.js";
export {
  selectLeadStore,
  NoneLeadStore,
  WebhookLeadStore,
  CompositeLeadStore,
  SqliteLeadStore,
} from "./lead-store/index.js";
export { loadDotEnv } from "./dotenv.js";
export { resolveLlmApiKey, resolveWebhookSecret, resolvePort } from "./env.js";
