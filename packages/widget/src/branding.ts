import type { PublicConfig } from "./types.js";

/**
 * Branding helpers (TASK-004). Pure — no DOM — so they unit-test in the widget's
 * node test env without a render harness.
 */

/** Map owner theme-token keys → the `--kenalin-*` custom properties `styles.ts` exposes. */
const TOKEN_VARS: Record<string, string> = {
  navy: "--kenalin-navy",
  accent: "--kenalin-accent",
  accentStrong: "--kenalin-accent-strong",
  accentText: "--kenalin-accent-text",
  accentSoft: "--kenalin-accent-soft",
  amber: "--kenalin-amber",
  bg: "--kenalin-bg",
  surface: "--kenalin-surface",
  text: "--kenalin-text",
  muted: "--kenalin-muted",
  border: "--kenalin-border",
  userBg: "--kenalin-user-bg",
  radius: "--kenalin-radius",
  font: "--kenalin-font",
};

/**
 * Resolve owner theme tokens to `[cssVar, value]` pairs to set on the host element.
 * Ignores unknown keys and empty values — only known, non-empty tokens are applied.
 */
export function themeCssVars(theme?: Record<string, string | undefined>): [string, string][] {
  if (!theme) return [];
  const out: [string, string][] = [];
  for (const [key, value] of Object.entries(theme)) {
    const cssVar = TOKEN_VARS[key];
    if (cssVar && typeof value === "string" && value.trim()) out.push([cssVar, value]);
  }
  return out;
}

/** The header avatar image, if any: an explicit avatar wins, else the logo, else none. */
export function avatarUrl(config: PublicConfig): string | undefined {
  return config.branding?.avatarUrl ?? config.branding?.logoUrl;
}
