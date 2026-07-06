---
sprint: 001
slug: launch-readiness
owner: Tech Lead
last_updated: 2026-07-06
status: active
plan_commit: de3a898
close_commit: pending
update_trigger: sprint execute/close events
---

# SPRINT-001 — Launch readiness

> **Theme:** Make the MVP safe to run in front of real visitors on a billed key:
> know what it costs (usage visibility), never show a raw failure (resilient UX),
> then finalize and commit the reference deployment. Visibility + resilience before
> the polish features in v0.2.

## Scope

**In:** token usage tracking (TASK-003) · graceful typed error UX (TASK-002) ·
finalize + commit the portfolio deployment (TASK-001).
**Out (deferred):** custom branding (TASK-004), model tuning (TASK-005), a11y
(TASK-006), distributed rate limiter (TASK-007), CI (TASK-008), and all P2/P3 —
these build on this sprint but are not in it.

## Plan

### T1 — Token usage tracker `[size: M · risk: low]`
Layers: `server/src/chat/gemini.ts`, `server/src/embeddings/gemini.ts`, new `server/src/usage.ts`, `server/src/orchestrator/orchestrator.ts`, `server/src/app.ts`, `server/src/embed.ts`.
Cost visibility is the prerequisite for tuning and for a token-budget cap. Capture
the authoritative counts Gemini already returns (`usageMetadata`) rather than
estimating, aggregate per-session + global, and expose them.

**Acceptance:** every chat turn records prompt/candidates/total tokens (+ embedding tokens); cumulative usage is retrievable; an optional per-session token cap returns a friendly limit response instead of spending unboundedly.

**DoD:**
- [ ] `GeminiChatProvider` surfaces `usageMetadata` (prompt/candidates/total) on the final event.
- [ ] `GeminiEmbeddingProvider` reports embedding token counts where available.
- [ ] `UsageTracker` (`usage.ts`) aggregates per-session + global counters; unit-tested.
- [ ] Orchestrator records per-turn usage via the `log` hook; `GET /api/usage` (or structured log) exposes totals — no PII, no message bodies.
- [ ] Optional per-session/day token budget → friendly `usage_limit` response (ties into T2 error mapping).

### T2 — Graceful, typed error UX `[size: M · risk: med]`
Layers: `server/src/app.ts`, `widget/src/api.ts`, `widget/src/app.tsx`, `widget/src/i18n.ts`.
A visitor must never see a raw error or a dead widget. Map each failure class to a
distinct, localized, actionable message with the right recovery (retry vs wait).

**Acceptance:** rate-limit, payload-too-large, quota/usage-limit, upstream/5xx, and offline each render a distinct friendly id/en message with an appropriate action; no raw error string appears.

**DoD:**
- [ ] Server returns stable error codes (`rate_limited`, `payload_too_large`, `usage_limit`, `upstream_error`) with correct HTTP status.
- [ ] `KenalinClient` surfaces the status/code (not just a generic string) to `onError`.
- [ ] Widget maps codes → localized messages + retry/wait affordance; offline detected.
- [ ] Widget test covers the error-mapping paths.

### T3 — Finalize + commit reference deployment `[size: S · risk: low]`
Layers: `D:/Project/portofolio/lib/kenalin/*`, portfolio git. Depends on T1+T2 landing in the vendored bundle.
Ship the reference: real channels, prod origins, re-vendored engine+widget, and a
live smoke test, then commit the portfolio repo.

**Acceptance:** a real end-to-end conversation on `next dev` works (grounded answer + handoff); portfolio changes committed.

**DoD:**
- [ ] Re-vendor engine + widget after T1/T2.
- [ ] Owner-actions below completed (real channels + prod origins).
- [ ] Live smoke test: grounded answer, screening chips, WhatsApp handoff all work.
- [ ] Portfolio repo committed.

## Owner-action checklist
- [ ] Set real `handoff.whatsapp.number` + `handoff.calendar.url` (and uncomment their actions) in `lib/kenalin/kenalin.config.ts`.
- [ ] Set `server.allowedOrigins` to the production domain(s).
- [ ] Confirm `API_KEY_GEMINI` (billed) is present in the portfolio `.env`.

## Decisions (pre-locked)
- **D1** — Token usage is read from Gemini `usageMetadata` (authoritative), never estimated client-side.
- **D2** — Errors use a small fixed code taxonomy mapped to friendly localized copy in the widget; the server never leaks raw messages to visitors.

## Assumptions
- **A1** — `generateContent` returns `usageMetadata` on success. *Confirm: inspect a live response in T1.*
- **A2** — Billing removes the free-tier 429 for normal traffic. *Confirmed by owner.*

## Execution Log

### 2026-07-06 | promote | Sprint planned + locked
Pulled TASK-003/002/001 from Backlog. Governance review clean (no LEARNINGS, no aged TD, TODO under cap).

## Files Changed

| File | Task | Change (WHY) | Risk | Test |
|------|------|--------------|------|------|
| _(none yet)_ | — | — | — | — |

## Retro
_(written at close)_
