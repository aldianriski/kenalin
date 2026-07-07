/**
 * Keyless demo API as a plain Vercel Node function. It runs the real orchestrator
 * (retrieval + policy) with offline providers, serves CUSTOM Kenalin quick actions,
 * and returns the SSE body all at once (the widget parses it the same way). We use
 * the native (req,res) signature + Vercel's parsed `req.body` on purpose: the Hono
 * `hono/vercel` adapter hangs on POST bodies under Vercel, and streaming responses
 * hit the function timeout. esbuild bundles core+server+zod+index — no external deps.
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { loadConfig, ChatRequestSchema, type KnowledgeChunk } from "@kenalin/core";
import {
  Orchestrator,
  LocalKnowledgeStore,
  HashEmbeddingProvider,
  FakeChatProvider,
  toPublicConfig,
} from "@kenalin/server";
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
const publicConfig = JSON.stringify({ ...toPublicConfig(config), quickActions: QUICK_ACTIONS });

/** Encode one SSE event, splitting multi-line data into `data:` lines (SSE spec). */
function sseEvent(event: string, data: string): string {
  const lines = data.split("\n").map((l) => `data: ${l}`).join("\n");
  return `event: ${event}\n${lines}\n\n`;
}

function readBody(req: IncomingMessage): Promise<unknown> {
  // Vercel usually parses JSON into req.body; fall back to reading the raw stream.
  const anyReq = req as IncomingMessage & { body?: unknown };
  if (anyReq.body !== undefined && anyReq.body !== null) {
    return Promise.resolve(
      typeof anyReq.body === "string" ? safeParse(anyReq.body) : anyReq.body,
    );
  }
  return new Promise((resolve) => {
    let d = "";
    req.on("data", (c) => (d += c));
    req.on("end", () => resolve(safeParse(d)));
    req.on("error", () => resolve({}));
  });
}
function safeParse(s: string): unknown {
  try {
    return JSON.parse(s || "{}");
  } catch {
    return {};
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const path = (req.url || "").split("?")[0];
  res.setHeader("access-control-allow-origin", (req.headers.origin as string) || "*");
  res.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type, accept");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return void res.end();
  }

  if (path.endsWith("/api/config/public")) {
    res.setHeader("content-type", "application/json; charset=utf-8");
    return void res.end(publicConfig);
  }

  if (path.endsWith("/api/chat") && req.method === "POST") {
    const parsed = ChatRequestSchema.safeParse(await readBody(req));
    if (!parsed.success) {
      res.statusCode = 400;
      res.setHeader("content-type", "application/json");
      return void res.end(JSON.stringify({ error: "invalid_request" }));
    }
    let sse: string;
    try {
      const { response } = await orchestrator.handle(parsed.data);
      sse = sseEvent("delta", response.answer) + sseEvent("payload", JSON.stringify(response));
    } catch {
      sse = sseEvent("error", "upstream_error");
    }
    res.setHeader("content-type", "text/event-stream; charset=utf-8");
    res.setHeader("cache-control", "no-cache");
    return void res.end(sse);
  }

  if (path.endsWith("/healthz")) {
    res.setHeader("content-type", "application/json");
    return void res.end(JSON.stringify({ ok: true, owner: config.owner.name }));
  }

  res.statusCode = 404;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ error: "not_found" }));
}
