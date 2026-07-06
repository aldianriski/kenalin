import { join } from "node:path";
import type { KenalinConfig } from "@kenalin/core";
import { LocalKnowledgeStore } from "./knowledge/local-store.js";
import { selectEmbedder } from "./embeddings/index.js";
import { selectChatProvider } from "./chat/index.js";
import { selectLeadStore } from "./lead-store/index.js";
import { WebhookEmitter } from "./webhook.js";
import { resolveRedisConfig, resolveWebhookSecret } from "./env.js";
import { UpstashRedis } from "./redis.js";
import { RateLimiter, RedisRateLimiter, type RateLimiterLike } from "./rate-limit.js";
import { RedisUsageTracker, UsageTracker, type UsageStore } from "./usage.js";
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
  // Cosine floor calibrated per embedder. 0.45 keeps real matches while the
  // prompt's "only cite evidence that names the thing asked about" rule handles
  // unknown-entity queries; the lexical hash embedder needs a much lower floor.
  const retrievalThreshold = embedder.name === "hash-local" ? 0.08 : 0.45;

  const webhookSecret = resolveWebhookSecret();
  const leadStore = await selectLeadStore(config, { webhookSecret, dataDir: rootDir, log: opts.log });
  const webhookEmitter = config.handoff.webhook
    ? new WebhookEmitter({ url: config.handoff.webhook.url, secret: webhookSecret }, opts.log)
    : undefined;

  // Distributed rate limit + usage counters when Upstash is configured (TASK-007),
  // else the in-memory implementations (per-instance) — graceful fallback (D1).
  const { limiter, usage } = selectStateStores(config, opts.log);

  return {
    config,
    store,
    embedder,
    chat,
    retrievalThreshold,
    leadStore,
    webhookEmitter,
    limiter,
    usage,
    log: opts.log,
  };
}

/**
 * Pick Redis-backed or in-memory limiter + usage tracker from env. A single shared
 * Redis client serves both; missing/partial Upstash env falls back to in-memory.
 */
function selectStateStores(
  config: KenalinConfig,
  log?: (event: Record<string, unknown>) => void,
): { limiter: RateLimiterLike; usage: UsageStore } {
  const redisConfig = resolveRedisConfig();
  if (!redisConfig) {
    return { limiter: new RateLimiter(config.server.rateLimit), usage: new UsageTracker() };
  }
  log?.({ event: "state_store", backend: "upstash" });
  const redis = new UpstashRedis(redisConfig);
  return {
    limiter: new RedisRateLimiter(redis, config.server.rateLimit),
    usage: new RedisUsageTracker(redis),
  };
}
