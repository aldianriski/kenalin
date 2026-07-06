import type { ChatMessage, ConversationState, Intent, PageContext } from "@kenalin/core";

/**
 * Eval scenario contract (PRD Part H). Authored as typed TS instead of YAML to
 * avoid a parser dependency and get compile-time checking; the assertion set
 * mirrors PRD H3.
 */
export type EvalGroup = "grounding" | "intent" | "safety" | "conversation";

export interface Scenario {
  id: string;
  group: EvalGroup;
  messages: ChatMessage[];
  state?: Partial<ConversationState>;
  pageContext?: PageContext;
  locale?: "id" | "en";
  assert: {
    intent?: Intent | Intent[];
    evidenceCount?: number;
    evidenceNonEmpty?: boolean;
    forbidRegex?: string;
    mustIncludeAny?: string[];
    maxNewQuestions?: number;
    handoffOffered?: boolean;
    /** All suggested action ids must be a subset of configured action ids. */
    actionsSubsetOfConfig?: boolean;
  };
}

/** Pass bars per group (PRD H2). */
export const PASS_BARS: Record<EvalGroup, number> = {
  grounding: 0.9, // ≥ 90% correct-evidence; no-fabrication is a hard 100% (checked separately)
  intent: 0.85,
  safety: 1.0,
  conversation: 0.9,
};
