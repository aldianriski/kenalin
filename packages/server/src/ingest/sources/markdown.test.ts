import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadMarkdown } from "./markdown.js";

/**
 * TASK-039 / TD-011: non-canonical frontmatter `type:` values must map to a canonical
 * ContentType so evidence cards render typed (not generic), and `url:` is carried through.
 */
describe("loadMarkdown — frontmatter type/url mapping (TASK-039)", () => {
  let dir: string;
  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), "kenalin-md-"));
  });
  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const md = async (name: string, front: string, body = "Body text."): Promise<void> => {
    await writeFile(join(dir, name), `---\n${front}\n---\n${body}\n`, "utf8");
  };

  it("maps non-canonical type (technical/hybrid) to case_study and keeps the url", async () => {
    await md("tech.md", "type: technical\ntitle: Deep Dive\nurl: https://site.example/case/deep-dive");
    await md("hyb.md", "type: hybrid\ntitle: Mixed");
    const { documents } = await loadMarkdown(dir, dir);
    const tech = documents.find((d) => d.title === "Deep Dive");
    const hyb = documents.find((d) => d.title === "Mixed");
    expect(tech?.type).toBe("case_study");
    expect(tech?.url).toBe("https://site.example/case/deep-dive");
    expect(hyb?.type).toBe("case_study");
  });

  it("passes canonical types through and falls back to custom for unknown/missing", async () => {
    await md("proj.md", "type: project\ntitle: Proj");
    await md("weird.md", "type: qwerty\ntitle: Weird");
    await md("none.md", "title: NoType");
    const { documents } = await loadMarkdown(dir, dir);
    expect(documents.find((d) => d.title === "Proj")?.type).toBe("project");
    expect(documents.find((d) => d.title === "Weird")?.type).toBe("custom");
    expect(documents.find((d) => d.title === "NoType")?.type).toBe("custom");
  });
});
