import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { streamSSE } from "hono/streaming";
import { randomUUID } from "node:crypto";
import {
  ChatRequestSchema,
  type ChatRequest,
  type ChatResponse,
  type KenalinConfig,
  type Lead,
  type LeadStore,
  type WebhookEvent,
} from "@kenalin/core";
import { Orchestrator, type OrchestratorDeps } from "./orchestrator/orchestrator.js";
import { toPublicConfig } from "./public-config.js";
import { RateLimiter } from "./rate-limit.js";
import { guardRequest } from "./guard.js";
import type { WebhookEmitter } from "./webhook.js";

export interface AppDeps extends OrchestratorDeps {
  config: KenalinConfig;
  leadStore?: LeadStore;
  webhookEmitter?: WebhookEmitter;
}

/**
 * Build the Hono app (PRD D6): POST /api/chat (SSE), GET /api/config/public,
 * GET /healthz. CORS allowlist + per-IP rate limit from config.
 */
export function createApp(deps: AppDeps): Hono {
  const app = new Hono();
  const orchestrator = new Orchestrator(deps);
  const limiter = new RateLimiter(deps.config.server.rateLimit);
  const allowed = deps.config.server.allowedOrigins;

  // Baseline security headers (nosniff, referrer policy, frame deny, etc.).
  app.use("*", secureHeaders());

  app.use(
    "/api/*",
    cors({
      origin: (origin) => (allowed.length === 0 || allowed.includes(origin) ? origin : null),
      allowMethods: ["GET", "POST", "OPTIONS"],
    }),
  );

  app.get("/healthz", (c) => c.json({ ok: true, owner: deps.config.owner.name }));

  app.get("/api/config/public", (c) => c.json(toPublicConfig(deps.config)));

  app.post("/api/chat", async (c) => {
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
      c.req.header("x-real-ip") ||
      "anonymous";
    if (!limiter.allow(ip)) {
      return c.json({ error: "rate_limited" }, 429);
    }

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "invalid_json" }, 400);
    }
    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "invalid_request", issues: parsed.error.issues }, 400);
    }
    // Cheap abuse guards before any LLM/embedding spend.
    const guard = guardRequest(parsed.data);
    if (!guard.ok) {
      return c.json({ error: guard.error }, guard.status as 400 | 413 | 429);
    }

    return streamSSE(c, async (stream) => {
      try {
        const { response } = await orchestrator.handle(parsed.data);
        // Pseudo-stream the answer word-by-word so the widget feels live, then
        // send the validated structured payload (PRD B8: text streams, cards after).
        const words = response.answer.split(/(\s+)/);
        for (const w of words) {
          await stream.writeSSE({ event: "delta", data: w });
        }
        await stream.writeSSE({ event: "payload", data: JSON.stringify(response) });
        // Fire handoff side-effects (lead capture + webhook) without blocking.
        void emitHandoffSideEffects(deps, parsed.data, response);
      } catch (err) {
        await stream.writeSSE({ event: "error", data: String(err) });
      }
    });
  });

  return app;
}

/**
 * When a handoff is newly offered this turn, persist a lead (per storage mode)
 * and emit a `handoff.completed` webhook. Best-effort — never blocks the reply.
 * No PII is captured here; contact details require the consent flow (PRD B10).
 */
async function emitHandoffSideEffects(
  deps: AppDeps,
  request: ChatRequest,
  response: ChatResponse,
): Promise<void> {
  const newlyOffered = !request.state.handoffOffered && response.stateUpdates.handoffOffered;
  if (!response.handoff || !newlyOffered) return;

  const nowIso = new Date().toISOString();
  const lead: Lead = {
    id: randomUUID(),
    createdAt: nowIso,
    sessionId: request.sessionId,
    intent: response.intent,
    category: response.qualification?.category ?? undefined,
    complexity: response.qualification?.complexity ?? undefined,
    brief: response.handoff.brief,
    source: { url: request.pageContext?.url },
  };
  try {
    await deps.leadStore?.save(lead);
  } catch (err) {
    deps.log?.({ event: "lead_store_error", error: String(err) });
  }
  if (deps.webhookEmitter) {
    const event: WebhookEvent = {
      event: "handoff.completed",
      timestamp: nowIso,
      sessionId: request.sessionId,
      data: { brief: response.handoff.brief, state: { ...request.state, ...response.stateUpdates } },
    };
    try {
      await deps.webhookEmitter.emit(event);
    } catch (err) {
      deps.log?.({ event: "webhook_emit_error", error: String(err) });
    }
  }
}
