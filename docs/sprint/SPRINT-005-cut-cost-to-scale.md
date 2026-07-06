---
sprint: 005
slug: cut-cost-to-scale
owner: Tech Lead
last_updated: 2026-07-06
status: active
plan_commit: b060042
close_commit: [sha — set at close]
update_trigger: sprint execute/close events
---

# SPRINT-005 — Cut cost to scale (MVP-release blocker)

> **Theme:** The live portfolio runs a **stale vendored engine** with thinking ON and no
> response cache — none of SPRINT-002/004's cost work has reached production, so every
> real turn pays full price. Ship what's already built to the live site, then squeeze the
> per-turn prompt and validate the lighter model. Goal: production cost/turn from ~31 IDR
> → ~10 IDR, so the MVP can handle real conversation volume.

## Scope

**In:** re-vendor the current engine + thinking-off into the portfolio (TASK-030) · trim
per-turn context (TASK-031) · validate the lite-model swap (TASK-027).
**Out (deferred):** explicit context caching (TASK-026 — evaluated marginal), pgvector
(TASK-019), the P2 UX polish set. Portfolio **commit/deploy** stays an owner-action (TASK-025).

## Plan

### T1 — Ship cost optimizations to the live portfolio (re-vendor + thinking-off) `[size: M · risk: med]`
Layers: `D:/Project/portofolio/lib/kenalin/*` (vendored engine bundle), portfolio `kenalin.config.ts`.
The portfolio's `kenalin-engine.mjs` predates the thinking-disable + response cache
(0 matches for `thinkingConfig`/`responseCache`). Rebuild the current engine from this
repo, vendor it in, and set `server.model.thinkingBudget: 0` in the portfolio config. This
is the **single biggest cost win** — already-built code, just not shipped. Biggest-lever,
do first. **No new logic** — a deployment refresh.

**Acceptance:** a local smoke against the portfolio's engine shows thinking tokens = 0 and a
response-cache hit (0 tokens) on a repeated question; measured cost/turn drops vs the stale
bundle. (Portfolio git commit + deploy remain the owner's — TASK-025.)

**DoD:**
- [x] Current engine rebuilt + vendored into `portofolio/lib/kenalin/` (`kenalin-engine.mjs`+`.d.mts`) — confirmed `thinkingConfig`:1, response-cache:4. Also **wired the response cache into `embed.ts`** (it wasn't there — D4 was Hono-only), else the re-vendor wouldn't deliver caching.
- [x] Portfolio `kenalin.config.ts` sets `server.model.thinkingBudget: 0`.
- [x] Local smoke against the **vendored bundle**: turn 1 = 1537 tok, **thinking=0**; turn 2 (repeat) = **0 tok (cache hit)**. Cost/turn ~11 IDR (was ~31 with thinking on).
- [x] Owner-action noted (checklist): set `UPSTASH_*` + commit/deploy the portfolio (TASK-025). Portfolio files changed but **left uncommitted** for the owner (D1).
<!-- Verified end-to-end: config thinkingBudget → 0 thoughts; cache active in the embed engine. -->

### T2 — Trim per-turn context `[size: M · risk: med]` — ⚖️ EVALUATED → NOT VIABLE (reverted; see DoD + log)
Layers: `packages/core/src/policy/constants.ts`, `packages/core/src/prompt/builder.ts`, `evals/*`.
The ~1782-token prompt is re-sent every turn (99% of cost is this call). Reduce it:
`maxEvidenceInPrompt` 5→3, `evidenceSnippetChars` 220→150, `llmMessageWindow` 8→4,
`llmMessageCharCap` 1500→~800, and compress the most verbose rule text. Eval-gated — any
quality drop reverts the specific knob.

**Acceptance:** measured per-turn prompt tokens drop ~15–20% vs baseline; eval matrix 100%
green in id + en (no grounding/intent/safety/conversation regression).

**DoD:** ⚖️ EVALUATED → not viable (reverted). Tried evidence 5→3/4, snippet 220→150, window
8→4, cap 1500→900:
- Evidence 5→3 dropped grounding to **75%** (profile chunks rank 4th–5th → "got none"); 5→4 still regressed grounding-skills + intent.
- Snippet/window cuts (evidence kept at 5) destabilized **intent** (100% → 87%, *different* scenarios failing per run) for only ~5% prompt savings (1782→1691).
- **Reverted all** → eval back to 100% all groups. **Finding:** the per-turn cost is the static safety/grounding prefix (~1400 tok), which is load-bearing; context trimming is not a cost lever. Documented in `constants.ts` to prevent a re-attempt.
<!-- The real levers are T1 (shipped) + T3 (lite-model) + the response cache. -->

### T3 — Validate + enable the lite-model swap `[size: S · risk: med]` (TASK-027)
Layers: `content/demo/kenalin.config.ts`, `evals/*`.
Enable the whole-turn lite-model swap shipped (config-gated) in SPRINT-002: set
`server.model.lite: gemini-2.5-flash-lite` for the demo, re-run the eval, and keep only if
it holds. ~half price on trivial turns.

**Acceptance:** with `lite` set, the eval matrix stays 100% green (esp. safety 100%) in id +
en; measured cost delta on lite-routed turns recorded. If it regresses, leave `lite` unset.

**DoD:**
- [ ] `server.model.lite` set for the demo; eval matrix re-run 100% green at 12/15/12/10 id + en.
- [ ] Measured cost delta on lite-routed turns recorded; kept only if quality holds (else reverted + logged).
<!-- QA: safety must stay 100% — flash-lite on a safety turn is the risk. -->

## Owner-action checklist
- [ ] Set `UPSTASH_*` env in the portfolio (response cache + rate limiter cross-instance) (T1).
- [ ] Commit + deploy the portfolio after the re-vendor; live `/api/chat` smoke (TASK-025).

## Decisions (pre-locked)
- **D1** — T1 ships already-built code to production (no new logic) → biggest lever, do first. The portfolio git commit/deploy stays the owner's (TASK-025); the dev work is rebuild + vendor + config + local smoke.
- **D2** — T2/T3 are **eval-gated**: the matrix is the no-regression guard; any knob or the lite model that drops a group is reverted, not shipped.

## Assumptions
- **A1** — Trimming evidence + message window won't drop grounding/quality at our corpus size. *Confirm: eval matrix after T2.*
- **A2** — `gemini-2.5-flash-lite` holds safety 100% + intent on the demo. *Confirm: eval after T3 (this is SPRINT-002's open A3).*

## Execution Log

### 2026-07-06 | promote | Plan locked
SPRINT-005 promoted after a cost triage: the live portfolio runs a stale engine (thinking
ON, no cache) — the likely cause of the alarming test spend. TASK-030 (re-vendor+thinking-off)
→ T1 (biggest lever), TASK-031 (context trim) → T2, TASK-027 (lite-swap) → T3. Governance
clean; v0.2.0 cut still overdue (4 sprints under [Unreleased]).

### 2026-07-06 | T2 | Evaluated → not viable (reverted) — the prompt is irreducible
Trimmed evidence/snippet/window and eval-gated each: evidence 5→3 crashed grounding to 75%;
5→4 still regressed grounding+intent; snippet/window cuts (evidence 5) destabilized intent
(100%→87%, different scenarios each run) for ~5% prompt savings. Reverted all → 100% restored.
The per-turn cost is the **static safety/grounding prefix (~1400 tok), which is load-bearing**
— context trimming isn't a cost lever. Left a `constants.ts` comment so it isn't re-tried.
Net levers: T1 (shipped) + T3 (lite-model) + response cache.

### 2026-07-06 | T1 | Done — cost fixes shipped to the portfolio (re-vendor), smoke-verified
Recon caught that `embed.ts` (the engine the portfolio vendors) built the Orchestrator with
**no response cache** (D4 was Hono-only) — so re-vendoring alone wouldn't deliver caching.
Fixed: wired `MemoryResponseCache` into `createKenalinEngine`. Rebuilt `build:embed`, vendored
`kenalin-engine.mjs`+`.d.mts` into `portofolio/lib/kenalin/`, set `thinkingBudget:0` in the
portfolio config. **Smoke on the vendored bundle:** thinking=0, repeat=cache-hit(0 tok),
~11 IDR/turn (was ~31). Kenalin-repo change (`embed.ts`) committed; **portfolio files left
uncommitted for the owner** (D1 / TASK-025).

## Files Changed

| File | Task | Change (WHY) | Risk | Test |
|------|------|--------------|------|------|
| `packages/server/src/embed.ts` | T1 | Wire response cache into the embed engine (portfolio path) | Med | vendor smoke |
| `D:/Project/portofolio/lib/kenalin/kenalin-engine.mjs` (+.d.mts) | T1 | Re-vendor current engine (thinking + cache) — **owner commits** | Med | vendor smoke |
| `D:/Project/portofolio/lib/kenalin/kenalin.config.ts` | T1 | `thinkingBudget:0` — **owner commits** | Low | vendor smoke |

## Retro
<!-- Written at close. Route buckets to durable homes (DOCS_Guide §10). -->

**Retrieval check** — _(fill at close)_

**Worked**
- _(fill at close)_

**Friction**
- _(fill at close)_

**Pattern candidate**
- _(fill at close)_
