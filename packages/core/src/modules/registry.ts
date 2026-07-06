import type { Intent } from "../schemas/primitives.js";
import type { KenalinConfig, ModulesConfig } from "../config/schema.js";
import { MODULE_KEYS } from "../config/schema.js";

/**
 * Module registry (PRD FR-2, B6, C3).
 *
 * Each module declares: a stable key, a human label, the quick actions it
 * contributes to the launcher, the intents it engages under (routing table
 * C3), and a prompt fragment appended to the system prompt when enabled.
 *
 * A disabled module contributes NO prompt, NO quick action, and NO routing —
 * verified by the "module off → no traces" test in Phase 4.
 */

export type ModuleKey = keyof ModulesConfig;

export interface QuickAction {
  id: string;
  /** Localized labels; the widget picks by conversation language. */
  label: { id: string; en: string };
  /** Optionally seeds an intent when clicked (PRD C1). */
  seedIntent?: Intent;
}

export interface ModuleDefinition {
  key: ModuleKey;
  label: string;
  /** Intents this module participates in (PRD C3). Empty = always-on infra. */
  intents: Intent[];
  /** Quick actions surfaced when this module is enabled (max 4 total, PRD B8). */
  quickActions: QuickAction[];
  /**
   * System-prompt fragment appended when enabled. Kept declarative here; the
   * prompt builder (Phase 2) assembles the final prompt from enabled fragments.
   */
  promptFragment: string;
}

const DEFINITIONS: Record<ModuleKey, ModuleDefinition> = {
  portfolioDiscovery: {
    key: "portfolioDiscovery",
    label: "Portfolio Discovery",
    intents: ["explore", "general", "partnership"],
    quickActions: [
      { id: "see_projects", label: { id: "Lihat project", en: "See projects" }, seedIntent: "explore" },
      { id: "know_profile", label: { id: "Kenali profil", en: "Know the profile" }, seedIntent: "explore" },
    ],
    promptFragment:
      "PORTFOLIO DISCOVERY: Answer questions about the owner's profile, projects, skills, " +
      "case studies and public career history. Shape: direct answer → relevant evidence → " +
      "source link → optional follow-up. Never invent a project not present in the retrieved knowledge.",
  },
  hiringAssistant: {
    key: "hiringAssistant",
    label: "Hiring Assistant",
    intents: ["hiring"],
    quickActions: [
      { id: "im_hiring", label: { id: "Saya sedang hiring", en: "I'm hiring" }, seedIntent: "hiring" },
    ],
    promptFragment:
      "HIRING ASSISTANT: Provide role-fit, leadership evidence, technical expertise and " +
      "project ownership, always evidence-framed. HARD BOUNDARIES: no salary, no internal " +
      "performance reviews, no confidential company info, no unsupported suitability claims " +
      "(never 'he is perfect for your role'). Salary/comp questions → polite boundary + contact CTA.",
  },
  leadQualification: {
    key: "leadQualification",
    label: "Lead Qualification",
    intents: ["business_opportunity"],
    quickActions: [
      {
        id: "business_need",
        label: { id: "Saya punya kebutuhan bisnis", en: "I have a business need" },
        seedIntent: "business_opportunity",
      },
    ],
    promptFragment:
      "LEAD QUALIFICATION: Acknowledge the stated problem first. Ask ONE adaptive question per " +
      "turn (goal, current_state, friction, stage, scope) — only dimensions still unknown and " +
      "material. Never ask name/email/company/phone during screening. Output a broad category + " +
      "complexity (small|medium|complex) with the disclaimer 'initial classification, not a " +
      "quotation'. Never state monetary figures. After classification, route to evidence + handoff.",
  },
  serviceMatching: {
    key: "serviceMatching",
    label: "Service Matching",
    intents: ["business_opportunity", "partnership"],
    quickActions: [],
    promptFragment:
      "SERVICE MATCHING: Map the visitor's problem to a relevant owner capability from the " +
      "configured services ONLY. Matched service ids must be a subset of configured service ids. " +
      "Then surface evidence and a suggested next step.",
  },
  contactHandoff: {
    key: "contactHandoff",
    label: "Contact Handoff",
    intents: ["business_opportunity", "hiring", "existing_network", "partnership"],
    quickActions: [],
    promptFragment:
      "CONTACT HANDOFF: When intent is meaningful, generate a plain-text conversation brief " +
      "(≤ 700 chars, no markdown) and offer a handoff via an ENABLED channel only. Never invent " +
      "contact URLs — use only configured channels.",
  },
  calendarBooking: {
    key: "calendarBooking",
    label: "Calendar Booking",
    intents: ["hiring", "business_opportunity", "partnership"],
    quickActions: [],
    promptFragment:
      "CALENDAR BOOKING: Surface the configured booking URL as an action when appropriate. " +
      "NEVER claim availability (no 'the owner is free Tuesday'). No rescheduling logic.",
  },
  pageContext: {
    key: "pageContext",
    label: "Page Context",
    intents: [], // infra: enriches retrieval, not a routed conversation branch
    quickActions: [],
    promptFragment:
      "PAGE CONTEXT: If page context (url/title/projectId) is present, resolve deictic references " +
      "('project ini', 'this role') to that page's project. The widget works identically when absent.",
  },
};

/** All module definitions, in registration order. */
export const ALL_MODULES: ModuleDefinition[] = MODULE_KEYS.map((k) => DEFINITIONS[k]);

/** Definitions for modules enabled in this config. */
export function enabledModules(config: KenalinConfig): ModuleDefinition[] {
  return ALL_MODULES.filter((m) => config.modules[m.key]);
}

/** Is a specific module enabled? */
export function isModuleEnabled(config: KenalinConfig, key: ModuleKey): boolean {
  return config.modules[key] === true;
}

/**
 * Modules engaged for a given intent, per the routing table (PRD C3).
 * Disabled modules are removed → routing degrades toward `general`.
 */
export function modulesForIntent(config: KenalinConfig, intent: Intent): ModuleDefinition[] {
  return enabledModules(config).filter((m) => m.intents.includes(intent));
}

/**
 * Quick actions to render on the launcher — only from enabled modules, capped
 * at 4 visible (PRD B8).
 */
export function quickActions(config: KenalinConfig): QuickAction[] {
  return enabledModules(config)
    .flatMap((m) => m.quickActions)
    .slice(0, 4);
}

/** Ordered prompt fragments for every enabled module (Phase 2 assembles these). */
export function modulePromptFragments(config: KenalinConfig): string[] {
  return enabledModules(config).map((m) => m.promptFragment);
}
