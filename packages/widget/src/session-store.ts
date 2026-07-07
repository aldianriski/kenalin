/**
 * Chat session persistence (TASK-013). The conversation is stored in `sessionStorage`
 * so it survives a page reload but clears when the tab closes (privacy-safe default, D2).
 *
 * This module is PURE (serialize/deserialize + validation) so it unit-tests in the
 * widget's node env with no DOM; the actual storage I/O lives in app.tsx.
 */

/** Bump when the persisted shape changes — old payloads then fall back to a fresh session. */
export const SESSION_VERSION = 1;

export interface PersistedSession {
  v: number;
  sessionId: string;
  state: unknown;
  messages: unknown[];
}

export function serializeSession(sessionId: string, state: unknown, messages: unknown[]): string {
  const payload: PersistedSession = { v: SESSION_VERSION, sessionId, state, messages };
  return JSON.stringify(payload);
}

/**
 * Parse a persisted payload. Returns null on missing / corrupt / version-mismatch input
 * so the widget falls back to a fresh session instead of throwing or restoring garbage.
 */
export function deserializeSession(raw: string | null | undefined): PersistedSession | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Partial<PersistedSession>;
    if (!p || p.v !== SESSION_VERSION) return null;
    if (typeof p.sessionId !== "string" || !Array.isArray(p.messages)) return null;
    return { v: SESSION_VERSION, sessionId: p.sessionId, state: p.state, messages: p.messages };
  } catch {
    return null;
  }
}

/** Namespaced storage key so different deployments on one origin don't collide. */
export function sessionKey(apiUrl: string): string {
  return `kenalin:session:${apiUrl}`;
}
