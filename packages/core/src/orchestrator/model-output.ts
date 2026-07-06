import { z } from "zod";
import {
  IntentSchema,
  ComplexitySchema,
  QualificationStageSchema,
  QualificationDimensionSchema,
} from "../schemas/primitives.js";
import type { JsonSchema } from "../interfaces/providers.js";

/**
 * What the LLM emits in the single orchestration pass. Deliberately narrower
 * than `ChatResponse`: the model references evidence and actions by **id only**
 * (subsets of the ids provided in the prompt), so it structurally cannot invent
 * a URL — the server resolves ids → full Evidence/Action objects afterwards
 * (PRD B9 enforcement layer 2).
 */
export const ModelOutputSchema = z.object({
  answer: z.string(),
  intent: IntentSchema,
  confidence: z.number().min(0).max(1),
  /** ids of provided evidence the answer relies on (⊆ provided evidence ids). */
  evidenceIds: z.array(z.string()).default([]),
  /** ids of provided actions to surface (⊆ provided action ids). */
  suggestedActionIds: z.array(z.string()).default([]),
  /** Qualification snapshot when screening/classified; null otherwise. */
  qualification: z
    .object({
      stage: QualificationStageSchema.nullable(),
      category: z.string().nullable(),
      complexity: ComplexitySchema.nullable(),
    })
    .nullable()
    .default(null),
  /** The next screening question's dimension, if the model chose to ask one. */
  askDimension: QualificationDimensionSchema.nullable().default(null),
  /** Whether to offer a human handoff this turn. */
  offerHandoff: z.boolean().default(false),
});
export type ModelOutput = z.infer<typeof ModelOutputSchema>;

/**
 * The Gemini-format `responseSchema` for structured output. Kept hand-authored
 * (not derived) to match Gemini's picky OpenAPI subset exactly and to control
 * required/nullable shape. Must stay in sync with ModelOutputSchema above.
 */
export const GEMINI_MODEL_OUTPUT_SCHEMA: JsonSchema = {
  type: "OBJECT",
  properties: {
    answer: { type: "STRING" },
    intent: {
      type: "STRING",
      enum: [
        "explore",
        "hiring",
        "business_opportunity",
        "existing_network",
        "partnership",
        "general",
        "unknown",
      ],
    },
    confidence: { type: "NUMBER" },
    evidenceIds: { type: "ARRAY", items: { type: "STRING" } },
    suggestedActionIds: { type: "ARRAY", items: { type: "STRING" } },
    qualification: {
      type: "OBJECT",
      nullable: true,
      properties: {
        stage: { type: "STRING", nullable: true, enum: ["idle", "screening", "classified"] },
        category: { type: "STRING", nullable: true },
        complexity: { type: "STRING", nullable: true, enum: ["small", "medium", "complex"] },
      },
    },
    askDimension: {
      type: "STRING",
      nullable: true,
      enum: ["goal", "current_state", "friction", "stage", "scope"],
    },
    offerHandoff: { type: "BOOLEAN" },
  },
  required: ["answer", "intent", "confidence", "evidenceIds", "suggestedActionIds", "offerHandoff"],
};
