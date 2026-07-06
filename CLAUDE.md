# CLAUDE.md — Kenalin build contract

> Read `docs/PRD.md` in full before writing code. It is the canonical spec.
> Data contracts in **Part E** are authoritative — if code must deviate, update Part E first, then code.

## Current phase

**All phases (0–6) are implemented and green + MVP-launch hardening done.**

Quality gates: `pnpm verify` (owner-string grep gate + typecheck + build + 62
tests) passes; **eval matrix 100% and stable** (billing enabled). Hardened for
launch: token/context budgets, abuse guards, scope + injection resistance,
secure headers, env-only secrets. The reference (Phase 5, RIZVA) is integrated
into the external portfolio (`D:\Project\portofolio`) — vendored engine + Next.js
routes + widget, **knowledge index populated (117 chunks)**; left uncommitted there.

**Next work + roadmap live in [`TODO.md`](TODO.md)** (v0.2 launch polish → v0.4
scale). Immediate P0: finalize + commit the portfolio deployment (TASK-001) and
graceful error UX (TASK-002).

Phase order and dependencies: `0 → 1 → 2 → (3 ∥ 4) → 5 → 6`.

## Hard rules (reject in review)

- **No owner-specific strings in `packages/*`.** Names ("Aldi", "TemiDev"), phone
  numbers, and personal URLs live only in `apps/*` config + `content/*`. There is a
  CI grep gate for this (PRD FR-1, H4.6).
- **Everything in PRD Part G3 → Out of Scope is forbidden.** No multi-agent, no MCP
  dependency, no CRM, no SaaS multi-tenancy, no pricing/quotation output.
- **Safety policy (PRD B9) is non-overridable.** Persona config adds flavor, never
  subtracts a safety guarantee. The config schema must have no field that can weaken it.
- **`core` stays pure.** Zero I/O, zero Node-only APIs — it must run in any JS runtime
  (Node, Vercel, Workers). All I/O lives in `server`.
- **Zod schemas are the single source of truth.** TS types are inferred; JSON Schema
  for provider structured output is derived from them.
- **One orchestration pass.** Intent, answer, CTA, and complexity come from a single
  LLM call with structured output — not per-concern calls (PRD D1).
- **Secrets only via env** (`KENALIN_LLM_API_KEY`, `KENALIN_WEBHOOK_SECRET`). Never in
  config files or `/api/config/public`.

## Layout

```
packages/core     pure TS: schemas, config loader, orchestrator, prompt builder,
                  policies, module registry, provider/store INTERFACES, retrieval scoring
packages/server   Hono app: /api/chat (SSE), /api/config, webhook emit,
                  provider/store IMPLEMENTATIONS, ingest CLI
packages/widget   Preact Web Component + <script> embed; talks only to /api/chat
apps/reference-aldi   aldianrizki.com integration (config + content only)
content/demo      fictional demo owner for development & evals
evals/            scenario YAML + runner
docs/             PRD + lean docs
```

## Definition of Done per phase

See PRD Part G4. Do not mark a phase done until its DoD is verified.
