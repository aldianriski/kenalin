import { readFile, readdir, stat } from "node:fs/promises";
import { join, resolve, basename, extname } from "node:path";
import type { ContentType } from "@kenalin/core";
import { parseFrontmatter } from "../frontmatter.js";
import type { RawDocument, SourceLoadResult } from "../types.js";

const MD_EXT = new Set([".md", ".markdown", ".mdx"]);

async function listMarkdown(path: string): Promise<string[]> {
  const s = await stat(path);
  if (s.isFile()) return MD_EXT.has(extname(path).toLowerCase()) ? [path] : [];
  const entries = await readdir(path, { withFileTypes: true });
  const files: string[] = [];
  for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const full = join(path, e.name);
    if (e.isDirectory()) files.push(...(await listMarkdown(full)));
    else if (MD_EXT.has(extname(e.name).toLowerCase())) files.push(full);
  }
  return files;
}

function asString(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
function asArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

/** Load a Markdown file or a folder of Markdown files into documents. */
export async function loadMarkdown(path: string, rootDir: string): Promise<SourceLoadResult> {
  const abs = resolve(rootDir, path);
  const files = await listMarkdown(abs);
  const documents: RawDocument[] = [];
  for (const file of files) {
    const raw = await readFile(file, "utf8");
    const { data, body } = parseFrontmatter(raw);
    const id = basename(file, extname(file));
    const type = (asString(data.type) as ContentType) ?? "custom";
    const title = asString(data.title) ?? id;
    documents.push({
      sourceId: `md:${id}`,
      type,
      title,
      url: asString(data.url),
      projectId: asString(data.projectId),
      topics: asArray(data.topics),
      content: body.trim(),
    });
  }
  return { source: `markdown:${path}`, documents };
}
