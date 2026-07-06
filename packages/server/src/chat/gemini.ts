import type { ChatGenerateRequest, ChatProvider, ProviderEvent } from "@kenalin/core";

/**
 * Google Gemini chat provider — `gemini-2.5-flash` with structured output
 * (responseMimeType application/json + responseSchema). Uses the REST API via
 * global fetch; no SDK dependency.
 *
 * The provider makes a single non-streaming structured call and yields one
 * `final` event carrying the raw JSON text. The SSE endpoint pseudo-streams the
 * answer to the widget after validation — streaming partial JSON is avoided on
 * purpose (a half-parsed structured payload is never shown to a visitor).
 */

const DEFAULT_MODEL = "gemini-2.5-flash";
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta";
const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 400;
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface GeminiChatOptions {
  apiKey: string;
  model?: string;
  /** Per-request timeout (ms). Provider timeout → fallback answer (PRD D10). */
  timeoutMs?: number;
}

export class GeminiChatProvider implements ChatProvider {
  readonly name = "gemini";
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(opts: GeminiChatOptions) {
    if (!opts.apiKey) throw new Error("GeminiChatProvider requires an apiKey");
    this.apiKey = opts.apiKey;
    this.model = opts.model ?? DEFAULT_MODEL;
    this.timeoutMs = opts.timeoutMs ?? 20_000;
  }

  async *generate(req: ChatGenerateRequest): AsyncIterable<ProviderEvent> {
    // Per-turn model override (whole-turn lite swap, TASK-005); provider default otherwise.
    const model = req.model ?? this.model;
    const url = `${ENDPOINT}/models/${model}:generateContent?key=${this.apiKey}`;
    const generationConfig: Record<string, unknown> = {
      responseMimeType: "application/json",
      responseSchema: req.responseSchema,
      // Generous budget so a thinking model's reasoning tokens don't truncate
      // the structured JSON payload (a truncated payload → repair → fallback).
      maxOutputTokens: req.maxTokens ?? 2048,
      // Low temperature → consistent policy/grounding compliance (no fabricated
      // evidence, reliable intent), which matters more here than creative variety.
      temperature: 0.25,
    };
    // Cap/disable thinking-token overhead when configured (TD-007 cost lever).
    if (req.thinkingBudget !== undefined) {
      generationConfig.thinkingConfig = { thinkingBudget: req.thinkingBudget };
    }
    const body = {
      systemInstruction: { parts: [{ text: req.system }] },
      contents: req.messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig,
    };

    // Retry transient upstream failures (rate spikes, 5xx, timeouts) before
    // giving up — a single hiccup shouldn't degrade a visitor to the fallback.
    let lastError = "provider error";
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          lastError = `Gemini chat failed (${res.status}): ${detail.slice(0, 160)}`;
          if (RETRYABLE_STATUS.has(res.status) && attempt < MAX_ATTEMPTS) {
            await sleep(BASE_DELAY_MS * 2 ** (attempt - 1));
            continue;
          }
          yield { type: "error", error: lastError };
          return;
        }
        const json = (await res.json()) as GeminiResponse;
        const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
        if (!text) {
          lastError = "Gemini returned an empty candidate";
          if (attempt < MAX_ATTEMPTS) {
            await sleep(BASE_DELAY_MS * 2 ** (attempt - 1));
            continue;
          }
          yield { type: "error", error: lastError };
          return;
        }
        const u = json.usageMetadata;
        const usage = u
          ? {
              promptTokens: u.promptTokenCount ?? 0,
              completionTokens: u.candidatesTokenCount ?? 0,
              totalTokens: u.totalTokenCount ?? 0,
              cachedTokens: u.cachedContentTokenCount ?? 0,
            }
          : undefined;
        yield { type: "final", payload: text, usage };
        return;
      } catch (err) {
        lastError = err instanceof Error && err.name === "AbortError" ? "provider timeout" : String(err);
        if (attempt < MAX_ATTEMPTS) {
          await sleep(BASE_DELAY_MS * 2 ** (attempt - 1));
          continue;
        }
        yield { type: "error", error: lastError };
        return;
      } finally {
        clearTimeout(timer);
      }
    }
  }
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
    cachedContentTokenCount?: number;
  };
}
