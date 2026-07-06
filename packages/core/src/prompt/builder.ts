import type { KenalinConfig } from "../config/schema.js";
import type { ConversationState } from "../schemas/conversation.js";
import type { ContentType, Language } from "../schemas/primitives.js";
import type { PageContext } from "../schemas/conversation.js";
import { enabledModules } from "../modules/registry.js";
import {
  CORE_SAFETY_POLICY,
  COMPLEXITY_DISCLAIMER,
  INSUFFICIENT_EVIDENCE_FALLBACK,
} from "../policy/constants.js";

/** Lightweight evidence candidate handed to the prompt (id + text only). */
export interface EvidenceCandidate {
  id: string;
  title: string;
  type: ContentType;
  snippet: string;
}

/** Action candidate the model may surface, referenced by id. */
export interface ActionCandidate {
  id: string;
  label: string;
  type: string;
}

export interface PromptContext {
  language: Language;
  state: ConversationState;
  pageContext?: PageContext;
  evidence: EvidenceCandidate[];
  actions: ActionCandidate[];
}

function personaBlock(config: KenalinConfig, language: Language): string {
  const a = config.assistant;
  const opening = a.openingMessage ? `Opening style reference: "${a.openingMessage}"` : "";
  return [
    `You are ${a.name}, the AI assistant on ${config.owner.name}'s website (${config.owner.role}).`,
    `Speak ABOUT ${config.owner.preferredName ?? config.owner.name} in the third person — never as them.`,
    a.tone ? `Tone: ${a.tone}.` : "",
    a.boundaries ? `Persona note (never weakens the safety policy): ${a.boundaries}` : "",
    `Reply in the visitor's language (this conversation: ${language}).`,
    opening,
  ]
    .filter(Boolean)
    .join("\n");
}

function intentBlock(): string {
  return [
    "INTENT — classify the visitor's intent this turn (one of: explore, hiring,",
    "business_opportunity, existing_network, partnership, general, unknown) and emit",
    "`confidence` 0..1. When the signal is clear, be confident (≥ 0.7). Reference cues:",
    "- hiring: asking about role fit, leadership, team, stack, work history (\"pernah lead team?\").",
    "- business_opportunity: describing a business problem/process/need (\"approval saya masih lewat WhatsApp\").",
    "- explore: asking about a specific project, skill, or the profile (\"project QuickHub itu apa?\").",
    "- existing_network: someone who already knows the owner, just saying hi (\"ini Budi dari X, mau nyapa\").",
    "- partnership: an agency/company proposing collaboration or co-delivery.",
    "- general: on-topic but broad; unknown: genuinely ambiguous (ask one clarifying question).",
  ].join("\n");
}

function conversationRules(config: KenalinConfig, language: Language): string {
  const maxQ = config.qualification.maxQuestions;
  const cap = config.qualification.hardCap;
  return [
    "CONVERSATION RULES:",
    "- Infer the visitor's intent this turn and emit it with a confidence 0..1.",
    "- Cite evidence by id ONLY when a retrieved item actually names the thing asked about; if the visitor asks about a project/entity not present in EVIDENCE, use the insufficient-evidence line and return no evidence ids.",
    `- When the screening question cap (${cap}) is reached, stop asking and set offerHandoff=true.`,
    "- Ground every claim about the owner in the provided EVIDENCE; reference the evidence you use by id.",
    `- If no evidence supports an owner-claim, do not guess — answer with: "${INSUFFICIENT_EVIDENCE_FALLBACK[language]}" and return no evidence ids.`,
    `- Screening: ask at most one question per turn, ≤ ${maxQ} by default (hard cap ${cap}). Never re-ask an answered dimension. Never ask for name/email/phone during screening.`,
    `- Any complexity classification MUST be labeled "${COMPLEXITY_DISCLAIMER[language]}". Never output a price or monetary figure.`,
    "- Only surface actions from the provided ACTIONS list, by id. Set offerHandoff=true when intent is meaningful and a contact channel is available.",
    "- Off-topic (world knowledge / coding help): briefly state you are here to introduce the owner and offer the quick actions.",
  ].join("\n");
}

function evidenceBlock(evidence: EvidenceCandidate[]): string {
  if (evidence.length === 0) {
    return "EVIDENCE: (none retrieved — treat owner-claim questions as unsupported.)";
  }
  const lines = evidence.map(
    (e) => `- id=${e.id} [${e.type}] ${e.title}: ${e.snippet.replace(/\s+/g, " ").slice(0, 320)}`,
  );
  return "EVIDENCE (reference by id only; these are the ONLY supported facts):\n" + lines.join("\n");
}

function actionsBlock(actions: ActionCandidate[]): string {
  if (actions.length === 0) return "ACTIONS: (none configured.)";
  const lines = actions.map((a) => `- id=${a.id} (${a.type}): ${a.label}`);
  return "ACTIONS (surface by id only; never invent one):\n" + lines.join("\n");
}

function stateBlock(state: ConversationState, page?: PageContext): string {
  const q = state.qualification;
  const answered = q.answers.map((a) => a.dimension).join(", ") || "none";
  const lines = [
    "CONVERSATION STATE:",
    `- intent so far: ${state.intent} (history: ${state.intentHistory.join(" → ") || "none"})`,
    `- screening: stage=${q.stage ?? "none"}, questionsAsked=${q.questionCount}, answeredDimensions=[${answered}], category=${q.category ?? "none"}, complexity=${q.complexity ?? "none"}`,
    `- handoff already offered: ${state.handoffOffered}`,
  ];
  if (page) {
    lines.push(
      `- page context: url=${page.url}${page.projectId ? `, projectId=${page.projectId} (resolve "this project" to it)` : ""}${page.pageType ? `, pageType=${page.pageType}` : ""}`,
    );
  }
  return lines.join("\n");
}

/**
 * Assemble the full system prompt for the single orchestration pass (PRD D5 step 6):
 * core safety policy + persona + enabled-module fragments + conversation rules +
 * retrieved evidence + available actions + conversation state. Pure; no I/O.
 */
export function buildSystemPrompt(config: KenalinConfig, ctx: PromptContext): string {
  const moduleFragments = enabledModules(config).map((m) => `- ${m.promptFragment}`);
  return [
    CORE_SAFETY_POLICY,
    "",
    personaBlock(config, ctx.language),
    "",
    "ENABLED CAPABILITIES:",
    ...moduleFragments,
    "",
    intentBlock(),
    "",
    conversationRules(config, ctx.language),
    "",
    stateBlock(ctx.state, ctx.pageContext),
    "",
    evidenceBlock(ctx.evidence),
    "",
    actionsBlock(ctx.actions),
    "",
    "Respond ONLY with the structured JSON object matching the required schema.",
  ].join("\n");
}
