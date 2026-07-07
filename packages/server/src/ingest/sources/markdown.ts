import { readFile, readdir, stat } from "node:fs/promises";
import { join, resolve, basename, extname, relative } from "node:path";
import type { ContentType } from "@kenalin/core";
import { parseFrontmatter } from "../frontmatter.js";
import type { RawDocument, SourceLoadResult } from "../types.js";

const MD_EXT = new Set([".md", ".markdown", ".mdx"]);

/** Canonical ContentTypes (mirrors core's ContentTypeSchema enum). */
const CANONICAL_TYPES: ReadonlySet<string> = new Set([
  "profile",
  "experience",
  "project",
  "case_study",
  "service",
  "article",
  "skill",
  "testimonial",
  "contact",
  "custom",
]);

/** Non-canonical frontmatter `type:` values seen in the wild → canonical (TD-011 / TASK-039). */
const TYPE_ALIASES: Record<string, ContentType> = {
  technical: "case_study",
  hybrid: "case_study",
  "case-study": "case_study",
  casestudy: "case_study",
};

/**
 * Map a frontmatter `type:` to a canonical ContentType so evidence cards render typed
 * (right icon/style) instead of the generic `custom` fallback. Unknown → `custom`.
 */
function normalizeType(raw: string | undefined): ContentType {
  if (!raw) return "custom";
  const key = raw.trim().toLowerCase();
  if (CANONICAL_TYPES.has(key)) return key as ContentType;
  return TYPE_ALIASES[key] ?? "custom";
}

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
    const name = basename(file, extname(file));
    // Use the path relative to the ingest root as the id so same-named files in
    // different locale dirs (content/en/x.mdx vs content/id/x.mdx) don't COLLIDE on
    // `md:x` — that collision made the two locales' chunks share an id (TASK-017).
    const relId = relative(rootDir, file).replace(extname(file), "").replace(/\\/g, "/");
    const type = normalizeType(asString(data.type));
    const title = asString(data.title) ?? name;
    documents.push({
      sourceId: `md:${relId}`,
      type,
      title,
      url: asString(data.url),
      // Group localized variants of one project under a shared projectId so evidence
      // dedup can collapse them to a single card. Falls back to the frontmatter slug.
      projectId: asString(data.projectId) ?? asString(data.slug),
      topics: asArray(data.topics),
      content: body.trim(),
    });
  }
  return { source: `markdown:${path}`, documents };
}
