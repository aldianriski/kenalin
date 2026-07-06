import { readFile } from "node:fs/promises";
import { resolve, basename } from "node:path";
import type { RawDocument, SourceLoadResult } from "../types.js";

/**
 * Load a PDF CV into a single document. Uses `pdf-parse` via dynamic import so
 * the dependency is optional — if it's not installed, ingestion fails with a
 * clear, actionable message rather than at module-load time.
 */
export async function loadPdf(path: string, rootDir: string): Promise<SourceLoadResult> {
  const abs = resolve(rootDir, path);
  let pdfParse: (buf: Buffer) => Promise<{ text: string; info?: { Title?: string } }>;
  try {
    // @ts-expect-error optional dependency, no bundled types
    const mod = await import("pdf-parse");
    pdfParse = mod.default ?? mod;
  } catch {
    throw new Error(
      `PDF source '${path}' requires the optional 'pdf-parse' dependency. Install it: pnpm add pdf-parse -w`,
    );
  }
  const buf = await readFile(abs);
  const { text, info } = await pdfParse(buf);
  const title = info?.Title ?? basename(abs);
  return {
    source: `pdf:${path}`,
    documents: text.trim()
      ? [
          {
            sourceId: `pdf:${basename(abs)}`,
            type: "profile",
            title,
            topics: ["cv"],
            content: text.replace(/\s+\n/g, "\n").trim(),
          },
        ]
      : [],
  };
}
