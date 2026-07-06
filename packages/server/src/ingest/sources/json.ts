import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { ContentType } from "@kenalin/core";
import type { RawDocument, SourceLoadResult } from "../types.js";

/**
 * Load a JSON profile into documents. Supports two shapes:
 *  1. The structured profile shape (summary + experience[] + skills[]).
 *  2. A generic array of { type, title, content, url?, projectId?, topics? }.
 */

interface StructuredProfile {
  owner?: string;
  role?: string;
  website?: string;
  summary?: string;
  experience?: { id?: string; title: string; period?: string; content: string; topics?: string[] }[];
  skills?: { id?: string; name: string; topics?: string[] }[];
  projects?: { id?: string; title: string; content: string; url?: string; topics?: string[] }[];
}

type GenericDoc = {
  id?: string;
  type: ContentType;
  title: string;
  content: string;
  url?: string;
  projectId?: string;
  topics?: string[];
};

export async function loadJson(path: string, rootDir: string): Promise<SourceLoadResult> {
  const abs = resolve(rootDir, path);
  const parsed = JSON.parse(await readFile(abs, "utf8"));
  const documents: RawDocument[] = [];

  if (Array.isArray(parsed)) {
    for (const [i, d] of (parsed as GenericDoc[]).entries()) {
      documents.push({
        sourceId: `json:${d.id ?? i}`,
        type: d.type,
        title: d.title,
        url: d.url,
        projectId: d.projectId,
        topics: d.topics ?? [],
        content: d.content,
      });
    }
    return { source: `json:${path}`, documents };
  }

  const p = parsed as StructuredProfile;
  if (p.summary) {
    documents.push({
      sourceId: "json:profile",
      type: "profile",
      title: p.role ? `${p.owner ?? "Profile"} — ${p.role}` : "Profile",
      url: p.website,
      topics: ["profile"],
      content: p.summary,
    });
  }
  for (const [i, e] of (p.experience ?? []).entries()) {
    documents.push({
      sourceId: `json:${e.id ?? `exp-${i}`}`,
      type: "experience",
      title: e.title,
      topics: e.topics ?? [],
      content: [e.title, e.period, e.content].filter(Boolean).join(" — "),
    });
  }
  for (const [i, s] of (p.skills ?? []).entries()) {
    documents.push({
      sourceId: `json:${s.id ?? `skill-${i}`}`,
      type: "skill",
      title: s.name,
      topics: s.topics ?? [],
      content: `${s.name}${s.topics?.length ? " — " + s.topics.join(", ") : ""}`,
    });
  }
  for (const [i, pr] of (p.projects ?? []).entries()) {
    documents.push({
      sourceId: `json:${pr.id ?? `project-${i}`}`,
      type: "project",
      title: pr.title,
      url: pr.url,
      topics: pr.topics ?? [],
      content: pr.content,
    });
  }

  return { source: `json:${path}`, documents };
}
