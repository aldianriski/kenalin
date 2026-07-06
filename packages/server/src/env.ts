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
