import type { EmbeddingProvider } from "@kenalin/core";

/**
 * Deterministic, offline, dependency-free embedding provider.
 *
 * It hashes tokens into a fixed-dimensional bag-of-words vector with TF
 * weighting and L2 normalization, so cosine similarity approximates lexical
 * overlap. NOT semantic-quality — its purpose is deterministic local dev,
 * reproducible eval fixtures, and CI that must run without a network or API key.
 * Production uses the Gemini embedder (see ./gemini.ts).
 */

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "is", "are",
  "was", "were", "be", "as", "at", "by", "it", "this", "that", "with", "from",
  // common id stopwords
  "yang", "dan", "di", "ke", "dari", "untuk", "dengan", "ada", "itu", "ini",
  "saya", "dia", "apa", "pada", "atau", "juga",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/** FNV-1a hash → non-negative 32-bit int. */
function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export class HashEmbeddingProvider implements EmbeddingProvider {
  readonly name = "hash-local";
  readonly dimensions: number;

  constructor(dimensions = 512) {
    this.dimensions = dimensions;
  }

  private embedOne(text: string): number[] {
    const vec = new Array<number>(this.dimensions).fill(0);
    for (const tok of tokenize(text)) {
      const idx = fnv1a(tok) % this.dimensions;
      // signed contribution reduces collisions cancelling out systematically
      const sign = (fnv1a(tok + "#s") & 1) === 0 ? 1 : -1;
      vec[idx] = (vec[idx] as number) + sign;
    }
    // L2 normalize
    let norm = 0;
    for (const v of vec) norm += v * v;
    norm = Math.sqrt(norm) || 1;
    return vec.map((v) => v / norm);
  }

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((t) => this.embedOne(t));
  }
}
