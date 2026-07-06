import { CURRENCY_BLOCK_REGEX } from "./constants.js";

/**
 * Pure policy validators (PRD B9 enforcement layer 3). No I/O.
 * These are the post-generation guards that persona config can never disable.
 */

/** True if text contains a monetary figure (blocked unless a pricing module is on). */
export function containsCurrency(text: string): boolean {
  return CURRENCY_BLOCK_REGEX.test(text);
}

/**
 * Heuristic first-person impersonation detector: the assistant speaking AS the
 * owner ("Saya <Owner>…", "I am <Owner>", "As <Owner>, I…"). Uses the owner's
 * given name to keep false positives low.
 */
export function detectImpersonation(text: string, ownerName: string): boolean {
  const first = ownerName.trim().split(/\s+/)[0];
  if (!first) return false;
  const n = first.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`\\bsaya\\s+${n}\\b`, "i"),
    new RegExp(`\\bi\\s+am\\s+${n}\\b`, "i"),
    new RegExp(`\\bas\\s+${n}\\s*,?\\s+i\\b`, "i"),
  ];
  return patterns.some((p) => p.test(text));
}

/** Strip a first-person impersonation opener down to third person. */
export function deImpersonate(text: string, ownerName: string): string {
  const first = ownerName.trim().split(/\s+/)[0] ?? ownerName;
  return text
    .replace(new RegExp(`\\bsaya\\s+(${first})\\b`, "gi"), "$1")
    .replace(new RegExp(`\\bi\\s+am\\s+(${first})\\b`, "gi"), "$1");
}

/**
 * A URL is allowed only if it is one of the provided allowlisted URLs (config
 * actions + retrieved evidence). Root-relative paths are allowed (host-owned).
 */
export function isAllowedUrl(url: string, allowlist: Set<string>): boolean {
  if (url.startsWith("/")) return true;
  return allowlist.has(url);
}

/** Extract http(s) URLs embedded in free text. */
export function extractUrls(text: string): string[] {
  return text.match(/https?:\/\/[^\s)"'<>]+/gi) ?? [];
}
