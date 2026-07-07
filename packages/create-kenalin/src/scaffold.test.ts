import { describe, it, expect, afterAll } from "vitest";
import { mkdtemp, rm, readFile, readdir, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { scaffold, isValidProjectName } from "./index.js";

const TEMPLATES = join(dirname(fileURLToPath(import.meta.url)), "..", "templates");
const tmpRoots: string[] = [];

async function scaffoldInto(name: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "create-kenalin-"));
  tmpRoots.push(root);
  const targetDir = join(root, name);
  await scaffold({ targetDir, projectName: name, templatesDir: TEMPLATES });
  return targetDir;
}

afterAll(async () => {
  await Promise.all(tmpRoots.map((r) => rm(r, { recursive: true, force: true })));
});

describe("isValidProjectName", () => {
  it("accepts npm-safe names", () => {
    expect(isValidProjectName("my-site")).toBe(true);
    expect(isValidProjectName("portfolio_2")).toBe(true);
  });
  it("rejects unsafe names", () => {
    expect(isValidProjectName("../escape")).toBe(false);
    expect(isValidProjectName("My Site")).toBe(false);
    expect(isValidProjectName("")).toBe(false);
  });
});

describe("scaffold(default)", () => {
  it("writes the expected runnable file set", async () => {
    const dir = await scaffoldInto("my-site");
    const expected = [
      "package.json",
      "kenalin.config.ts",
      "server.mjs",
      ".gitignore",
      ".env.example",
      join("public", "index.html"),
      join("content", "case-studies", "example.md"),
    ];
    for (const rel of expected) {
      const s = await stat(join(dir, rel)).catch(() => null);
      expect(s, `expected ${rel} to exist`).not.toBeNull();
    }
  });

  it("substitutes the project name and leaves no template placeholders", async () => {
    const dir = await scaffoldInto("acme-portfolio");
    const pkg = JSON.parse(await readFile(join(dir, "package.json"), "utf8"));
    expect(pkg.name).toBe("acme-portfolio");

    // No unresolved {{...}} placeholders anywhere in the generated tree.
    const leftovers = await grepPlaceholders(dir);
    expect(leftovers, `unresolved placeholders in: ${leftovers.join(", ")}`).toEqual([]);
  });

  it("renames the underscore-prefixed template files", async () => {
    const dir = await scaffoldInto("rename-check");
    const names = await readdir(dir);
    expect(names).toContain(".gitignore");
    expect(names).toContain("package.json");
    expect(names).not.toContain("_gitignore");
    expect(names).not.toContain("_package.json");
  });

  it("wires the scaffolded project to the published @kenalin packages", async () => {
    const dir = await scaffoldInto("dep-check");
    const pkg = JSON.parse(await readFile(join(dir, "package.json"), "utf8"));
    expect(pkg.dependencies["@kenalin/server"]).toBeDefined();
    expect(pkg.dependencies["@kenalin/widget"]).toBeDefined();
    expect(pkg.scripts.ingest).toContain("kenalin ingest");
  });
});

async function grepPlaceholders(dir: string): Promise<string[]> {
  const hits: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      hits.push(...(await grepPlaceholders(full)));
    } else {
      const text = await readFile(full, "utf8");
      if (/\{\{.*\}\}/.test(text)) hits.push(full);
    }
  }
  return hits;
}
