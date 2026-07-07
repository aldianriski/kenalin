/**
 * Keyless demo API for the self-referential Kenalin playground. Runs the real
 * orchestrator (retrieval + policy) with offline providers, but serves CUSTOM
 * quick actions (about Kenalin) instead of the module defaults, and a minimal
 * SSE chat route matching the widget's `delta`/`payload` contract. esbuild
 * bundles everything (core + server + hono + zod + index) into the Vercel
 * function — no workspace/npm deps, no secrets.
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";
import { loadConfig, ChatRequestSchema, type KnowledgeChunk } from "@kenalin/core";
import {
  Orchestrator,
  LocalKnowledgeStore,
  HashEmbeddingProvider,
  FakeChatProvider,
  toPublicConfig,
} from "@kenalin/server";
import { handle } from "hono/vercel";
import rawConfig from "./kenalin.config.js";
import { demoResponder } from "./responder.js";
import chunks from "./chunks.json";

const config = loadConfig(rawConfig);
const store = LocalKnowledgeStore.fromChunks(chunks as unknown as KnowledgeChunk[]);
const orchestrator = new Orchestrator({
  config,
  store,
  embedder: new HashEmbeddingProvider(),
  chat: new FakeChatProvider(demoResponder),
  retrievalThreshold: 0.08,
});

// Custom quick actions — all about Kenalin, so every button returns real info.
const QUICK_ACTIONS = [
  { id: "what", label: { en: "What is Kenalin?", id: "Apa itu Kenalin?" }, seedIntent: "explore" },
  { id: "cando", label: { en: "What can it do?", id: "Apa saja fiturnya?" }, seedIntent: "explore" },
  { id: "embed", label: { en: "How do I add it?", id: "Cara memasang?" }, seedIntent: "explore" },
  { id: "oss", label: { en: "Free & self-hosted?", id: "Gratis & self-host?" }, seedIntent: "explore" },
];

const publicConfig = { ...toPublicConfig(config), quickActions: QUICK_ACTIONS };

const app = new Hono();
app.use("/api/*", cors({ origin: (o) => o ?? "*", allowMethods: ["GET", "POST", "OPTIONS"] }));
app.get("/healthz", (c) => c.json({ ok: true, owner: config.owner.name }));
app.get("/api/config/public", (c) => c.json(publicConfig));

app.post("/api/chat", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }
  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "invalid_request", issues: parsed.error.issues }, 400);

  return streamSSE(c, async (stream) => {
    try {
      const { response } = await orchestrator.handle(parsed.data);
      for (const w of response.answer.split(/(\s+)/)) {
        await stream.writeSSE({ event: "delta", data: w });
      }
      await stream.writeSSE({ event: "payload", data: JSON.stringify(response) });
    } catch (err) {
      await stream.writeSSE({ event: "error", data: "upstream_error" });
    }
  });
});

const vercelHandler = handle(app);
export default vercelHandler;
export const GET = vercelHandler;
export const POST = vercelHandler;
export const OPTIONS = vercelHandler;
