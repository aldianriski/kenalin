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
    const url = `${ENDPOINT}/models/${this.model}:generateContent?key=${this.apiKey}`;
    const body = {
      systemInstruction: { parts: [{ text: req.system }] },
      contents: req.messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: req.responseSchema,
        maxOutputTokens: req.maxTokens ?? 1024,
        temperature: 0.4,
      },
    };

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
        yield { type: "error", error: `Gemini chat failed (${res.status}): ${detail.slice(0, 200)}` };
        return;
      }
      const json = (await res.json()) as GeminiResponse;
      const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
      if (!text) {
        yield { type: "error", error: "Gemini returned an empty candidate" };
        return;
      }
      yield { type: "final", payload: text };
    } catch (err) {
      const msg = err instanceof Error && err.name === "AbortError" ? "provider timeout" : String(err);
      yield { type: "error", error: msg };
    } finally {
      clearTimeout(timer);
    }
  }
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}
