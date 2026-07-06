/**
 * @kenalin/core — pure, I/O-free foundation for the Kenalin engine.
 *
 * Exports the canonical data contracts (Zod schemas, PRD Part E), the config
 * system (PRD D9), provider/store interfaces (PRD D3/D4), the module registry
 * (PRD FR-2), and non-overridable safety constants (PRD B9).
 *
 * This package must run in any JS runtime — no Node-only APIs, no file/network I/O.
 */

export const KENALIN_CORE_VERSION = "0.1.0";

export * from "./schemas/index.js";
export * from "./config/index.js";
export * from "./interfaces/index.js";
export * from "./modules/index.js";
export * from "./policy/index.js";
export * from "./knowledge/index.js";
export * from "./retrieval/index.js";
export * from "./prompt/builder.js";
export * from "./model/routing.js";
export * from "./orchestrator/index.js";
