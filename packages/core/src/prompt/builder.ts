import type { KenalinConfig } from "../config/schema.js";
import type { ConversationState } from "../schemas/conversation.js";
import type { ContentType, Language } from "../schemas/primitives.js";
import type { PageContext } from "../schemas/conversation.js";
import { enabledModules } from "../modules/registry.js";
import {
  CORE_SAFETY_POLICY,
  COMPLEXITY_DISCLAIMER,
  INSUFFICIENT_EVIDENCE_FALLBACK,
  LIMITS,
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
    `- Grounding: if the visitor names a specific project, company, or product and NO EVIDENCE item's title or text contains that exact name, treat it as UNKNOWN — reply with "${INSUFFICIENT_EVIDENCE_FALLBACK[language]}" and return an EMPTY evidence list. Never cite loosely-related items to cover an unknown name.`,
    `- When the screening question cap (${cap}) is reached, stop asking and set offerHandoff=true.`,
    "- Ground every claim about the owner in the provided EVIDENCE; reference the evidence you use by id.",
    `- If no evidence supports an owner-claim, do not guess — answer with: "${INSUFFICIENT_EVIDENCE_FALLBACK[language]}" and return no evidence ids.`,
    "- Do NOT repeat information already given earlier in this conversation. Answer THIS turn's question directly with the most SPECIFIC relevant evidence, leading with what is NEW to the visitor. The owner's role/company/bio one-liner is background — state it at most ONCE per conversation; when the visitor changes topic (e.g. to hiring or a specific project), respond with fresh topic-relevant evidence, never a re-summary of who the owner is or a restatement of their current title. Vary your openings; never reuse the same framing. (Emphasis/ordering only — you MUST still ground every owner-claim in evidence by id.)",
    `- Screening: ask at most one question per turn, ≤ ${maxQ} by default (hard cap ${cap}). Never re-ask an answered dimension. Never ask for name/email/phone during screening.`,
    "- When you ask a screening question, also emit `suggestedReplies`: 2–4 short (≤ 5 words) tappable answer options the visitor can pick, plus a broad catch-all (e.g. 'Semua di atas' / 'All of the above'). Leave it empty when not asking a screening question.",
    `- Any complexity classification MUST be labeled "${COMPLEXITY_DISCLAIMER[language]}". Never output a price or monetary figure.`,
    "- Only surface actions from the provided ACTIONS list, by id. Set offerHandoff=true when intent is meaningful and a contact channel is available.",
    "- Off-topic (world knowledge / coding help): briefly state you are here to introduce the owner and offer the quick actions.",
  ].join("\n");
}

function evidenceBlock(evidence: EvidenceCandidate[]): string {
  if (evidence.length === 0) {
    return "EVIDENCE: (none retrieved — treat owner-claim questions as unsupported.)";
  }
  const lines = evidence
    .slice(0, LIMITS.maxEvidenceInPrompt)
    .map(
      (e) =>
        `- id=${e.id} [${e.type}] ${e.title}: ${e.snippet.replace(/\s+/g, " ").slice(0, LIMITS.evidenceSnippetChars)}`,
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
 * available actions + retrieved evidence + conversation state. Pure; no I/O.
 *
 * Ordering is deliberate (TASK-005): the config-static blocks — safety, persona,
 * modules, intent, rules, actions — lead, so they form one long stable prefix that
 * is identical turn-to-turn for a given (config, language). The per-turn blocks
 * (state, evidence) trail. That maximizes the prefix the provider's implicit
 * context cache can reuse, cutting the effective prompt cost.
 */
export function buildSystemPrompt(config: KenalinConfig, ctx: PromptContext): string {
  const moduleFragments = enabledModules(config).map((m) => `- ${m.promptFragment}`);
  return [
    // --- Static prefix (stable per config+language → cacheable) ---
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
    actionsBlock(ctx.actions),
    "",
    // --- Dynamic suffix (per-turn) ---
    stateBlock(ctx.state, ctx.pageContext),
    "",
    evidenceBlock(ctx.evidence),
    "",
    "Respond ONLY with the structured JSON object matching the required schema.",
  ].join("\n");
}
