---
owner: Tech Lead
last_updated: 2026-07-06
update_trigger: Sprint completed, task added, or task status changed
status: current
---

# Kenalin — Development Tracker

> **How to use this file**
> - **Session start** — read this + `CLAUDE.md` first; the Active Sprint is the current focus.
> - **Sprint promote/close** — `/lean-doc-generator promote` pulls Backlog tasks into a sprint file; `close` writes the retro.
> - **Sprint completed** — move its Changelog block to `docs/CHANGELOG.md`.
> - `src: you` = owner's note · `src: claude` = gap Claude flagged.

---

## Active Sprint

> **SPRINT-002 — Harden for scale** → [`docs/sprint/SPRINT-002-harden-for-scale.md`](docs/sprint/SPRINT-002-harden-for-scale.md)
> T1 TASK-007 distributed rate limiter (Upstash) · T2 TASK-008 CI gate · T3 TASK-005 model tuning. Resolves TD-005/006/007; progresses TD-001.

Status: `pnpm verify` green (68 tests) · eval matrix 3/3 stable · widget 14.2 KB gz · reference integrated + indexed (117 chunks). Shipped detail → [`docs/CHANGELOG.md`](docs/CHANGELOG.md).

---

## Backlog

### P0 — Critical / Blocking

- [ ] **TASK-025 — Finalize + commit reference deployment** [size: S] · src: you · state: blocked (owner)
      done-when: `API_KEY_GEMINI` added to the portfolio `.env`; real `handoff.whatsapp`/`calendar` + prod `allowedOrigins` set; live `/api/chat` smoke passes; portfolio committed.
      touches: `D:/Project/portofolio/lib/kenalin/*` + `.env`, portfolio git.
      note: engine+widget already re-vendored; `/api/config/public` validated live. Was SPRINT-001 T3 (descoped — owner-blocked).

### P1 — Next Phase (v0.2 — launch polish)

- [ ] **TASK-004 — Custom branding via config** [size: M] · src: you · state: ready
      done-when: owner sets launcher logo/avatar (image URL or keep K-mark) + theme preset/tokens in config without code; "Powered by Kenalin" footer is present and not removable by config.
      touches: `core/config/schema.ts`, `server/src/public-config.ts`, `widget/src/app.tsx`, `widget/src/styles.ts`.
- [ ] **TASK-006 — Accessibility to Lighthouse a11y ≥ 90** [size: M] · src: claude · state: ready
      done-when: focus trap in the open panel, ARIA live region for the streaming answer, full keyboard nav, contrast verified; Lighthouse a11y ≥ 90 on the example page (PRD Phase 3 DoD, not yet measured).
      touches: `widget/src/app.tsx`, `widget/src/styles.ts`.
- [~] **TASK-005 — Model usage optimization + tuning** — promoted → SPRINT-002 (T3)
- [~] **TASK-007 — Distributed rate limiter** — promoted → SPRINT-002 (T1)
- [~] **TASK-008 — CI gate (GitHub Actions)** — promoted → SPRINT-002 (T2)

### P2 — Quality / Polish

- [ ] **TASK-009 — Lazy-loading skeleton placeholders** [size: S] · src: you — initial open, config fetch, evidence cards show skeletons.
- [ ] **TASK-010 — Premium micro-animations** [size: S] · src: you — message enter/stagger, typing, evidence reveal; respect `prefers-reduced-motion`.
- [ ] **TASK-011 — Sound notification** [size: S] · src: you — subtle chime on new assistant message; opt-in, muted by default.
- [ ] **TASK-012 — Idle detection** [size: M] · src: you — inactivity timer → gentle "still there?" nudge or auto-minimize; session timeout.
- [ ] **TASK-013 — Conversation persistence** [size: S] · src: claude — localStorage resume so a refresh keeps the chat.
- [ ] **TASK-014 — Real token streaming** [size: M] · src: claude — stream Gemini tokens for lower time-to-first-token vs the current word-by-word pseudo-stream. Resolves TD-003.
- [ ] **TASK-015 — Analytics module (PRD B11)** [size: M] · src: claude — emit engagement/intent/conversion events via webhook/console, off by default, no PII.
- [ ] **TASK-016 — Handoff brief enrichment** [size: S] · src: claude — capture the visitor's actual screening answers into the brief (values currently empty).
- [ ] **TASK-017 — Evidence dedup by projectId** [size: S] · src: claude — id/en chunks of one project currently both surface as separate cards.
- [ ] **TASK-018 — Launcher unread badge** [size: S] · src: claude — minimize-to-badge with an unread count.

### P3 — Long-term (v0.4 — scale & extensibility)

- [ ] **TASK-019 — pgvector/Postgres KnowledgeStore** [size: L] · src: claude — for corpora beyond ~10³ chunks (ADR-002 P1).
- [ ] **TASK-020 — Anthropic + OpenAI provider adapters** [size: M] · src: claude — behind existing interfaces (ADR-003 P1).
- [ ] **TASK-021 — Admin / config UI** [size: L] · src: claude — no-code editing of persona/modules/actions/theme (completes TASK-004 end-to-end).
- [ ] **TASK-022 — `create-kenalin` + publish `@kenalin/*` to npm** [size: M] · src: claude — clean consumption instead of vendoring. Resolves TD-004.
- [ ] **TASK-023 — Ingestion improvements** [size: M] · src: claude — map MDX frontmatter → type/projectId/url; incremental/scheduled re-index; PII redaction on briefs.
- [ ] **TASK-024 — Response/embedding caching** [size: M] · src: claude — cache identical queries + embeddings to cut cost/latency.

---

## Tech Debt

- **TD-001** severity: medium | status: resolved → TASK-005 (Sprint-002) | created: Sprint-000 — Eval counts were 5/5/8/3. Expanded to 12/15/12/10 (49), 100% green id+en.
- **TD-002** severity: medium | status: open | created: Sprint-000 — Widget test coverage thin (only the SSE parser). done-when: component tests for app/message/evidence/chips render + click.
- **TD-003** severity: minor | status: open | created: Sprint-000 — Answer is pseudo-streamed word-by-word, not real token streaming. done-when: TASK-014.
- **TD-004** severity: minor | status: open | created: Sprint-000 — Portfolio consumes a vendored bundle; must re-vendor on each release. done-when: TASK-022.
- **TD-005** severity: medium | status: resolved → TASK-007 (Sprint-002) | created: Sprint-000 — Rate limiter is in-memory (per serverless instance). Redis-backed via Upstash; in-memory kept as fallback.
- **TD-006** severity: medium | status: resolved → TASK-007 (Sprint-002) | created: Sprint-001 — UsageTracker + per-session token budget were in-memory. Redis-backed via Upstash; cap holds cross-instance (verified w/ shared-FakeRedis test).
- **TD-007** severity: minor | status: resolved → TASK-005 (Sprint-002) | created: Sprint-001 — Gemini thinking-token overhead. Now config-controlled (`server.model.thinkingBudget`); disabled in demo — cost/turn −37%, quality green.

---

## Changelog (current sprint only)

> v0.1.0 (MVP) is already recorded in [`docs/CHANGELOG.md`](docs/CHANGELOG.md). No open sprint — nothing staged here.

---

## Quick Rules

```
- No owner-specific strings in packages/* — apps/config/content only (CI grep gate).
- core stays pure (zero I/O); all I/O in server; widget talks only to /api/chat.
- One LLM pass per turn; secrets env-only; every URL from config/evidence, never invented.
- Run `pnpm verify` before commit; keep the eval matrix green.
- Keep this file ≤ ~150 lines — prune at sprint promote.
```
