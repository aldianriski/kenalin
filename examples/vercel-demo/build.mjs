import * as esbuild from "esbuild";
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from "node:fs";

/**
 * Build the self-contained keyless demo (run locally, where the workspace exists):
 *  1. hash index (.build/index/chunks.jsonl) → src/chunks.json (inlined into the bundle)
 *  2. bundle src/handler.ts → api/[...path].mjs  (core+server+hono+zod+index, no external deps)
 *  3. vendor the widget → public/kenalin.js
 * Then `vercel deploy --prod` uploads the prebuilt files — no build/secrets on Vercel.
 */

// 1. index → json
const lines = readFileSync(".build/index/chunks.jsonl", "utf8").trim().split(/\r?\n/);
const chunks = lines.filter(Boolean).map((l) => JSON.parse(l));
writeFileSync("src/chunks.json", JSON.stringify(chunks));
console.log(`✓ src/chunks.json — ${chunks.length} chunks`);

// 2. bundle the serverless handler, fully self-contained
mkdirSync("api", { recursive: true });
await esbuild.build({
  entryPoints: ["src/handler.ts"],
  outfile: "api/[...path].mjs",
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node20",
  minify: true,
  legalComments: "none",
  logLevel: "warning",
  // Some transitive CJS deps call require("node:*"); ESM output needs a real
  // require. Define one from import.meta.url so dynamic requires resolve.
  banner: {
    js: "import { createRequire as __cr } from 'node:module'; import { fileURLToPath as __f } from 'node:url'; import { dirname as __d } from 'node:path'; const require = __cr(import.meta.url); const __filename = __f(import.meta.url); const __dirname = __d(__filename);",
  },
});
console.log("✓ api/[...path].mjs — bundled");

// 3. vendor the widget + the Kenalin logo
mkdirSync("public", { recursive: true });
copyFileSync("../../packages/widget/dist/kenalin.js", "public/kenalin.js");
copyFileSync("../../assets/img/logo_only.png", "public/logo.png");
console.log("✓ public/kenalin.js + public/logo.png");
