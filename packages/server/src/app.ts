import { Hono } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";
import { ChatRequestSchema, type KenalinConfig } from "@kenalin/core";
import { Orchestrator, type OrchestratorDeps } from "./orchestrator/orchestrator.js";
import { toPublicConfig } from "./public-config.js";
import { RateLimiter } from "./rate-limit.js";

export interface AppDeps extends OrchestratorDeps {
  config: KenalinConfig;
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
      } catch (err) {
        await stream.writeSSE({ event: "error", data: String(err) });
      }
    });
  });

  return app;
}
