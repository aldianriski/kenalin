import { build } from "esbuild";
import { gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";

/**
 * Build the widget into a single self-registering file: dist/kenalin.js.
 * Enforces the < 60 KB gzip budget (PRD D7 / risk register).
 */
const BUDGET_GZIP = 60 * 1024;

const shared = {
  bundle: true,
  minify: true,
  sourcemap: true,
  target: ["es2019"],
  jsx: "automatic",
  jsxImportSource: "preact",
  legalComments: "none",
  define: { "process.env.NODE_ENV": '"production"' },
};

// Script embed (IIFE) — the one <script> tag hosts include.
await build({
  ...shared,
  entryPoints: ["src/embed.ts"],
  outfile: "dist/kenalin.js",
  format: "iife",
});

// ESM entry for bundler-based hosts.
await build({
  ...shared,
  entryPoints: ["src/index.ts"],
  outfile: "dist/kenalin.esm.js",
  format: "esm",
});

const raw = readFileSync("dist/kenalin.js");
const gz = gzipSync(raw).length;
const kb = (n) => (n / 1024).toFixed(1) + " KB";
console.log(`dist/kenalin.js  raw ${kb(raw.length)}  gzip ${kb(gz)}  (budget ${kb(BUDGET_GZIP)})`);

if (gz > BUDGET_GZIP) {
  console.error(`✗ bundle exceeds the ${kb(BUDGET_GZIP)} gzip budget`);
  process.exit(1);
}
console.log("✓ within budget");
