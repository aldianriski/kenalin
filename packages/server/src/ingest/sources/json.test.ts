import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadJson } from "./json.js";

/**
 * TASK-038: the profile-summary chunk must NOT default its "more" link to the site
 * root. It links to `aboutUrl` when provided, else carries no url.
 */
describe("loadJson — profile summary url (TASK-038)", () => {
  let dir: string;
  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), "kenalin-json-"));
  });
  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const write = async (name: string, obj: unknown): Promise<string> => {
    await writeFile(join(dir, name), JSON.stringify(obj), "utf8");
    return name;
  };

  it("uses aboutUrl for the summary chunk when present", async () => {
    const path = await write("with-about.json", {
      owner: "A",
      role: "Engineer",
      website: "https://example.com",
      aboutUrl: "https://example.com/about",
      summary: "A does things.",
    });
    const { documents } = await loadJson(path, dir);
    const profile = documents.find((d) => d.type === "profile");
    expect(profile?.url).toBe("https://example.com/about");
  });

  it("carries NO url (not the site root) when aboutUrl is absent", async () => {
    const path = await write("no-about.json", {
      owner: "A",
      role: "Engineer",
      website: "https://example.com",
      summary: "A does things.",
    });
    const { documents } = await loadJson(path, dir);
    const profile = documents.find((d) => d.type === "profile");
    expect(profile?.url).toBeUndefined();
  });
});
