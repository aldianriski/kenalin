import { z } from "zod";
import {
  ActionTypeSchema,
  ComplexitySchema,
  HandoffChannelSchema,
  IntentSchema,
  LanguageSchema,
  QualificationDimensionSchema,
  QualificationStageSchema,
} from "./primitives.js";
import { EvidenceSchema } from "./knowledge.js";

/**
 * Conversation data contracts (PRD E1, E2, E3, E5).
 * The server is stateless (FR-7): everything it needs arrives in ChatRequest,
 * and ConversationState round-trips client↔server every turn.
 */

/** A single suggested action (CTA). `url`, when present, must come from config (PRD E5). */
export const ActionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: ActionTypeSchema,
  url: z.string().optional(),
});
export type Action = z.infer<typeof ActionSchema>;

/** One answered screening dimension during qualification. */
export const QualificationAnswerSchema = z.object({
  dimension: QualificationDimensionSchema,
  value: z.string(),
});
export type QualificationAnswer = z.infer<typeof QualificationAnswerSchema>;

/** Qualification sub-state (PRD E2). */
export const QualificationStateSchema = z.object({
  stage: QualificationStageSchema.nullable().default(null),
  category: z.string().nullable().default(null),
  complexity: ComplexitySchema.nullable().default(null),
  answers: z.array(QualificationAnswerSchema).default([]),
  questionCount: z.number().int().nonnegative().default(0),
});
export type QualificationState = z.infer<typeof QualificationStateSchema>;

/**
 * The full conversation state (PRD E2). Held client-side, echoed to the server
 * each turn. Restarting the server mid-conversation loses nothing.
 */
export const ConversationStateSchema = z.object({
  intent: IntentSchema.default("unknown"),
  confidence: z.number().min(0).max(1).default(0),
  intentHistory: z.array(IntentSchema).default([]),
  language: LanguageSchema.default("id"),
  qualification: QualificationStateSchema.default({}),
  handoffOffered: z.boolean().default(false),
});
export type ConversationState = z.infer<typeof ConversationStateSchema>;

/** A single chat message in the trimmed window (last ~12). */
export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

/** Page context supplied by the widget (PRD Module G / E1). */
export const PageContextSchema = z.object({
  url: z.string(),
  title: z.string().optional(),
  pageType: z.string().optional(),
  projectId: z.string().optional(),
});
export type PageContext = z.infer<typeof PageContextSchema>;

/** Inbound request to POST /api/chat (PRD E1). */
export const ChatRequestSchema = z.object({
  sessionId: z.string().min(1),
  messages: z.array(ChatMessageSchema).min(1),
  state: ConversationStateSchema.default({}),
  pageContext: PageContextSchema.optional(),
  locale: LanguageSchema.optional(),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

/** Handoff payload attached to a response when a handoff is offered (PRD E3). */
export const HandoffSchema = z.object({
  channel: HandoffChannelSchema,
  brief: z.string(),
  url: z.string().optional(),
});
export type Handoff = z.infer<typeof HandoffSchema>;

/**
 * Structured response contract (PRD E3 / FR-4). Every /api/chat response
 * validates against this; malformed LLM output is repaired once or degraded
 * to a safe fallback — never streamed raw.
 */
export const ChatResponseSchema = z.object({
  answer: z.string(),
  intent: IntentSchema,
  confidence: z.number().min(0).max(1),
  evidence: z.array(EvidenceSchema).default([]),
  suggestedActions: z.array(ActionSchema).default([]),
  /** Short, tappable answer options for a screening question (guideline). */
  suggestedReplies: z.array(z.string()).default([]),
  qualification: z
    .object({
      stage: QualificationStageSchema.nullable(),
      category: z.string().nullable(),
      complexity: ComplexitySchema.nullable(),
    })
    .nullable()
    .default(null),
  handoff: HandoffSchema.nullable().default(null),
  stateUpdates: ConversationStateSchema.partial().default({}),
});
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
