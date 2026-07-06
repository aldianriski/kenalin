/**
 * Env access — the single place secrets enter the server (PRD §D10).
 * Never logged, never returned in /api/config/public.
 */

/** Resolve the Gemini API key, accepting the documented fallbacks. */
export function resolveLlmApiKey(env: NodeJS.ProcessEnv = process.env): string | undefined {
  return (
    env.KENALIN_LLM_API_KEY ||
    env.GEMINI_API_KEY ||
    env.API_KEY_GEMINI ||
    env.API_KEY ||
    undefined
  );
}

export function resolveWebhookSecret(env: NodeJS.ProcessEnv = process.env): string | undefined {
  return env.KENALIN_WEBHOOK_SECRET || undefined;
}

export function resolvePort(env: NodeJS.ProcessEnv = process.env): number {
  const p = Number(env.PORT);
  return Number.isFinite(p) && p > 0 ? p : 8787;
}

/**
 * Resolve Upstash Redis REST credentials for the distributed rate limiter + usage
 * counters (TASK-007). Returns undefined when either half is missing — callers then
 * fall back to the in-memory implementations (D1: graceful degradation).
 */
export function resolveRedisConfig(
  env: NodeJS.ProcessEnv = process.env,
): { url: string; token: string } | undefined {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : undefined;
}
