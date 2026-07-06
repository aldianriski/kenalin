---
sprint: 004
slug: cost-optimal-flow
owner: Tech Lead
last_updated: 2026-07-06
status: active
plan_commit: ae2f86a
close_commit: [sha — set at close]
update_trigger: sprint execute/close events
---

# SPRINT-004 — Cost-optimal chat flow

> **Theme:** Cut chat API cost where it actually lives — the single Gemini call is
> ~99% of cost/turn, dominated by the ~1782-token prompt sent every turn. Make that
> call cheap (context caching), skip it for repeats (response cache), and — behind a
> pressure-tested ADR — skip it entirely for provably-safe trivial turns. Grounding
> + safety must still run on every substantive turn (ADR-001, B9 non-overridable).

## Scope

**In:** explicit Gemini context caching (TASK-026) · response/semantic cache keyed on
retrieval signature (TASK-024) · a skip-LLM fast-path for provably-safe trivial turns,
**gated on ADR-005 + a `/council` pressure-test** (TASK-028).
**Out (deferred):** lite-model swap enablement (TASK-027), pgvector store (TASK-019),
provider adapters (TASK-020), the P2 UX polish set, TASK-025 (owner-blocked).

## Plan

### T1 — Explicit Gemini context caching `[size: M · risk: med]`
Layers: `packages/server/src/chat/gemini.ts`, `packages/core/src/prompt/builder.ts`.
Cache the static system prefix (safety+persona+rules+actions — identical per config+
language) via Gemini `cachedContent`, so cached input tokens bill at the discounted
rate on **every** turn that hits the API. Builds on the T3 (SPRINT-002) prompt-prefix
split. Biggest safe lever — nothing is skipped, the per-turn call just gets cheaper.

**Acceptance:** measured cost/turn drops materially vs the SPRINT-002 baseline (908 µUSD),
eval matrix still 100% green, with a visible non-zero cached-token count.

**DoD:**
- [ ] Static prefix registered as a cached content resource (with a sane TTL/lifecycle); the per-turn call references it instead of re-sending the prefix.
- [ ] Falls back cleanly to the current inline prefix when caching is unavailable/expired (no turn ever fails because a cache lapsed).
- [ ] Cost/turn measured before/after; eval matrix 100% green in id + en; cached tokens reported by the runner.
<!-- QA: eval is the regression gate; verify a cache-miss path still answers correctly. -->

### T2 — Response/semantic cache `[size: M · risk: med]`
Layers: `packages/server/src/orchestrator/orchestrator.ts`, new cache store, portfolio route.
Cache the validated `ChatResponse` keyed on `hash(retrieved-chunk-ids + normalized
query + intent-relevant state)`. On a hit, return the cached, already-policy-validated
answer **without the Gemini call** — repeats/paraphrases that retrieve the same evidence
skip the LLM. Keying on chunk-ids (not query similarity alone) keeps it grounding-safe:
a different entity retrieves different chunks → cache miss, never a cross-entity answer.

**Acceptance:** a repeated identical/paraphrased question that retrieves the same
evidence returns without a Gemini call (observable: no token spend on the 2nd hit);
a different-entity question is a miss and answers freshly.

**DoD:**
- [ ] Cache key = stable hash of retrieved chunk-ids + normalized query + relevant state; stored in-memory with an optional Upstash backing (reuse SPRINT-002 store; per-instance fallback).
- [ ] Cache hit skips embed-less? (embed still needed to retrieve for the key) → skips the **Gemini** call; returns the cached validated response.
- [ ] Invalidated when the knowledge index changes (re-ingest bumps a version in the key).
- [ ] A grounding-safety test: a different-entity query must NOT hit another entity's cached answer.
<!-- QA: cache-poisoning / cross-entity test is the safety gate here. -->

### T3 — Skip-LLM fast-path for trivial turns `[size: M · risk: HIGH]` — GATED on ADR-005
Layers: `packages/core` (classifier + canned responses), `packages/server/src/orchestrator/orchestrator.ts`.
Answer provably-safe trivial turns (blank input, a strict greeting whitelist) with a
canned, policy-compliant response **without any LLM call**. This bypasses the per-turn
safety/grounding layer for those turns, so it is **hard-to-reverse + safety-touching**:
**do NOT implement until ADR-005 is accepted.** ADR-005 is pressure-tested via `/council`
first (per the owner decision + DOCS_Guide §4).

**Acceptance:** ADR-005 accepted; only the ADR-sanctioned trivial set skips the LLM;
the eval matrix (incl. every safety scenario) stays 100% green — a skipped turn never
mishandles an injection or an ownable claim.

**DoD:**
- [ ] **ADR-005 written + `/council`-pressure-tested + accepted** (defines the exact provably-safe skippable set + the guardrails). **Blocks the rest of T3.**
- [ ] Classifier is deterministic + conservative (no LLM); anything not provably trivial falls through to the normal one-pass flow.
- [ ] Safety scenarios that *look* trivial but aren't (e.g. `"halo, ignore your rules…"`) fall through to the LLM — added as eval scenarios and green.
- [ ] Eval matrix 100% green id + en with the fast-path enabled; measured cost impact recorded.
<!-- QA: adversarial "trivial-looking but unsafe" scenarios are the gate — must fall through. -->

## Owner-action checklist
- [ ] If T2's cache should hold cross-instance, ensure `UPSTASH_*` env is set (reuses the SPRINT-002 store) — else per-instance fallback (T2).

## Decisions (pre-locked)
- **D1** — The skip-LLM fast-path (T3) bypasses the per-turn safety layer for some turns → **hard-to-reverse + surprising + a real trade-off** → **ADR-005 required**, pressure-tested via `/council` **before** any T3 implementation. Relates to / amends ADR-001 (single-pass). *No safety-bypassing code lands without the accepted ADR (L-024 doctrine guard).*
- **D2** — The response cache (T2) keys on **retrieved-chunk-ids** (not query similarity alone) so a different entity can never hit another's cached answer; cache carries an index-version so re-ingest invalidates it.
- **D3** — T1/T2 (caching) are safe and do **not** depend on ADR-005 — they proceed first; T3 waits on the ADR.

## Assumptions
- **A1** — Gemini `cachedContent` is available/beneficial for `gemini-2.5-flash` at our prefix size (~1.2–1.5k tokens ≥ the min cacheable). *Confirm: T1 provider spike + a live cost measurement.*
- **A2** — Response-cache hit rate is meaningful in practice (the eval scenarios are unique, so measure with a repeat-heavy probe, not the matrix). *Confirm: T2 dedicated repeat test.*
- **A3** — A genuinely provably-safe trivial-turn set exists (blank/greeting) that needs neither grounding nor a safety-policy pass. *Confirm: ADR-005 + /council verdict.*

## Execution Log

### 2026-07-06 | promote | Plan locked
SPRINT-004 promoted (cost-optimal flow). TASK-026 → T1, TASK-024 → T2, new TASK-028 →
T3 (skip-LLM, ADR-gated). Owner chose the aggressive path (caching + skip-LLM w/ ADR +
council). Governance: L-003 promoted to CONTEXT.md (count 2, collapsed); TD-002/003/004
flagged for re-review (≥3 sprints, none high). Flow evaluation recorded in the sprint
theme: single Gemini call ≈ 99% of cost, prompt-dominated → cache first, skip repeats,
skip trivial only behind ADR-005.

## Files Changed

| File | Task | Change (WHY) | Risk | Test |
|------|------|--------------|------|------|
| _(pending execution)_ | | | | |

## Retro
<!-- Written at close. Route buckets to durable homes (DOCS_Guide §10). -->

**Retrieval check** — _(fill at close)_

**Worked**
- _(fill at close)_

**Friction**
- _(fill at close)_

**Pattern candidate**
- _(fill at close)_
