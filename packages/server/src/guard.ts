import { LIMITS, type ChatRequest } from "@kenalin/core";

/**
 * Request-level abuse guards (cheap, pre-LLM). Bounds the cost and blast radius
 * of a single request so a client can't drive token spend or degrade service.
 */
export type GuardResult = { ok: true } | { ok: false; error: string; status: number };

export function guardRequest(req: ChatRequest): GuardResult {
  if (req.messages.length === 0) {
    return { ok: false, error: "empty_messages", status: 400 };
  }
  if (req.messages.length > LIMITS.maxMessagesPerRequest) {
    return { ok: false, error: "too_many_messages", status: 400 };
  }
  for (const m of req.messages) {
    if (m.content.length > LIMITS.maxMessageChars) {
      return { ok: false, error: "message_too_long", status: 413 };
    }
  }
  // Conversation-length guard: assistant turns already accumulated client-side.
  const assistantTurns = req.messages.filter((m) => m.role === "assistant").length;
  if (assistantTurns > LIMITS.maxSessionTurns) {
    return { ok: false, error: "conversation_too_long", status: 429 };
  }
  return { ok: true };
}
