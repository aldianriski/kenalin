import type { KenalinConfig } from "../config/schema.js";
import type { Language } from "../schemas/primitives.js";
import {
  ChatResponseSchema,
  type Action,
  type ChatResponse,
  type ConversationState,
  type QualificationAnswer,
} from "../schemas/conversation.js";
import type { Evidence } from "../schemas/knowledge.js";
import type { ModelOutput } from "./model-output.js";
import {
  containsCurrency,
  detectImpersonation,
  deImpersonate,
  extractUrls,
  isAllowedUrl,
} from "../policy/validators.js";
import { INTENT_CONFIDENCE_FLOOR, PRICING_BOUNDARY } from "../policy/constants.js";
import { buildBrief } from "./brief.js";
import { resolveHandoff } from "./handoff.js";
import { isModuleEnabled } from "../modules/registry.js";

export interface AssembleContext {
  config: KenalinConfig;
  language: Language;
  state: ConversationState;
  /** Full evidence objects keyed by id (from the retrieved set). */
  evidenceById: Map<string, Evidence>;
  /** Full action objects keyed by id (from config). */
  actionById: Map<string, Action>;
}

export interface AssembleResult {
  response: ChatResponse;
  /** Policy violations that were corrected (for quality logging). */
  violations: string[];
}

/**
 * Validate + sanitize a raw ModelOutput into a safe ChatResponse (PRD FR-4, B9).
 * This is the non-overridable gate every response passes through: currency
 * block, impersonation strip, URL allowlist, evidence/action id filtering,
 * server-enforced question cap, and handoff resolution.
 */
export function assembleResponse(model: ModelOutput, ctx: AssembleContext): AssembleResult {
  const { config, language, state } = ctx;
  const violations: string[] = [];
  let answer = model.answer;

  // 1. Currency / pricing block (unless a pricing module unlocked it — always false in MVP).
  if (!config.complexity.showPricing && containsCurrency(answer)) {
    violations.push("currency_blocked");
    answer = PRICING_BOUNDARY[language];
  }

  // 2. Impersonation strip.
  if (detectImpersonation(answer, config.owner.name)) {
    violations.push("impersonation_stripped");
    answer = deImpersonate(answer, config.owner.name);
  }

  // 3. Evidence: keep only ids that were actually provided.
  const evidence: Evidence[] = [];
  for (const id of dedupe(model.evidenceIds)) {
    const e = ctx.evidenceById.get(id);
    if (e) evidence.push(e);
    else violations.push(`dropped_unknown_evidence:${id}`);
  }

  // 4. Actions: keep only ids that were actually provided.
  const suggestedActions: Action[] = [];
  for (const id of dedupe(model.suggestedActionIds)) {
    const a = ctx.actionById.get(id);
    if (a) suggestedActions.push(a);
    else violations.push(`dropped_unknown_action:${id}`);
  }

  // 5. URL allowlist: strip any URL in the answer text not sourced from config/evidence.
  const allowlist = new Set<string>();
  for (const a of ctx.actionById.values()) if (a.url) allowlist.add(a.url);
  for (const e of ctx.evidenceById.values()) if (e.url) allowlist.add(e.url);
  for (const url of extractUrls(answer)) {
    if (!isAllowedUrl(url, allowlist)) {
      violations.push("invented_url_stripped");
      answer = answer.replace(url, "").replace(/\s{2,}/g, " ").trim();
    }
  }

  // 6. Server-enforced question cap (PRD FR-8). Untrusted client state is re-checked.
  const qual = state.qualification;
  let questionCount = qual.questionCount;
  const answers: QualificationAnswer[] = [...qual.answers];
  let askDimension = model.askDimension;
  let forceHandoff = false;
  if (askDimension) {
    const alreadyAsked = answers.some((a) => a.dimension === askDimension);
    if (alreadyAsked) {
      askDimension = null; // never re-ask an answered dimension
    } else if (questionCount >= config.qualification.hardCap) {
      violations.push("question_cap_reached");
      askDimension = null;
      forceHandoff = true; // cap hit with live intent → route to handoff
    } else {
      questionCount += 1;
      answers.push({ dimension: askDimension, value: "" });
    }
  }

  // 7. Qualification snapshot from the model, merged with server-tracked counters.
  const modelQual = model.qualification;
  const qualification = modelQual
    ? { stage: modelQual.stage, category: modelQual.category, complexity: modelQual.complexity }
    : qual.stage
      ? { stage: qual.stage, category: qual.category, complexity: qual.complexity }
      : null;

  // Cap reached during active screening → route to handoff even if the model
  // didn't ask a (now-suppressed) question this turn (PRD C5).
  if (qual.stage === "screening" && questionCount >= config.qualification.hardCap) {
    if (!violations.includes("question_cap_reached")) violations.push("question_cap_reached");
    forceHandoff = true;
  }

  // 8. Handoff resolution (only via an enabled module + a configured channel).
  const wantHandoff = (model.offerHandoff || forceHandoff) && isModuleEnabled(config, "contactHandoff");
  let handoff = null as ChatResponse["handoff"];
  const nextState: ConversationState = {
    ...state,
    qualification: {
      stage: qualification?.stage ?? qual.stage,
      category: qualification?.category ?? qual.category,
      complexity: qualification?.complexity ?? qual.complexity,
      answers,
      questionCount,
    },
  };
  if (wantHandoff) {
    const brief = buildBrief({ language, state: nextState });
    handoff = resolveHandoff(config, brief);
  }

  // 9. Intent + confidence floor (PRD C1): below the floor → unknown.
  const confidence = clamp01(model.confidence);
  const intent = confidence < INTENT_CONFIDENCE_FLOOR ? "unknown" : model.intent;
  const intentHistory =
    state.intentHistory.at(-1) === intent ? state.intentHistory : [...state.intentHistory, intent];

  // 10. Assemble + schema-validate the final response (never returns raw).
  const response = ChatResponseSchema.parse({
    answer: answer || fallbackAnswer(language),
    intent,
    confidence,
    evidence,
    suggestedActions,
    qualification,
    handoff,
    stateUpdates: {
      intent,
      confidence,
      intentHistory,
      language,
      qualification: nextState.qualification,
      handoffOffered: state.handoffOffered || Boolean(handoff),
    },
  });

  return { response, violations };
}

function dedupe(ids: string[]): string[] {
  return [...new Set(ids)];
}
function clamp01(n: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
}
function fallbackAnswer(language: Language): string {
  return language === "id"
    ? "Maaf, ada kendala sesaat. Boleh coba tanya lagi?"
    : "Sorry, a brief hiccup — could you ask that again?";
}
