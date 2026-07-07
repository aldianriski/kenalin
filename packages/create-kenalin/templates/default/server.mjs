import { readFile } from "node:fs/promises";
import { serve } from "@hono/node-server";
import {
  loadDotEnv,
  loadConfigFile,
  buildAppDeps,
  createApp,
  resolvePort,
} from "@kenalin/server";

/**
 * Minimal Kenalin host. Loads kenalin.config.ts + the local knowledge index,
 * serves the chat API (POST /api/chat, GET /api/config/public) and a demo page
 * at "/". Run `npm run ingest` first, and put KENALIN_LLM_API_KEY in `.env`.
 */
loadDotEnv([".env"]);

const { config } = await loadConfigFile("kenalin.config.ts");
const deps = await buildAppDeps(config, {
  rootDir: process.cwd(),
  log: (e) => console.log(JSON.stringify(e)),
});

const app = createApp(deps);

// Serve the demo page at the root (createApp only owns /healthz + /api/*).
const page = await readFile("./public/index.html", "utf8");
app.get("/", (c) => c.html(page));

const port = resolvePort();
console.log(`✓ Kenalin running for '${config.owner.name}' → http://localhost:${port}`);
serve({ fetch: app.fetch, port });
