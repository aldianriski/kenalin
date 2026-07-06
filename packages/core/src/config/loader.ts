import { z } from "zod";
import { KenalinConfigSchema, type KenalinConfig, type KenalinConfigInput } from "./schema.js";

/**
 * Config loading + validation (PRD D9, FR-1).
 *
 * `core` is pure — it never reads files. The `server` package reads
 * `kenalin.config.ts` from disk and hands the raw object here for validation.
 */

/** Thrown when a config fails validation. Message lists every precise issue. */
export class ConfigValidationError extends Error {
  readonly issues: z.ZodIssue[];
  constructor(issues: z.ZodIssue[]) {
    super(
      "Invalid kenalin.config — refusing to start:\n" +
        issues
          .map((i) => `  • ${i.path.length ? i.path.join(".") : "(root)"}: ${i.message}`)
          .join("\n"),
    );
    this.name = "ConfigValidationError";
    this.issues = issues;
  }
}

/**
 * Identity helper for authoring `kenalin.config.ts` with full type-checking and
 * IntelliSense. Does not validate — validation happens at boot via `loadConfig`.
 */
export function defineKenalinConfig(config: KenalinConfigInput): KenalinConfigInput {
  return config;
}

/**
 * Validate a raw config object into a fully-defaulted KenalinConfig.
 * Throws ConfigValidationError with a precise, multi-line message on failure.
 */
export function loadConfig(raw: unknown): KenalinConfig {
  const result = KenalinConfigSchema.safeParse(raw);
  if (!result.success) {
    throw new ConfigValidationError(result.error.issues);
  }
  return result.data;
}

/** Non-throwing variant — returns a discriminated result. */
export function tryLoadConfig(
  raw: unknown,
): { ok: true; config: KenalinConfig } | { ok: false; error: ConfigValidationError } {
  const result = KenalinConfigSchema.safeParse(raw);
  if (!result.success) {
    return { ok: false, error: new ConfigValidationError(result.error.issues) };
  }
  return { ok: true, config: result.data };
}
