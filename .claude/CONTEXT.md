---
owner: Tech Lead
last_updated: 2026-07-06
update_trigger: Stack changes, new domain concept introduced, or glossary updated
status: current
---

# Kenalin — Context

> The project's vocabulary + conventions for the AI: stack · patterns · domain
> glossary. Canonical spec is [`docs/PRD.md`](../docs/PRD.md); data contracts in its
> Part E are authoritative.

## Stack
- **Language**: TypeScript 5 (strict, `noUncheckedIndexedAccess`)
- **Runtime**: Node.js ≥ 20; `core` must also run on Vercel / Workers
- **Monorepo**: pnpm workspaces + tsup (build) + Vitest (test)
- **Validation**: Zod — schemas are the single source of truth (types inferred)
- **Server**: Hono (stateless, SSE)
- **Widget**: Preact + esbuild, Shadow DOM, single file < 60 KB gz
- **LLM**: Google Gemini — `gemini-2.5-flash` (chat) + `gemini-embedding-001` (embeddings)
- **Storage**: local JSONL+vectors knowledge index; lead store `none | database (SQLite) | webhook | both`

## Architecture
Modular monorepo, one stateless orchestration flow. `widget → server → core`;
`core` is pure (zero I/O). One LLM pass per turn produces intent, answer, evidence,
CTAs, and complexity together — structured output validated against the `ChatResponse`
schema, then run through policy validators. See [`ARCHITECTURE.md`](../docs/ARCHITECTURE.md).

## Patterns in Use
- **Schema-first contracts**: every payload validates against a Zod schema in `core/schemas`; JSON Schema for provider structured output is derived from them.
- **Config-as-behavior**: owners change behavior in `kenalin.config.ts` only; the schema refuses to start on invalid config with a precise error.
- **Module registry**: seven togglable modules each declare quick actions, routed intents, and a prompt fragment; disabled → contributes nothing.
- **Interface seams**: `ChatProvider`, `EmbeddingProvider`, `KnowledgeStore`, `LeadStore` live in `core`; implementations live in `server` (swap vendor without touching `core`).
- **Non-overridable policy layer**: safety constants (B9) enforced in core prompt + post-validators; persona config is additive only.

## Anti-Patterns to Avoid
❌ Owner-specific strings ("Aldi", "TemiDev", phone numbers, personal URLs) in `packages/*` — they belong in `apps/*` config + `content/*` (CI grep gate).
❌ Node-only APIs or file/network I/O in `packages/core`.
❌ Per-concern LLM calls (separate intent/answer/CTA/complexity calls) — one pass only.
❌ Anything in PRD Part G3 → Out of Scope (multi-agent, MCP dependency, CRM, SaaS multi-tenancy, pricing/quotation output).
❌ A config field that could weaken a B9 safety guarantee.
❌ Emitting a URL not sourced from config actions or retrieved evidence; emitting a monetary figure.
❌ Declaring work env/secret-blocked without a **verified probe of the real runtime source** — check what the code actually reads (`.env` via `loadDotEnv`, not `process.env`), and sanity-check the probe itself (L-002, promoted).

## Domain Glossary

**Owner**:
The person a Kenalin deployment represents. The assistant always speaks *about* the owner in third person, never *as* them.
_Avoid_: user (that's the visitor), account, tenant.

**Visitor**:
The person chatting with the widget on the owner's site.
_Avoid_: user, customer, lead (a lead is a captured, consented visitor).

**Evidence**:
A retrieved public knowledge chunk shown to back a claim about the owner; every evidence id must trace to a retrieved chunk.
_Avoid_: source, citation, reference (reserve those for prose).

**Intent**:
The visitor's inferred goal for a turn (`explore | hiring | business_opportunity | existing_network | partnership | general | unknown`), emitted by the single orchestration pass.

**Module**:
One of seven togglable capabilities (Portfolio Discovery, Hiring Assistant, Lead Qualification, Service Matching, Contact Handoff, Calendar Booking, Page Context).

**Handoff**:
Routing a meaningful conversation to a human via a configured channel, carrying a plain-text conversation **brief** (≤ 700 chars).

**Qualification**:
Light, adaptive screening (≤ 3 questions default, ≤ 5 hard cap) that yields a broad category + complexity — never a price, always disclaimed as "initial classification, not a quotation".

**Complexity**:
`small | medium | complex` sizing of an opportunity. Never a monetary figure.
