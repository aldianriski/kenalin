---
sprint: 002
slug: harden-for-scale
owner: Tech Lead
last_updated: 2026-07-06
status: active
plan_commit: 3f34b1b
close_commit: [sha — set at close]
update_trigger: sprint execute/close events
---

# SPRINT-002 — Harden for scale

> **Theme:** Make the launched MVP hold up beyond a single serverless instance and
> guard the release bars automatically. Move the rate limiter + usage counters off
> in-memory state so caps actually hold, gate every PR on `pnpm verify`, then tune
> model cost/quality. Durable state + automated gates before the next round of UX
> polish (v0.2).

## Scope

**In:** distributed rate limiter + usage counters on Upstash (TASK-007) · CI gate
running `pnpm verify` on PRs (TASK-008) · model usage optimization + eval expansion
(TASK-005).
**Out (deferred):** custom branding (TASK-004) and accessibility (TASK-006) — the
user-facing polish track; all P2/P3; and TASK-025 (owner-blocked reference deploy).

## Plan

### T1 — Distributed rate limiter + usage counters (Upstash) `[size: M · risk: med]`
Layers: `packages/server/src/rate-limit.ts`, `packages/server/src/usage.ts`, portfolio route.
The rate limiter and the UsageTracker/token budget are in-memory, so both reset per
serverless instance and neither cap holds across instances. Back them with Upstash
Redis (the portfolio already depends on it); keep the in-memory path as a fallback
when Redis env is absent. Resolves **TD-005** + **TD-006**.

**Acceptance:** rate limit and per-session token budget hold across two cold
instances — a burst that trips the cap on one instance is still capped on another.

**DoD:**
- [x] Rate limiter reads/writes counts via Upstash; per-instance memory used only as fallback when Redis env is unset.
- [x] UsageTracker + per-session token budget persist to Upstash so counts survive an instance swap and the cap holds cross-instance.
- [x] Behavior verified across two simulated instances (shared Redis, separate memory); in-memory fallback still passes when Redis env is absent.
- [x] TD-005 + TD-006 marked `resolved → TASK-007` in TODO § Tech Debt.
<!-- QA: wants a test that drives two limiter instances against one Redis (mock or live); security-review the key/TTL handling. -->

### T2 — CI gate (GitHub Actions) `[size: S · risk: low]`
Layers: `.github/workflows/*`.
A PR workflow runs `pnpm verify` (owner-string grep gate + typecheck + build + tests)
so the release bars are guarded automatically. Eval runs on demand behind a key
secret (not on every PR — it costs tokens).

**Acceptance:** opening a PR triggers a workflow that runs `pnpm verify` and fails
the check when any gate fails; the eval job runs only when manually dispatched.

**DoD:**
- [ ] PR workflow installs pnpm + deps and runs `pnpm verify` on push/PR to main.
- [ ] Eval job is `workflow_dispatch` (manual) and reads the LLM key from a repo secret, never hardcoded.
- [ ] A red gate (e.g. an owner-string violation) actually fails the check — verified on a throwaway PR/branch.
<!-- QA: security-review the secret handling — no key echoed in logs. -->

### T3 — Model usage optimization + tuning `[size: M · risk: med]`
Layers: `packages/server/src/chat`, `packages/core/prompt`, `evals/*`.
Measure cost/turn (uses the TASK-003 usage tracker), then cut spend: limit/disable
thinking-token overhead where quality allows (TD-007), let cheap turns
(intent/routing) use a lighter model, and cache the static system-prompt prefix.
Expand the eval matrix toward the H2 minimums and keep it green in id + en.
Resolves **TD-007**; progresses **TD-001**.

**Acceptance:** measured cost/turn drops versus the pre-sprint baseline with no eval
regression; eval matrix is green in both id and en at the expanded counts.

**DoD:**
- [ ] Cost/turn baseline captured, then a measured reduction after tuning (thinking budget + lighter model on cheap turns + prompt-prefix cache).
- [ ] Thinking-token overhead limited/disabled on turns where quality is unaffected (TD-007).
- [ ] Eval scenarios expanded toward H2 minimums (12/15/12/10) and green in id + en.
- [ ] TD-007 marked `resolved → TASK-005`; TD-001 note updated with progress.
<!-- QA: eval matrix IS the regression gate here — must stay green at the higher counts. -->

## Owner-action checklist
<!-- Non-dev actions a human must do (secrets, env, external dashboards). -->
- [ ] Provide Upstash Redis REST URL + token as env (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) in the Kenalin + portfolio environments (T1).
- [ ] Add the Gemini/LLM key as a GitHub Actions repo secret for the on-demand eval job (T2).

## Decisions (pre-locked)
- **D1** — Reuse Upstash (already a portfolio dependency) for both rate-limit and usage state rather than adding a new store; keep in-memory as a graceful fallback. Interface-only change behind existing modules — not ADR-worthy (easy to reverse, no lock-in surprise).
- **D2** — Eval does **not** run on every PR (token cost); it is manual `workflow_dispatch`. `pnpm verify` is the always-on gate.

## Assumptions
- **A1** — The portfolio's existing Upstash instance is reachable from the Kenalin server package with the same REST credentials. *Confirm: owner-action checklist + a live SET/GET smoke.*
- **A2** — Gemini exposes a thinking-budget/disable control usable per-call. *Confirm: provider adapter in `packages/server/src/chat`.*
- **A3** — Lighter model on intent/routing turns holds eval quality. *Confirm: eval matrix green after T3.*

## Execution Log
<!-- Append-only, dated. Log here rather than editing § Plan — the plan is frozen at promote. -->

### 2026-07-06 | promote | Plan locked
SPRINT-002 promoted from Backlog P1 (Harden-for-scale track). Pulled TASK-007 → T1,
TASK-008 → T2, TASK-005 → T3 in dependency order. No file overlap between tasks.
Governance review clean (L-001/L-002 count 1, no TD escalation, no doc-aging due).

### 2026-07-06 | G2 sign-off | Batch design gate approved (2 decisions)
Recon (2× Explore) surfaced two forks; owner decided both:
- **D3 (T3 doctrine tension)** — "lighter model on cheap turns" as written reads as a
  per-concern intent/answer split, which **ADR-001 / CLAUDE.md one-pass rule forbids**.
  Decision: **whole-turn model swap only** — a non-LLM heuristic classifies the entire
  turn as trivial and routes the single structured pass to a lighter model
  (`gemini-2.5-flash-lite`). One LLM call per turn preserved; no ADR needed. (Guarded
  per orchestrator red-flag: doctrine not flipped under autonomy — surfaced for decision.)
- **D4 (T1 async scope)** — Redis makes usage/limiter async; `embed.ts` KenalinEngine
  exposes **sync** `overBudget`/`usage` (portfolio vendors it). Decision: **Hono path
  only** — Redis-back the server/app path; `embed.ts` stays in-memory/sync. No public
  interface break; vendored embed engine remains per-instance (acceptable).
- **Impl note** — Upstash accessed via its **REST API over `fetch`** (no `@upstash/redis`
  dependency; avoids the network install + keeps the swap thin). In-memory classes stay
  sync; call sites `await` (works on both sync + Promise returns). A `FakeRedis` shared
  between two store instances proves cross-instance (A1's live smoke stays an owner-action).
- Assumptions resolved: **A2** confirmed (Gemini `thinkingConfig.thinkingBudget` must be
  added — not present today). **A3** to be confirmed by the eval matrix after T3.

### 2026-07-06 | T1 | Started — distributed rate limiter + usage counters

### 2026-07-06 | T1 | Done — Upstash-backed limiter + usage (all DoD [x])
New `redis.ts` (thin Upstash REST client over `fetch`, no SDK dep) + `RedisRateLimiter`
and `RedisUsageTracker`; `factory.selectStateStores` picks Redis when `UPSTASH_*` env
is set, else in-memory (D1 fallback). App call sites now `await` limiter/usage; `onUsage`
record is fire-and-forget with error log. `embed.ts` KenalinEngine untouched (D4). 5 new
cross-instance tests via a shared `FakeRedis`; in-memory `usage.test.ts` still green.
`pnpm verify` green (75 tests). **Semantic note:** Redis limiter is a fixed-window counter
(INCR + PEXPIRE NX), not the in-memory token bucket — atomic per request, standard for an
abuse guard. **Owner-action still open:** live two-instance smoke against real Upstash
(A1) + confirm `PEXPIRE ... NX` is honored by the account's Redis version.

## Files Changed
<!-- Filled during execution; feeds CHANGELOG at close. -->

| File | Task | Change (WHY) | Risk | Test |
|------|------|--------------|------|------|
| `packages/server/src/redis.ts` | T1 | New: thin Upstash REST client (`fetch`, no SDK dep) + hash helper | Low | via store tests |
| `packages/server/src/rate-limit.ts` | T1 | `RateLimiterLike` + `RedisRateLimiter` (fixed-window, cross-instance) | Med | `redis-store.test.ts` |
| `packages/server/src/usage.ts` | T1 | `UsageStore` + `RedisUsageTracker` (cap holds cross-instance) | Med | `redis-store.test.ts` + `usage.test.ts` |
| `packages/server/src/env.ts` | T1 | `resolveRedisConfig` (Upstash creds, env-only) | Low | typecheck |
| `packages/server/src/factory.ts` | T1 | `selectStateStores` — Redis when env set, else in-memory (D1) | Low | build |
| `packages/server/src/app.ts` | T1 | `await` limiter/usage; async `/api/usage`; inject `limiter` | Med | `app.test.ts` |
| `packages/server/src/redis-store.test.ts` | T1 | New: cross-instance tests via shared `FakeRedis` | — | 5 tests |

## Retro
<!-- Written at close. Route buckets to durable homes (DOCS_Guide §10). -->

**Retrieval check** — _(fill at close)_

**Worked**
- _(fill at close)_

**Friction**
- _(fill at close)_

**Pattern candidate**
- _(fill at close)_
