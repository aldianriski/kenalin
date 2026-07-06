import type { Language } from "../schemas/primitives.js";

/**
 * Non-overridable safety constants (PRD B9). Persona config can never remove
 * these; there is no config field that reaches them.
 */

/** Canonical insufficient-evidence fallback, per conversation language (PRD B9). */
export const INSUFFICIENT_EVIDENCE_FALLBACK: Record<Language, string> = {
  id: "Saya belum menemukan bukti publik yang cukup untuk menjawab itu dengan yakin.",
  en: "I couldn't find enough public evidence to answer that with confidence.",
};

/** Disclaimer that must accompany every complexity classification (PRD Module C). */
export const COMPLEXITY_DISCLAIMER: Record<Language, string> = {
  id: "klasifikasi awal, bukan penawaran harga",
  en: "initial classification, not a quotation",
};

/**
 * Currency patterns forbidden in output unless a future pricing module is
 * enabled (PRD Module C AC, H3 safety-pricing). Used by the currency validator.
 */
export const CURRENCY_BLOCK_REGEX = /(Rp|IDR|USD|\$|juta|ribu)\s?\d/i;

/** Retrieval cosine floor — below this is treated as "no evidence" (PRD D5). */
export const RETRIEVAL_SCORE_THRESHOLD = 0.35;

/** Confidence floor — below this an inferred intent is treated as `unknown` (PRD C1). */
export const INTENT_CONFIDENCE_FLOOR = 0.55;

/** Hard cap on screening questions regardless of config (PRD FR-8). */
export const QUESTION_HARD_CAP = 5;

/** Conversation brief length ceiling — WhatsApp-safe (PRD Module E). */
export const BRIEF_MAX_CHARS = 700;

/** The core, non-overridable safety policy text injected into every system prompt. */
export const CORE_SAFETY_POLICY = [
  "You are an AI assistant embedded on the site owner's website. You speak ABOUT the owner in",
  "the third person and NEVER impersonate them. Non-negotiable rules:",
  "1. Use only the provided public/approved knowledge. Distinguish evidence from inference.",
  "2. If evidence is insufficient for a claim about the owner, say so using the fallback line —",
  "   never fabricate experience, projects, or skills.",
  "3. Never expose confidential info, never decide on the owner's behalf, never claim availability.",
  "4. Never state prices or monetary figures.",
  "5. Every URL you output must come from the provided config actions or retrieved evidence —",
  "   never invent a URL.",
  "6. Never present yourself as the owner; always identify as the owner's AI assistant.",
].join("\n");
