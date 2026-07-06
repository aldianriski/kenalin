import type { RawDocument, SourceLoadResult } from "../types.js";
import { fetchPageDocument } from "./url.js";

/**
 * Sitemap-guided, same-origin crawl (PRD FR-K1). Fetches sitemap.xml, keeps
 * only same-origin locs, and loads each page. Concurrency-bounded to be polite.
 */

const MAX_PAGES = 50;
const CONCURRENCY = 4;

export function parseSitemapLocs(xml: string): string[] {
  const locs: string[] = [];
  const re = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) locs.push(m[1]!.trim());
  return locs;
}

export async function loadSitemap(sitemapUrl: string): Promise<SourceLoadResult> {
  const res = await fetch(sitemapUrl, { headers: { "user-agent": "KenalinIngest/0.1" } });
  if (!res.ok) return { source: `sitemap:${sitemapUrl}`, documents: [] };
  const xml = await res.text();
  const origin = new URL(sitemapUrl).origin;
  const locs = parseSitemapLocs(xml)
    .filter((u) => {
      try {
        return new URL(u).origin === origin;
      } catch {
        return false;
      }
    })
    .slice(0, MAX_PAGES);

  const documents: RawDocument[] = [];
  for (let i = 0; i < locs.length; i += CONCURRENCY) {
    const batch = locs.slice(i, i + CONCURRENCY);
    const docs = await Promise.all(batch.map((u) => fetchPageDocument(u).catch(() => null)));
    for (const d of docs) if (d) documents.push(d);
  }
  return { source: `sitemap:${sitemapUrl}`, documents };
}
