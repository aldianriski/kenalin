import type { KenalinConfig } from "../config/schema.js";
import {
  ChatResponseSchema,
  type Action,
  type ChatResponse,
  type ConversationState,
} from "../schemas/conversation.js";
import type { Language } from "../schemas/primitives.js";
import { ModelOutputSchema, type ModelOutput } from "./model-output.js";

/**
 * Parse a raw provider payload into a validated ModelOutput. Returns null on
 * failure so the server can trigger one repair pass (PRD FR-4).
 */
export function parseModelOutput(raw: unknown): ModelOutput | null {
  let value = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(stripCodeFence(raw));
    } catch {
      return null;
    }
  }
  const result = ModelOutputSchema.safeParse(value);
  return result.success ? result.data : null;
}

function stripCodeFence(s: string): string {
  const m = /```(?:json)?\s*([\s\S]*?)```/i.exec(s);
  return (m ? m[1]! : s).trim();
}

/**
 * A safe, static fallback response used when structured output can't be
 * produced after a repair attempt, or a hard error occurs (PRD C6). Surfaces
 * the configured actions so the visitor is never at a dead end.
 */
export function buildFallbackResponse(
  config: KenalinConfig,
  opts: { language: Language; state: ConversationState; actions?: Action[] },
): ChatResponse {
  const actions =
    opts.actions ??
    config.actions.slice(0, 4).map((a) => ({ id: a.id, label: a.label, type: a.type, url: a.url }));
  const answer =
    opts.language === "id"
      ? `Saya di sini untuk kenalin Anda dengan ${config.owner.preferredName ?? config.owner.name}. Mau mulai dari salah satu ini?`
      : `I'm here to introduce you to ${config.owner.preferredName ?? config.owner.name}. Want to start with one of these?`;
  return ChatResponseSchema.parse({
    answer,
    intent: "unknown",
    confidence: 0,
    evidence: [],
    suggestedActions: actions,
    qualification: null,
    handoff: null,
    stateUpdates: { intent: "unknown", language: opts.language },
  });
}
