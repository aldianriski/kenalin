/**
 * Pure, heading-aware chunking (PRD FR-K2 / D5). No I/O — the server ingest
 * pipeline loads raw text and calls this. ~300–500 tokens per chunk, 40–60
 * token overlap, split preferring heading and paragraph boundaries.
 */

/** Cheap token estimate. Good enough for chunk sizing (≈ 0.75 words/token). */
export function estimateTokens(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.ceil(words / 0.75);
}

export interface ChunkOptions {
  minTokens?: number; // default 300
  maxTokens?: number; // default 500
  overlapTokens?: number; // default 50
}

export interface TextChunk {
  content: string;
  /** The most recent markdown heading above this chunk, if any. */
  heading?: string;
  index: number;
}

interface Block {
  heading?: string;
  text: string;
}

/** Split markdown into blocks keyed by their nearest preceding heading. */
function splitByHeadings(md: string): Block[] {
  const lines = md.split(/\r?\n/);
  const blocks: Block[] = [];
  let heading: string | undefined;
  let buffer: string[] = [];
  const flush = () => {
    const text = buffer.join("\n").trim();
    if (text) blocks.push({ heading, text });
    buffer = [];
  };
  for (const line of lines) {
    const h = /^#{1,6}\s+(.*)$/.exec(line);
    if (h) {
      flush();
      heading = (h[1] ?? "").trim();
    } else {
      buffer.push(line);
    }
  }
  flush();
  return blocks;
}

/** Split a text block into paragraph units. */
function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/**
 * Chunk raw text (markdown-aware). Packs paragraphs into windows between
 * min/max tokens; carries a trailing overlap of ~overlapTokens into the next
 * chunk to preserve context across boundaries.
 */
export function chunkText(raw: string, opts: ChunkOptions = {}): TextChunk[] {
  const minTokens = opts.minTokens ?? 300;
  const maxTokens = opts.maxTokens ?? 500;
  const overlapTokens = opts.overlapTokens ?? 50;

  const chunks: TextChunk[] = [];
  let index = 0;

  for (const block of splitByHeadings(raw)) {
    const paras = paragraphs(block.text);
    let current: string[] = [];
    let currentTokens = 0;

    const emit = () => {
      const content = current.join("\n\n").trim();
      if (!content) return;
      chunks.push({ content, heading: block.heading, index: index++ });
    };

    for (const para of paras) {
      const t = estimateTokens(para);
      // A single oversized paragraph becomes its own chunk.
      if (t > maxTokens && current.length === 0) {
        current = [para];
        emit();
        current = [];
        currentTokens = 0;
        continue;
      }
      if (currentTokens + t > maxTokens && currentTokens >= minTokens) {
        emit();
        // Start next chunk with a tail overlap of the previous content.
        const prev = current.join(" ");
        const overlapWords = prev.split(/\s+/).slice(-Math.ceil(overlapTokens * 0.75));
        current = overlapWords.length ? [overlapWords.join(" ")] : [];
        currentTokens = estimateTokens(current.join(" "));
      }
      current.push(para);
      currentTokens += t;
    }
    // Flush the remainder of the block.
    emit();
  }

  return chunks;
}
