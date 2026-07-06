#!/usr/bin/env node
import { resolve } from "node:path";
import { loadConfigFile } from "./config/load-file.js";
import { ingest } from "./ingest/pipeline.js";
import { selectEmbedder, type EmbedderKind } from "./embeddings/index.js";

/**
 * Kenalin CLI. Currently: `kenalin ingest`.
 *
 * Usage:
 *   kenalin ingest [--config <path>] [--root <dir>] [--out <dir>] [--embedder gemini|hash]
 */

interface Flags {
  config: string;
  root: string;
  out?: string;
  embedder?: EmbedderKind;
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { config: "kenalin.config.ts", root: process.cwd() };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === "--config") flags.config = next()!;
    else if (a === "--root") flags.root = resolve(next()!);
    else if (a === "--out") flags.out = resolve(next()!);
    else if (a === "--embedder") flags.embedder = next() as EmbedderKind;
  }
  return flags;
}

async function cmdIngest(argv: string[]): Promise<void> {
  const flags = parseFlags(argv);
  const { config } = await loadConfigFile(flags.config);
  const embedder = selectEmbedder({ kind: flags.embedder });
  if (embedder.name === "hash") {
    console.warn("⚠  Using the deterministic hash embedder (no API key). Retrieval quality is lexical only.");
  }
  console.log(`Ingesting ${config.knowledge.sources.length} source(s) for '${config.owner.name}' with embedder '${embedder.name}'…`);

  const { manifest, outDir } = await ingest(config, {
    rootDir: flags.root,
    outDir: flags.out,
    embedder,
  });

  console.log(`\n✓ Index written to ${outDir}`);
  console.log(`  ${manifest.chunkCount} chunks · content hash ${manifest.contentHash}`);
  for (const s of manifest.sources) {
    console.log(`  • ${s.source}: ${s.documents} doc(s) → ${s.chunks} chunk(s)`);
  }
  console.log(`\nReview the curation manifest at content/index.manifest.json before deploying.`);
}

async function main(): Promise<void> {
  const [cmd, ...rest] = process.argv.slice(2);
  switch (cmd) {
    case "ingest":
      await cmdIngest(rest);
      break;
    case undefined:
    case "help":
    case "--help":
      console.log("Kenalin CLI\n\nCommands:\n  ingest   Build the local knowledge index from configured sources");
      break;
    default:
      console.error(`Unknown command: ${cmd}`);
      process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
