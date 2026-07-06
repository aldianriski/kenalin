import type { ConversationState } from "../schemas/conversation.js";
import type { Language } from "../schemas/primitives.js";
import { BRIEF_MAX_CHARS, COMPLEXITY_DISCLAIMER } from "../policy/constants.js";

/**
 * Build the plain-text conversation brief handed to the owner at handoff
 * (PRD C5 / E8). ≤ 700 chars, no markdown (WhatsApp-safe).
 */

export interface BriefInput {
  language: Language;
  state: ConversationState;
  /** One-line who/where-from, derived from the conversation. */
  context?: string;
  primaryNeed?: string;
  friction?: string;
  preferredNextStep?: string;
}

const LABELS: Record<Language, Record<string, string>> = {
  id: {
    head: "[Ringkasan Kenalin]",
    context: "Konteks",
    need: "Kebutuhan utama",
    friction: "Kendala saat ini",
    category: "Kategori",
    complexity: "Klasifikasi awal",
    next: "Langkah berikutnya",
    unknown: "-",
  },
  en: {
    head: "[Kenalin brief]",
    context: "Context",
    need: "Primary need",
    friction: "Current friction",
    category: "Category",
    complexity: "Initial complexity",
    next: "Preferred next step",
    unknown: "-",
  },
};

export function buildBrief(input: BriefInput): string {
  const L = LABELS[input.language];
  const q = input.state.qualification;
  const complexity = q.complexity
    ? `${q.complexity} (${COMPLEXITY_DISCLAIMER[input.language]})`
    : L.unknown;
  const lines = [
    L.head,
    `${L.context}: ${input.context ?? L.unknown}`,
    `${L.need}: ${input.primaryNeed ?? L.unknown}`,
    `${L.friction}: ${input.friction ?? L.unknown}`,
    `${L.category}: ${q.category ?? L.unknown}`,
    `${L.complexity}: ${complexity}`,
    `${L.next}: ${input.preferredNextStep ?? L.unknown}`,
  ];
  const brief = lines.join("\n");
  return brief.length > BRIEF_MAX_CHARS ? brief.slice(0, BRIEF_MAX_CHARS - 1) + "…" : brief;
}
