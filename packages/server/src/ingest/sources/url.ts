import type { ContentType } from "@kenalin/core";
import type { RawDocument, SourceLoadResult } from "../types.js";

/**
 * Fetch a web page and extract readable text. Uses global fetch (Node ≥ 20).
 * Intentionally dependency-free: strips scripts/styles/tags rather than running
 * a full DOM parser — portfolio pages are simple enough for this.
 */

export function htmlToText(html: string): { title?: string; text: string } {
  const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  const title = titleMatch ? decodeEntities(titleMatch[1]!.trim()) : undefined;
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(nav|footer|header|aside)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  const text = decodeEntities(body).replace(/\s+/g, " ").trim();
  return { title, text };
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export async function fetchPageDocument(
  url: string,
  opts: { type?: ContentType; projectId?: string } = {},
): Promise<RawDocument | null> {
  const res = await fetch(url, { headers: { "user-agent": "KenalinIngest/0.1" } });
  if (!res.ok) return null;
  const html = await res.text();
  const { title, text } = htmlToText(html);
  if (!text) return null;
  return {
    sourceId: `url:${url}`,
    type: opts.type ?? "article",
    title: title ?? url,
    url,
    projectId: opts.projectId,
    topics: [],
    content: text,
  };
}

export async function loadUrl(url: string): Promise<SourceLoadResult> {
  const doc = await fetchPageDocument(url);
  return { source: `url:${url}`, documents: doc ? [doc] : [] };
}
