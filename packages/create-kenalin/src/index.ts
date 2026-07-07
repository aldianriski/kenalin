#!/usr/bin/env node
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * create-kenalin — scaffold a runnable Kenalin project.
 *
 * Copies a template into a new directory, substituting the project name, and
 * prints the next steps. Kept as a pure `scaffold()` function (testable without
 * a filesystem harness) plus a thin CLI wrapper.
 */

/**
 * Template files are stored with a leading underscore where npm would otherwise
 * mangle them on publish (`.gitignore` is dropped; `package.json` at the package
 * root would confuse tooling). They are renamed back on write.
 */
const RENAME_ON_WRITE: Record<string, string> = {
  "_package.json": "package.json",
  "_gitignore": ".gitignore",
};

const PLACEHOLDER = /\{\{\s*projectName\s*\}\}/g;

export interface ScaffoldOptions {
  /** Absolute path of the directory to create. */
  targetDir: string;
  /** Project name — substituted for the `{{projectName}}` placeholder. */
  projectName: string;
  /** Directory holding the template folders (e.g. `<pkg>/templates`). */
  templatesDir: string;
  /** Template name; defaults to "default". */
  template?: string;
}

/** Scaffold a project from a template. Returns the list of files written. */
export async function scaffold(opts: ScaffoldOptions): Promise<string[]> {
  const template = opts.template ?? "default";
  const src = join(opts.templatesDir, template);
  if (!existsSync(src)) {
    throw new Error(`Template "${template}" not found at ${src}`);
  }
  const written: string[] = [];
  await copyDir(src, opts.targetDir, opts.projectName, written);
  return written;
}

async function copyDir(
  srcDir: string,
  destDir: string,
  projectName: string,
  written: string[],
): Promise<void> {
  await mkdir(destDir, { recursive: true });
  for (const entry of await readdir(srcDir, { withFileTypes: true })) {
    const outName = RENAME_ON_WRITE[entry.name] ?? entry.name;
    const srcPath = join(srcDir, entry.name);
    const destPath = join(destDir, outName);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath, projectName, written);
    } else {
      const raw = await readFile(srcPath, "utf8");
      await writeFile(destPath, raw.replace(PLACEHOLDER, projectName));
      written.push(destPath);
    }
  }
}

/** Validate a project name as a safe directory + npm package name. */
export function isValidProjectName(name: string): boolean {
  return /^[a-z0-9][a-z0-9._-]*$/.test(name) && !name.includes("..");
}

function templatesDir(): string {
  // dist/index.js → ../templates
  return join(dirname(fileURLToPath(import.meta.url)), "..", "templates");
}

async function main(argv: string[]): Promise<number> {
  const name = argv.find((a) => !a.startsWith("-"));
  if (!name) {
    console.error("Usage: npx create-kenalin <project-name>");
    return 1;
  }
  if (!isValidProjectName(name)) {
    console.error(
      `✗ "${name}" is not a valid project name — use lowercase letters, digits, "-", "_", ".".`,
    );
    return 1;
  }
  const targetDir = join(process.cwd(), name);
  if (existsSync(targetDir)) {
    console.error(`✗ Directory "${name}" already exists — choose another name or remove it.`);
    return 1;
  }

  const written = await scaffold({ targetDir, projectName: name, templatesDir: templatesDir() });

  console.log(`\n✓ Created ${name}/ (${written.length} files)\n`);
  console.log("Next steps:\n");
  console.log(`  cd ${name}`);
  console.log("  npm install");
  console.log("  cp .env.example .env      # then add your Gemini API key");
  console.log("  npm run ingest            # build the knowledge index from content/");
  console.log("  npm run dev               # serve the API + demo page on :8787\n");
  console.log("Docs: https://github.com/aldianriski/kenalin#readme\n");
  return 0;
}

// Run as a CLI only when invoked directly (not when imported by tests).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    });
}
