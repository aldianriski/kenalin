import { describe, it, expect, beforeAll } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { afterAll } from "vitest";
import { loadConfig, type KenalinConfig } from "@kenalin/core";
import { ingest } from "./ingest/pipeline.js";
import { HashEmbeddingProvider } from "./embeddings/hash.js";
import { LocalKnowledgeStore } from "./knowledge/local-store.js";
import { FakeChatProvider } from "./chat/fake.js";
import { createApp } from "./app.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const embedder = new HashEmbeddingProvider();

function demoConfig(): KenalinConfig {
  return loadConfig({
    owner: { name: "Sari Wibowo", role: "Engineer", website: "https://demo.kenalin.dev" },
    assistant: { name: "NARA", languages: ["id", "en"] },
    handoff: { email: { address: "hi@demo.kenalin.dev" } },
    actions: [{ id: "contact", type: "link", label: "Contact", url: "https://demo.kenalin.dev/contact" }],
    knowledge: { sources: [{ kind: "json", path: "content/demo/profile.json" }] },
    server: { allowedOrigins: [] },
  });
}

describe("Hono app", () => {
  let app: ReturnType<typeof createApp>;
  let out: string;

  beforeAll(async () => {
    out = await mkdtemp(join(tmpdir(), "kenalin-app-"));
    const { chunks } = await ingest(demoConfig(), { rootDir: repoRoot, outDir: out, embedder });
    const store = LocalKnowledgeStore.fromChunks(chunks);
    app = createApp({
      config: demoConfig(),
      store,
      embedder,
      chat: new FakeChatProvider(() => ({
        answer: "Sari adalah full-stack engineer.",
        intent: "explore",
        confidence: 0.9,
        evidenceIds: [],
        suggestedActionIds: ["contact"],
        qualification: null,
        askDimension: null,
        offerHandoff: false,
      })),
      retrievalThreshold: 0.08,
    });
  });

  it("GET /healthz → ok", async () => {
    const res = await app.request("/healthz");
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });

  it("GET /api/config/public → persona, no secrets", async () => {
    const res = await app.request("/api/config/public");
    const body = await res.json();
    expect(body.assistant.name).toBe("NARA");
    expect(JSON.stringify(body)).not.toContain("hi@demo.kenalin.dev"); // email address not leaked in public bootstrap
    expect(JSON.stringify(body)).not.toMatch(/apiKey|secret/i);
  });

  it("POST /api/chat → SSE stream with delta + payload", async () => {
    const res = await app.request("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: "s1", messages: [{ role: "user", content: "Siapa Sari?" }] }),
    });
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("event: delta");
    expect(text).toContain("event: payload");
    const payloadLine = text.split("\n").find((l) => l.startsWith("data:") && l.includes("\"answer\""));
    expect(payloadLine).toBeTruthy();
  });

  it("POST /api/chat with invalid body → 400", async () => {
    const res = await app.request("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nope: true }),
    });
    expect(res.status).toBe(400);
  });

  it("GET /api/usage → counts, incrementing after a chat", async () => {
    const before = await (await app.request("/api/usage")).json();
    await app.request("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: "u1", messages: [{ role: "user", content: "Siapa Sari?" }] }),
    });
    const after = await (await app.request("/api/usage")).json();
    expect(after.turns).toBe(before.turns + 1);
    expect(typeof after.total).toBe("number");
    // no message content leaks into the usage payload
    expect(JSON.stringify(after)).not.toMatch(/Sari|Siapa/);
    const sess = await (await app.request("/api/usage?sessionId=u1")).json();
    expect(sess.session.turns).toBe(1);
  });

  afterAll(async () => {
    await rm(out, { recursive: true, force: true });
  });
});
