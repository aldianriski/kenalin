import { resolve, dirname } from "node:path";
import { createJiti } from "jiti";
import { loadConfig, type KenalinConfig } from "@kenalin/core";

/**
 * Load and validate a `kenalin.config.ts` (or .js) from disk. jiti compiles the
 * TS config on the fly; `core.loadConfig` validates it and applies defaults,
 * throwing a precise ConfigValidationError on failure (PRD D9).
 *
 * Returns the validated config plus the directory the config file lives in.
 * Note: knowledge-source paths in the config are resolved against the *root*
 * chosen by the caller (the ingest CLI uses the current working directory /
 * repo root), not necessarily the config's own directory.
 */
export async function loadConfigFile(
  configPath: string,
): Promise<{ config: KenalinConfig; configDir: string }> {
  const abs = resolve(configPath);
  const jiti = createJiti(import.meta.url, { interopDefault: true });
  const mod = (await jiti.import(abs)) as unknown;
  const raw = (mod as { default?: unknown })?.default ?? mod;
  const config = loadConfig(raw);
  return { config, configDir: dirname(abs) };
}
