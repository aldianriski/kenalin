---
sprint: 001
slug: launch-readiness
owner: Tech Lead
last_updated: 2026-07-06
status: closed
plan_commit: de3a898
close_commit: 00ea4e6
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
- [x] `GeminiChatProvider` surfaces `usageMetadata` (prompt/candidates/total) on the final event. *(live-confirmed: total includes thinking tokens.)*
- [x] Embedding tokens accounted for — the embed API returns no counts, so estimated (chars/4) in the orchestrator.
- [x] `UsageTracker` (`usage.ts`) aggregates per-session + global counters; unit-tested (5 tests).
- [x] Orchestrator records per-turn usage via `onUsage`; `GET /api/usage` exposes totals — app test asserts no message content leaks.
- [x] Per-session token budget (`LIMITS.maxSessionTokens`) → `usage_limit` 429 in app + engine `overBudget`.

### T2 — Graceful, typed error UX `[size: M · risk: med]`
Layers: `server/src/app.ts`, `widget/src/api.ts`, `widget/src/app.tsx`, `widget/src/i18n.ts`.
A visitor must never see a raw error or a dead widget. Map each failure class to a
distinct, localized, actionable message with the right recovery (retry vs wait).

**Acceptance:** rate-limit, payload-too-large, quota/usage-limit, upstream/5xx, and offline each render a distinct friendly id/en message with an appropriate action; no raw error string appears.

**DoD:**
- [x] Server returns stable error codes (`rate_limited`, `payload_too_large`, `usage_limit`, `upstream_error`) with correct status; in-stream errors emit a code, never a raw message.
- [x] `KenalinClient` surfaces `{code, status}` to `onError` (parses the JSON error body; distinguishes offline).
- [x] Widget maps codes → localized id/en messages; retryable codes show Retry, informational ones don't; offline detected.
- [x] Widget tests cover the error-mapping paths (in-stream code, non-2xx code+status, offline).
- [x] Bonus: Gemini provider retries transient failures (429/5xx/timeout, 3 attempts, backoff) so a hiccup doesn't degrade to fallback — stabilized the eval (3/3).

### T3 — Finalize + commit reference deployment `[size: S · risk: low]`
Layers: `D:/Project/portofolio/lib/kenalin/*`, portfolio git. Depends on T1+T2 landing in the vendored bundle.
Ship the reference: real channels, prod origins, re-vendored engine+widget, and a
live smoke test, then commit the portfolio repo.

**Acceptance:** a real end-to-end conversation on `next dev` works (grounded answer + handoff); portfolio changes committed.

**DoD:**
- [x] Re-vendor engine + widget after T1/T2.
- [~] Live smoke: `/api/config/public` works in the real Next app (proves the vendored bundle loads + route wiring). `/api/chat` blocked — the portfolio `.env` has no Gemini key (owner-action below).
- [ ] Owner-actions below completed (add key + real channels + prod origins). **Blocked on owner.**
- [ ] Portfolio repo committed. **Deferred — owner asked to leave uncommitted for review; not ready until owner-actions done.**

## Owner-action checklist
- [ ] **Add the Gemini key to the portfolio `.env`** — `API_KEY_GEMINI=…` (or `KENALIN_LLM_API_KEY=…`). **Currently missing** — the portfolio `.env` has Supabase/Resend/Upstash but no Gemini key; the chat route returns `server_misconfigured` without it.
- [ ] Set real `handoff.whatsapp.number` + `handoff.calendar.url` (and uncomment their actions) in `lib/kenalin/kenalin.config.ts`.
- [ ] Set `server.allowedOrigins` to the production domain(s).

## Decisions (pre-locked)
- **D1** — Token usage is read from Gemini `usageMetadata` (authoritative), never estimated client-side.
- **D2** — Errors use a small fixed code taxonomy mapped to friendly localized copy in the widget; the server never leaks raw messages to visitors.

## Assumptions
- **A1** — `generateContent` returns `usageMetadata` on success. *Confirm: inspect a live response in T1.*
- **A2** — Billing removes the free-tier 429 for normal traffic. *Confirmed by owner.*

## Execution Log

### 2026-07-06 | promote | Sprint planned + locked
Pulled TASK-003/002/001 from Backlog. Governance review clean (no LEARNINGS, no aged TD, TODO under cap).

### 2026-07-06 | T1 done | Token usage tracker
Captured Gemini `usageMetadata` (live-confirmed; `total` includes thinking tokens — flags a cost lever for TASK-005). UsageTracker + `/api/usage` + per-session budget. 41 server tests green.

### 2026-07-06 | T2 done | Graceful typed error UX
Stable error-code taxonomy end-to-end (server → client → localized copy); retryable vs informational; offline detection. Added Gemini transient-retry (surfaced by eval flakiness: mass-fallback runs were transient upstream failures, not intent bugs) → eval now 3/3 stable. Fixed a parallel-ingest manifest race (co-located manifest in the index dir).

### 2026-07-06 | T3 blocked | Deployment — owner-actions outstanding
Re-vendored engine+widget. Live smoke on `next dev` (port 3007): `/api/config/public` returns the RIZVA persona — proves the vendored bundle + Next route wiring work in the real app. `/api/chat` returns `server_misconfigured`: **the portfolio `.env` has no Gemini key** (only Supabase/Resend/Upstash). T3 can't complete until the owner adds the key + real channels + prod origins; portfolio commit stays deferred per the owner's earlier "leave uncommitted" call. Sprint stays **active**. (Aside: portfolio has Upstash `KV_REST_API_*` — ready-made for TASK-007.)

## Files Changed

| File | Task | Change (WHY) | Risk | Test |
|------|------|--------------|------|------|
| `core/interfaces/providers.ts` | T1 | `TokenUsage` type + usage on final event | Low | typecheck |
| `core/policy/constants.ts` | T1 | `LIMITS.maxSessionTokens` budget | Low | — |
| `server/src/usage.ts` | T1 | UsageTracker (per-session+global, budget) | Low | usage.test (5) |
| `server/src/chat/gemini.ts` | T1 | parse `usageMetadata` | Low | live check |
| `server/src/orchestrator/orchestrator.ts` | T1 | accumulate + emit per-turn usage | Low | — |
| `server/src/app.ts` | T1/T2 | `/api/usage` + budget check; in-stream error → code | Low | app.test |
| `server/src/embed.ts` | T1 | expose usage + `overBudget` to hosts | Low | typecheck |
| `widget/src/api.ts` | T2 | typed `{code,status}` errors; offline detect | Low | api.test (4) |
| `widget/src/i18n.ts` | T2 | localized error copy + retryable map | Low | — |
| `widget/src/app.tsx` | T2 | render mapped error + conditional retry | Low | in-browser |
| `server/src/chat/gemini.ts` | T2 | retry transient upstream failures | Med | eval 3/3 |
| `server/src/ingest/pipeline.ts` | T2 | co-locate manifest (fix test race) | Low | pipeline.test |

## Retro

**Retrieval check** — no prior `L-NNN`/ADR was contradicted (first sprint; no LEARNINGS existed yet).

**Outcome** — T1 + T2 shipped and green (68 tests, eval 3/3). T3 descoped: re-vendor done + config route validated live, but blocked on owner-actions (portfolio `.env` has no Gemini key; real channels; prod origins). T3's remainder routed to Backlog **TASK-025**.

**Worked**
- Reading authoritative usage from Gemini `usageMetadata` (incl. thinking tokens) beat estimating.
- A live smoke test caught the real blocker (missing host key) that unit tests + eval never could.

**Friction**
- Eval flakiness *looked* like an intent-logic bug but was transient upstream failures degrading to fallback — cost a debugging detour until the provider gained a retry.

**Pattern candidate** (→ `docs/LEARNINGS.md`)
- L-001: add provider retry so transient upstream failures don't read as logic/quality failures.
- L-002: verify host secrets/env before a deploy smoke — don't assume the target repo inherited them.
