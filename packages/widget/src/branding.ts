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

type Position = NonNullable<NonNullable<PublicConfig["branding"]>["position"]>;

/**
 * Resolve `branding.position` offsets/z-index to `--kenalin-pos-*` CSS custom
 * properties `styles.ts` consumes (TASK-034). Corner + mobile mode are applied as
 * host attributes (see element.ts), not vars. Pure — unit-testable in the node env.
 */
export function positionCssVars(position?: Partial<Position>): [string, string][] {
  if (!position) return [];
  const out: [string, string][] = [];
  if (typeof position.offsetX === "string" && position.offsetX.trim())
    out.push(["--kenalin-pos-x", position.offsetX]);
  if (typeof position.offsetY === "string" && position.offsetY.trim())
    out.push(["--kenalin-pos-y", position.offsetY]);
  if (typeof position.offsetYMobile === "string" && position.offsetYMobile.trim())
    out.push(["--kenalin-pos-y-mobile", position.offsetYMobile]);
  if (typeof position.zIndex === "number" && Number.isFinite(position.zIndex))
    out.push(["--kenalin-z", String(position.zIndex)]);
  return out;
}

/** Resolve an override image URL for a named icon, if the owner configured one (TASK-035). */
export function iconOverride(
  icons: Record<string, string> | undefined,
  name: string,
): string | undefined {
  const url = icons?.[name];
  return typeof url === "string" && url.trim() ? url : undefined;
}
