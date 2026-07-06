import { z } from "zod";
import {
  ActionTypeSchema,
  ComplexitySchema,
  ContentTypeSchema,
  LanguageSchema,
} from "../schemas/primitives.js";

/**
 * Config data contract (PRD D9). Owners configure behavior here without
 * touching core. Validated by Zod at boot; an invalid config refuses to start
 * with a precise error.
 *
 * NOTE (PRD B9 / FR-6): there is deliberately NO field here that can weaken a
 * safety policy. Persona fields (tone, boundaries) add flavor only.
 */

export const OwnerConfigSchema = z.object({
  name: z.string().min(1),
  preferredName: z.string().optional(),
  role: z.string().min(1),
  website: z.string().url(),
});

export const AssistantConfigSchema = z.object({
  name: z.string().min(1),
  launcherLabel: z.string().default("Ask"),
  description: z.string().optional(),
  languages: z.array(LanguageSchema).min(1).default(["id", "en"]),
  openingMessage: z.string().optional(),
  tone: z.string().optional(),
  /** Extra persona guidance — additive only, cannot remove B9 policies. */
  boundaries: z.string().optional(),
});

/** The seven modules (PRD B6). Each toggles independently (FR-2). */
export const ModulesConfigSchema = z.object({
  portfolioDiscovery: z.boolean().default(true),
  hiringAssistant: z.boolean().default(true),
  leadQualification: z.boolean().default(true),
  serviceMatching: z.boolean().default(true),
  contactHandoff: z.boolean().default(true),
  calendarBooking: z.boolean().default(true),
  pageContext: z.boolean().default(true),
});
export type ModulesConfig = z.infer<typeof ModulesConfigSchema>;
export const MODULE_KEYS = Object.keys(ModulesConfigSchema.shape) as (keyof ModulesConfig)[];

export const ServiceConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  evidenceIds: z.array(z.string()).optional(),
});

export const ComplexityConfigSchema = z.object({
  enabled: z.boolean().default(true),
  /** Schema-locked to false in MVP — a future pricing module unlocks it (PRD D9). */
  showPricing: z.literal(false).default(false),
  levels: z.array(ComplexitySchema).default(["small", "medium", "complex"]),
});

export const HandoffConfigSchema = z.object({
  whatsapp: z.object({ number: z.string().min(1) }).optional(),
  email: z.object({ address: z.string().email() }).optional(),
  calendar: z.object({ url: z.string().url() }).optional(),
  webhook: z
    .object({
      url: z.string().url(),
      /** Secret is resolved from env at runtime, not stored here. */
      secret: z.string().optional(),
    })
    .optional(),
});

export const ActionConfigSchema = z.object({
  id: z.string().min(1),
  type: ActionTypeSchema,
  label: z.string().min(1),
  url: z.string().optional(),
  /**
   * Optional visibility gating for custom routes (e.g. TemiDev shown only for
   * business_opportunity + medium|complex — PRD F5). Enforced in the action layer.
   */
  visibleFor: z
    .object({
      intents: z.array(z.string()).optional(),
      complexity: z.array(ComplexitySchema).optional(),
    })
    .optional(),
});

export const KnowledgeSourceSchema = z.object({
  kind: z.enum(["url", "sitemap", "markdown", "json", "pdf"]),
  path: z.string().min(1),
});

export const KnowledgeConfigSchema = z.object({
  sources: z.array(KnowledgeSourceSchema).default([]),
});

export const StorageConfigSchema = z.object({
  lead: z.enum(["none", "database", "webhook", "both"]).default("none"),
  retentionDays: z.number().int().positive().default(30),
});

export const AnalyticsConfigSchema = z.object({
  enabled: z.boolean().default(false),
});

export const QualificationConfigSchema = z.object({
  maxQuestions: z.number().int().positive().default(3),
  hardCap: z.number().int().positive().default(5),
  categories: z.array(z.string()).optional(),
});

/** CORS allowlist + rate-limit knobs (PRD D6). */
export const ServerConfigSchema = z.object({
  allowedOrigins: z.array(z.string()).default([]),
  rateLimit: z
    .object({
      maxMessages: z.number().int().positive().default(20),
      windowMs: z.number().int().positive().default(10 * 60 * 1000),
    })
    .default({}),
});

export const KenalinConfigSchema = z
  .object({
    owner: OwnerConfigSchema,
    assistant: AssistantConfigSchema,
    modules: ModulesConfigSchema.default({}),
    services: z.array(ServiceConfigSchema).optional(),
    complexity: ComplexityConfigSchema.default({}),
    handoff: HandoffConfigSchema.default({}),
    actions: z.array(ActionConfigSchema).default([]),
    knowledge: KnowledgeConfigSchema.default({}),
    storage: StorageConfigSchema.default({}),
    analytics: AnalyticsConfigSchema.default({}),
    qualification: QualificationConfigSchema.default({}),
    server: ServerConfigSchema.default({}),
  })
  .superRefine((cfg, ctx) => {
    // hardCap must be >= maxQuestions (PRD B5 FR-8 / C4).
    if (cfg.qualification.hardCap < cfg.qualification.maxQuestions) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["qualification", "hardCap"],
        message: "qualification.hardCap must be >= qualification.maxQuestions",
      });
    }
    // Contact handoff enabled requires at least one reachable channel (PRD Module E AC).
    if (cfg.modules.contactHandoff) {
      const h = cfg.handoff;
      if (!h.whatsapp && !h.email && !h.calendar && !h.webhook) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["handoff"],
          message:
            "modules.contactHandoff is enabled but no handoff channel (whatsapp | email | calendar | webhook) is configured",
        });
      }
    }
    // Every action url of a link/calendar/custom type should be an absolute URL.
    cfg.actions.forEach((a, i) => {
      if (a.url && !/^https?:\/\//.test(a.url) && !a.url.startsWith("/")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["actions", i, "url"],
          message: "action url must be an absolute https URL or a root-relative path",
        });
      }
    });
  });

export type KenalinConfig = z.infer<typeof KenalinConfigSchema>;
/** The un-parsed shape an owner writes (defaults applied by the schema). */
export type KenalinConfigInput = z.input<typeof KenalinConfigSchema>;

export { ContentTypeSchema };
