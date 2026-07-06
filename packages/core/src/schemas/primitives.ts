import { z } from "zod";

/**
 * Shared enums used across every data contract (PRD Part E).
 * These are the vocabulary the whole engine agrees on; nothing else invents
 * intents, content types, or languages.
 */

/** Visitor intent — inferred per turn inside the single orchestration pass (PRD C1). */
export const IntentSchema = z.enum([
  "explore",
  "hiring",
  "business_opportunity",
  "existing_network",
  "partnership",
  "general",
  "unknown",
]);
export type Intent = z.infer<typeof IntentSchema>;

/** Knowledge content type (PRD B7 FR-K4 / Part E). */
/**
 * Content type for knowledge chunks + evidence. `.catch("custom")` makes the engine
 * agnostic to the index taxonomy: an unknown/legacy type (e.g. from a host's own
 * content frontmatter) coerces to "custom" instead of throwing, so any locally-managed
 * context deploys without a schema dependency. Evidence still renders, just as generic.
 */
export const ContentTypeSchema = z
  .enum([
    "profile",
    "experience",
    "project",
    "case_study",
    "service",
    "article",
    "skill",
    "testimonial",
    "contact",
    "custom",
  ])
  .catch("custom");
export type ContentType = z.infer<typeof ContentTypeSchema>;

/** Conversation language. Bilingual id/en by default (PRD B8). */
export const LanguageSchema = z.enum(["id", "en"]);
export type Language = z.infer<typeof LanguageSchema>;

/** Channels through which a human handoff can occur (PRD Module E). */
export const HandoffChannelSchema = z.enum([
  "whatsapp",
  "email",
  "calendar",
  "contact_form",
  "webhook",
]);
export type HandoffChannel = z.infer<typeof HandoffChannelSchema>;

/** Suggested-action types. `url` on an action must originate from config (PRD E5). */
export const ActionTypeSchema = z.enum([
  "link",
  "whatsapp",
  "email",
  "calendar",
  "contact_form",
  "custom",
]);
export type ActionType = z.infer<typeof ActionTypeSchema>;

/** Qualification screening dimensions (PRD C4 / E2). */
export const QualificationDimensionSchema = z.enum([
  "goal",
  "current_state",
  "friction",
  "stage",
  "scope",
]);
export type QualificationDimension = z.infer<typeof QualificationDimensionSchema>;

/** Opportunity complexity — never a price, always disclaimed (PRD Module C). */
export const ComplexitySchema = z.enum(["small", "medium", "complex"]);
export type Complexity = z.infer<typeof ComplexitySchema>;

/** Qualification lifecycle stage (PRD E2). */
export const QualificationStageSchema = z.enum(["idle", "screening", "classified"]);
export type QualificationStage = z.infer<typeof QualificationStageSchema>;
