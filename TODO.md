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

> **SPRINT-005 — Cut cost to scale** → [`docs/sprint/SPRINT-005-cut-cost-to-scale.md`](docs/sprint/SPRINT-005-cut-cost-to-scale.md)
> T1 TASK-030 re-vendor+thinking-off (portfolio) · T2 TASK-031 trim per-turn context · T3 TASK-027 lite-model swap. Focus: cut production cost/turn (~31→~10 IDR).

Status: `pnpm verify` green (101 tests) · eval matrix **12/15/12/10 = 49, 100% id+en**. **Cost finding:** live portfolio runs a stale engine (thinking ON, no cache) → SPRINT-005 ships the fix. Detail → [`docs/CHANGELOG.md`](docs/CHANGELOG.md).

---

## Backlog

### P0 — Critical / Blocking

- [ ] **TASK-025 — Finalize + commit reference deployment** [size: S] · src: you · state: blocked (owner)
      done-when: `API_KEY_GEMINI` added to the portfolio `.env`; real `handoff.whatsapp`/`calendar` + prod `allowedOrigins` set; live `/api/chat` smoke passes; portfolio committed.
      touches: `D:/Project/portofolio/lib/kenalin/*` + `.env`, portfolio git.
      note: engine+widget already re-vendored; `/api/config/public` validated live. Was SPRINT-001 T3 (descoped — owner-blocked).

### P1 — Next Phase (v0.2 — launch polish)

- [ ] **TASK-026 — Explicit Gemini context caching** [size: M] · src: claude · state: deferred — evaluated in SPRINT-004 (spike: works, ~3%/turn, net-marginal at low traffic). done-when: revisited at sustained >5 turns/hr where the storage economics flip positive.
- [~] **TASK-027 — Enable + eval-validate the lite-model swap** — promoted → SPRINT-005 (T3)
- [~] **TASK-030 — Ship cost optimizations to the live portfolio (re-vendor + thinking-off)** — created + promoted → SPRINT-005 (T1). done-when: current engine re-vendored into `portofolio/lib/kenalin` + `thinkingBudget:0` in portfolio config + local smoke shows thinking=0 + cache hit + cost drop. The 8000-IDR fix. Portfolio commit/deploy = owner (TASK-025).
- [~] **TASK-031 — Trim per-turn context (prompt/evidence/message-window)** — created + promoted → SPRINT-005 (T2). done-when: ~15–20% fewer prompt tokens/turn (evidence 5→3, snippet 220→150, msg window 8→4, cap 1500→~800, tighter rules); eval matrix 100% green id+en.

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
- [ ] **TASK-029 — Chips-based `intention` capture (UX/latency A/B)** [size: M] · src: you — closed-form tappable `intention` chips (name/purpose stay LLM-handled), measured as a latency/completion experiment, NOT a cost lever. The only safe residue of the cut TASK-028 (per ADR-005). Needs the widget behavior harness (TD-009) to test.

### P3 — Long-term (v0.4 — scale & extensibility)

- [ ] **TASK-019 — pgvector/Postgres KnowledgeStore** [size: L] · src: claude — for corpora beyond ~10³ chunks (ADR-002 P1).
- [ ] **TASK-020 — Anthropic + OpenAI provider adapters** [size: M] · src: claude — behind existing interfaces (ADR-003 P1).
- [ ] **TASK-021 — Admin / config UI** [size: L] · src: claude — no-code editing of persona/modules/actions/theme (completes TASK-004 end-to-end).
- [ ] **TASK-022 — `create-kenalin` + publish `@kenalin/*` to npm** [size: M] · src: claude — clean consumption instead of vendoring. Resolves TD-004.
- [ ] **TASK-023 — Ingestion improvements** [size: M] · src: claude — map MDX frontmatter → type/projectId/url; incremental/scheduled re-index; PII redaction on briefs.

---

## Tech Debt

- **TD-001** severity: medium | status: resolved → TASK-005 (Sprint-002) | created: Sprint-000 — Eval counts were 5/5/8/3. Expanded to 12/15/12/10 (49), 100% green id+en.
- **TD-002** severity: medium | status: open | created: Sprint-000 — Widget test coverage thin (only the SSE parser). done-when: component tests for app/message/evidence/chips render + click.
- **TD-003** severity: minor | status: open | created: Sprint-000 — Answer is pseudo-streamed word-by-word, not real token streaming. done-when: TASK-014.
- **TD-004** severity: minor | status: open | created: Sprint-000 — Portfolio consumes a vendored bundle; must re-vendor on each release. done-when: TASK-022.
- **TD-005** severity: medium | status: resolved → TASK-007 (Sprint-002) | created: Sprint-000 — Rate limiter is in-memory (per serverless instance). Redis-backed via Upstash; in-memory kept as fallback.
- **TD-006** severity: medium | status: resolved → TASK-007 (Sprint-002) | created: Sprint-001 — UsageTracker + per-session token budget were in-memory. Redis-backed via Upstash; cap holds cross-instance (verified w/ shared-FakeRedis test).
- **TD-007** severity: minor | status: resolved → TASK-005 (Sprint-002) | created: Sprint-001 — Gemini thinking-token overhead. Now config-controlled (`server.model.thinkingBudget`); disabled in demo — cost/turn −37%, quality green.
- **TD-008** severity: minor | status: open | created: Sprint-002 — The embedded `KenalinEngine` (`embed.ts`, vendored by the portfolio) stays in-memory/sync for limiter+usage — only the Hono `/api` path is Redis-backed (D4), so the vendored engine's counters remain per-instance. Also the Redis limiter is fixed-window (not the in-memory token bucket). done-when: move the embed engine to the shared Redis store (needs an async `KenalinEngine` API rev) if per-instance counting there becomes a problem.
- **TD-009** severity: minor | status: open | created: Sprint-003 — Widget has no render/behavior test harness (`environment: node`, no jsdom) — a11y behavior (focus trap, Escape, live region) can't be unit-tested, only browser-verified (L-004). done-when: add jsdom/happy-dom (or preact-render-to-string for static render) so widget behavior gets regression coverage; also covers TD-002.

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
