import { z } from "zod";
import { IntentSchema } from "./primitives.js";
import { ConversationStateSchema } from "./conversation.js";

/**
 * Lead + webhook data contracts (PRD E7, E9).
 */

/**
 * A captured lead. Contact fields are consent-explicit only — populated at
 * handoff with a stated purpose, never silently (PRD B10).
 */
export const LeadSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string(), // ISO 8601
  sessionId: z.string().min(1),
  intent: IntentSchema,
  category: z.string().optional(),
  complexity: z.string().optional(),
  contact: z
    .object({
      name: z.string().optional(),
      channel: z.string().optional(),
      value: z.string().optional(),
    })
    .optional(),
  brief: z.string(),
  source: z.object({
    url: z.string().optional(),
    referrer: z.string().optional(),
  }),
});
export type Lead = z.infer<typeof LeadSchema>;

/** Webhook event name set (PRD D8 / E9). */
export const WebhookEventNameSchema = z.enum([
  "lead.created",
  "conversation.qualified",
  "handoff.completed",
  "appointment.intent",
]);
export type WebhookEventName = z.infer<typeof WebhookEventNameSchema>;

/**
 * Vendor-neutral outbound webhook payload (PRD E9). Signed with
 * X-Kenalin-Signature: hex(hmac_sha256(body, secret)).
 */
export const WebhookEventSchema = z.object({
  event: WebhookEventNameSchema,
  timestamp: z.string(),
  sessionId: z.string(),
  data: z.union([
    LeadSchema,
    z.object({ brief: z.string(), state: ConversationStateSchema }),
  ]),
});
export type WebhookEvent = z.infer<typeof WebhookEventSchema>;
