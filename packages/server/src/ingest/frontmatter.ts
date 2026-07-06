/**
 * Minimal YAML-frontmatter parser — supports the subset used by content files:
 * `key: value` and `key: [a, b, c]` inline lists. No external dependency.
 */

export interface Frontmatter {
  data: Record<string, string | string[]>;
  body: string;
}

export function parseFrontmatter(raw: string): Frontmatter {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!match) return { data: {}, body: raw };
  const [, block, body] = match;
  const data: Record<string, string | string[]> = {};
  for (const line of (block ?? "").split(/\r?\n/)) {
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    const key = kv[1] as string;
    let value = (kv[2] ?? "").trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      data[key] = value
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else {
      data[key] = value.replace(/^["']|["']$/g, "");
    }
  }
  return { data, body: body ?? "" };
}
