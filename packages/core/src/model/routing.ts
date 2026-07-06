import type { KenalinConfig } from "../config/schema.js";
import type { ChatRequest } from "../schemas/conversation.js";

/**
 * Whole-turn model selection (TASK-005, ADR-001-safe). Picks the model for the
 * single structured pass BEFORE the call — this is a per-turn model choice, NOT a
 * per-concern split, so the one-LLM-call-per-turn rule holds (CLAUDE.md, ADR-001).
 *
 * Returns the lighter model only for clearly-trivial turns (short, first-turn, no
 * project context). Unset `lite` (the default) → always the primary model, so the
 * pre-tuning behavior is preserved until an owner opts in and re-runs the eval.
 */
export function selectTurnModel(config: KenalinConfig, request: ChatRequest): string {
  const m = config.server.model;
  if (!m.lite) return m.default;
  const userMessages = request.messages.filter((x) => x.role === "user");
  const last = userMessages[userMessages.length - 1]?.content ?? "";
  const trivial =
    last.length <= m.liteMaxChars &&
    userMessages.length <= 1 &&
    !request.pageContext?.projectId;
  return trivial ? m.lite : m.default;
}
