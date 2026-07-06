import type { EmbeddingProvider } from "@kenalin/core";

/**
 * Google Gemini embedding provider — `text-embedding-004` (768 dims).
 * Uses the REST API via global fetch (no SDK dependency). Batches requests.
 */

const DEFAULT_MODEL = "text-embedding-004";
const DEFAULT_DIMENSIONS = 768;
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta";

export interface GeminiEmbeddingOptions {
  apiKey: string;
  model?: string;
  dimensions?: number;
}

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  readonly name = "gemini";
  readonly dimensions: number;
  private readonly apiKey: string;
  private readonly model: string;

  constructor(opts: GeminiEmbeddingOptions) {
    if (!opts.apiKey) throw new Error("GeminiEmbeddingProvider requires an apiKey");
    this.apiKey = opts.apiKey;
    this.model = opts.model ?? DEFAULT_MODEL;
    this.dimensions = opts.dimensions ?? DEFAULT_DIMENSIONS;
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const url = `${ENDPOINT}/models/${this.model}:batchEmbedContents?key=${this.apiKey}`;
    const body = {
      requests: texts.map((text) => ({
        model: `models/${this.model}`,
        content: { parts: [{ text }] },
      })),
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Gemini embedding failed (${res.status}): ${detail.slice(0, 300)}`);
    }
    const json = (await res.json()) as { embeddings?: { values: number[] }[] };
    if (!json.embeddings || json.embeddings.length !== texts.length) {
      throw new Error("Gemini embedding response shape mismatch");
    }
    return json.embeddings.map((e) => e.values);
  }
}
