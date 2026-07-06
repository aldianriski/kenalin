import { serve } from "@hono/node-server";
import { loadDotEnv } from "./dotenv.js";
import { loadConfigFile } from "./config/load-file.js";
import { buildAppDeps } from "./factory.js";
import { createApp } from "./app.js";
import { resolvePort } from "./env.js";

/**
 * Local dev server. Loads kenalin.config.ts, the local index, and serves the
 * chat API. Requires a prior `kenalin ingest` and an LLM API key in the env.
 *
 * Usage: jiti src/dev-server.ts [--config <path>] [--root <dir>] [--index <dir>]
 */
async function main(): Promise<void> {
  loadDotEnv([".env", "../../.env"]);
  const argv = process.argv.slice(2);
  const get = (flag: string, def?: string) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : def;
  };
  const configPath = get("--config", "kenalin.config.ts")!;
  const rootDir = get("--root", process.cwd())!;
  const indexDir = get("--index");

  const { config } = await loadConfigFile(configPath);
  const deps = await buildAppDeps(config, {
    rootDir,
    indexDir,
    log: (e) => console.log(JSON.stringify(e)),
  });
  const app = createApp(deps);
  const port = resolvePort();
  console.log(`Kenalin server for '${config.owner.name}' listening on http://localhost:${port}`);
  serve({ fetch: app.fetch, port });
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
