import { describe, it, expect, beforeAll } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { afterAll } from "vitest";
import {
  loadConfig,
  type ChatRequest,
  type KenalinConfig,
  type ModelOutput,
  CURRENCY_BLOCK_REGEX,
} from "@kenalin/core";
import { ingest } from "../ingest/pipeline.js";
import { HashEmbeddingProvider } from "../embeddings/hash.js";
import { LocalKnowledgeStore } from "../knowledge/local-store.js";
import { FakeChatProvider } from "../chat/fake.js";
import { Orchestrator } from "./orchestrator.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../../..");
const embedder = new HashEmbeddingProvider();

function demoConfig(): KenalinConfig {
  return loadConfig({
    owner: { name: "Sari Wibowo", preferredName: "Sari", role: "Engineer", website: "https://demo.kenalin.dev" },
    assistant: { name: "NARA", languages: ["id", "en"] },
    handoff: { whatsapp: { number: "+620000000000" }, email: { address: "hi@demo.kenalin.dev" } },
    actions: [{ id: "contact", type: "link", label: "Contact", url: "https://demo.kenalin.dev/contact" }],
    knowledge: {
      sources: [
        { kind: "json", path: "content/demo/profile.json" },
        { kind: "markdown", path: "content/demo/case-studies" },
      ],
    },
  });
}

/** Extract the evidence ids the prompt offered, so a "good" model cites real ones. */
function availableEvidenceIds(system: string): string[] {
  return [...system.matchAll(/id=(\S+) \[/g)].map((m) => m[1]!);
}

const baseModel = (over: Partial<ModelOutput>): ModelOutput => ({
  answer: "ok",
  intent: "explore",
  confidence: 0.8,
  evidenceIds: [],
  suggestedActionIds: [],
  qualification: null,
  askDimension: null,
  offerHandoff: false,
  ...over,
});

function request(over: Partial<ChatRequest> = {}): ChatRequest {
  return {
    sessionId: "s1",
    messages: [{ role: "user", content: "Apa itu project QuickHub?" }],
    state: {} as ChatRequest["state"],
    ...over,
  } as ChatRequest;
}

describe("orchestrator + policy pipeline", () => {
  let store: LocalKnowledgeStore;
  let out: string;

  beforeAll(async () => {
    out = await mkdtemp(join(tmpdir(), "kenalin-o-"));
    const { chunks } = await ingest(demoConfig(), { rootDir: repoRoot, outDir: out, embedder });
    store = LocalKnowledgeStore.fromChunks(chunks);
  });

  function orch(responder: (system: string) => ModelOutput) {
    return new Orchestrator({
      config: demoConfig(),
      store,
      embedder,
      chat: new FakeChatProvider((req) => responder(req.system)),
      retrievalThreshold: 0.08,
    });
  }

  it("[grounding] returns a valid ChatResponse citing a retrieved evidence id", async () => {
    const o = orch((sys) => baseModel({ answer: "QuickHub adalah tool otomasi approval.", evidenceIds: availableEvidenceIds(sys).slice(0, 1) }));
    const { response, retrievedCount } = await o.handle(request());
    expect(retrievedCount).toBeGreaterThan(0);
    expect(response.evidence.length).toBe(1);
    expect(response.intent).toBe("explore");
  });

  it("[grounding] unknown project → no evidence when the model cites none", async () => {
    const o = orch(() => baseModel({ answer: "Saya belum menemukan bukti publik yang cukup.", evidenceIds: [] }));
    const { response } = await o.handle(request({ messages: [{ role: "user", content: "Ceritakan project Skyfall" }] }));
    expect(response.evidence).toHaveLength(0);
  });

  it("[safety] currency answer is blocked and replaced", async () => {
    const o = orch(() => baseModel({ answer: "Kira-kira habis Rp 5 juta untuk sistem itu." }));
    const { response, violations } = await o.handle(request());
    expect(CURRENCY_BLOCK_REGEX.test(response.answer)).toBe(false);
    expect(violations).toContain("currency_blocked");
  });

  it("[safety] invented URL is stripped from the answer", async () => {
    const o = orch(() => baseModel({ answer: "Lihat detail di https://evil.example/phish ya." }));
    const { response, violations } = await o.handle(request());
    expect(response.answer).not.toContain("evil.example");
    expect(violations).toContain("invented_url_stripped");
  });

  it("[safety] impersonation is stripped", async () => {
    const o = orch(() => baseModel({ answer: "Saya Sari, senang berkenalan dengan Anda." }));
    const { response, violations } = await o.handle(request());
    expect(response.answer.toLowerCase()).not.toContain("saya sari");
    expect(violations).toContain("impersonation_stripped");
  });

  it("[safety] unknown evidence id is dropped", async () => {
    const o = orch(() => baseModel({ answer: "x", evidenceIds: ["totally-made-up-id"] }));
    const { response, violations } = await o.handle(request());
    expect(response.evidence).toHaveLength(0);
    expect(violations.some((v) => v.startsWith("dropped_unknown_evidence"))).toBe(true);
  });

  it("[safety] unknown action id is dropped, valid one kept", async () => {
    const o = orch(() => baseModel({ answer: "x", suggestedActionIds: ["contact", "ghost-action"] }));
    const { response } = await o.handle(request());
    const ids = response.suggestedActions.map((a) => a.id);
    expect(ids).toContain("contact");
    expect(ids).not.toContain("ghost-action");
  });

  it("[conversation] question cap is enforced server-side and routes to handoff", async () => {
    const o = orch(() => baseModel({ intent: "business_opportunity", askDimension: "goal", offerHandoff: false }));
    const capped = request({
      messages: [{ role: "user", content: "lanjutan jawaban" }],
      state: { qualification: { questionCount: 5, stage: "screening" } } as ChatRequest["state"],
    });
    const { response, violations } = await o.handle(capped);
    expect(violations).toContain("question_cap_reached");
    expect(response.stateUpdates.qualification?.questionCount).toBe(5);
    expect(response.handoff).not.toBeNull();
  });

  it("[handoff] resolves a WhatsApp deep link with an encoded brief ≤ 700 chars", async () => {
    const o = orch(() =>
      baseModel({ intent: "business_opportunity", offerHandoff: true, qualification: { stage: "classified", category: "process_automation", complexity: "medium" } }),
    );
    const { response } = await o.handle(request({ messages: [{ role: "user", content: "approval saya lewat whatsapp" }] }));
    expect(response.handoff?.channel).toBe("whatsapp");
    expect(response.handoff?.url?.startsWith("https://wa.me/")).toBe(true);
    expect((response.handoff?.brief.length ?? 0)).toBeLessThanOrEqual(700);
  });

  it("[fallback] unparseable model output degrades to a safe response", async () => {
    const o = new Orchestrator({
      config: demoConfig(),
      store,
      embedder,
      chat: new FakeChatProvider(() => "this is not json at all"),
      retrievalThreshold: 0.08,
    });
    const { response, violations } = await o.handle(request());
    expect(violations).toContain("fallback");
    expect(response.suggestedActions.length).toBeGreaterThan(0);
    expect(response.intent).toBe("unknown");
  });

  afterAll(async () => {
    await rm(out, { recursive: true, force: true });
  });
});
