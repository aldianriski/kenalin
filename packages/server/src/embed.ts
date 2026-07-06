/**
 * Host-embed adapter — a framework-agnostic engine for mounting Kenalin inside
 * another app (e.g. a Next.js route handler). Deliberately imports NONE of the
 * Hono app or the jiti config loader, so a self-contained bundle can be vendored
 * into a host repo without dragging a web framework or a TS loader along.
 */
import {
  loadConfig,
  type ChatRequest,
  type ChatResponse,
  type KenalinConfigInput,
  type KnowledgeChunk,
} from "@kenalin/core";
import { Orchestrator } from "./orchestrator/orchestrator.js";
import { LocalKnowledgeStore } from "./knowledge/local-store.js";
import { GeminiChatProvider } from "./chat/gemini.js";
import { GeminiEmbeddingProvider } from "./embeddings/gemini.js";
import { toPublicConfig, type PublicConfig } from "./public-config.js";
import { guardRequest, type GuardResult } from "./guard.js";

export interface KenalinEngineOptions {
  /** Raw config object (validated here). */
  config: KenalinConfigInput;
  /** Pre-loaded knowledge chunks (import your index JSON and pass it). */
  chunks: KnowledgeChunk[];
  /** Gemini API key. Falls back to env at call sites that read it. */
  apiKey: string;
  /** Chat model override. */
  chatModel?: string;
  /** Retrieval cosine floor (default 0.45, calibrated for gemini-embedding-001). */
  retrievalThreshold?: number;
  log?: (e: Record<string, unknown>) => void;
}

export interface KenalinEngine {
  handleChat(request: ChatRequest): Promise<ChatResponse>;
  publicConfig(): PublicConfig;
  /** Cheap pre-LLM abuse guard — call before handleChat and honor the status. */
  guard(request: ChatRequest): GuardResult;
}

/**
 * Build a ready-to-serve engine. The host wraps `handleChat` in its own route
 * (streaming or not) and exposes `publicConfig` for the widget bootstrap.
 */
export function createKenalinEngine(opts: KenalinEngineOptions): KenalinEngine {
  const config = loadConfig(opts.config);
  const store = LocalKnowledgeStore.fromChunks(opts.chunks);
  const embedder = new GeminiEmbeddingProvider({ apiKey: opts.apiKey });
  const chat = new GeminiChatProvider({ apiKey: opts.apiKey, model: opts.chatModel });
  const orchestrator = new Orchestrator({
    config,
    store,
    embedder,
    chat,
    retrievalThreshold: opts.retrievalThreshold ?? 0.45,
    log: opts.log,
  });
  return {
    async handleChat(request: ChatRequest): Promise<ChatResponse> {
      const { response } = await orchestrator.handle(request);
      return response;
    },
    publicConfig: () => toPublicConfig(config),
    guard: (request: ChatRequest) => guardRequest(request),
  };
}

export { loadConfig, LIMITS } from "@kenalin/core";
export { toPublicConfig } from "./public-config.js";
export { guardRequest } from "./guard.js";
export type { GuardResult } from "./guard.js";
export type { ChatRequest, ChatResponse, PublicConfig, KnowledgeChunk, KenalinConfigInput };
