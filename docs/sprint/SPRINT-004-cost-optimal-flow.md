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

**In:** response/semantic cache keyed on retrieval signature (TASK-024).
**Evaluated → deferred:** ~~explicit Gemini context caching (TASK-026)~~ — spike showed ~3%
gross / net-marginal at current traffic (see Execution Log); revisit under load.
**Out (deferred):** ~~deterministic intake (TASK-028)~~ **CUT** — `/council` → **ADR-005**
rejected it (see Execution Log); lite-model swap (TASK-027), pgvector (TASK-019), provider
adapters (TASK-020), the P2 UX polish set, TASK-025 (owner-blocked).

## Plan

### T1 — Explicit Gemini context caching `[size: M · risk: med]` — ⚖️ EVALUATED → DEFERRED (spike; see scope-change log)
Layers: `packages/server/src/chat/gemini.ts`, `packages/core/src/prompt/builder.ts`.
Cache the static system prefix (safety+persona+rules+actions — identical per config+
language) via Gemini `cachedContent`, so cached input tokens bill at the discounted
rate on **every** turn that hits the API. Builds on the T3 (SPRINT-002) prompt-prefix
split. Biggest safe lever — nothing is skipped, the per-turn call just gets cheaper.

**Acceptance:** measured cost/turn drops materially vs the SPRINT-002 baseline (908 µUSD),
eval matrix still 100% green, with a visible non-zero cached-token count.

**DoD:** ✅ RESOLVED via spike — TASK-026 **evaluated → deferred** (not implemented). Finding:
explicit caching works (99% of prefix cached) but ~3% gross / net-marginal at current traffic;
revisit at >5 turns/hr. The evaluation *was* the deliverable; implementation deferred by owner.
<!-- Original implementation DoD moot — see Execution Log scope-change + the spike numbers. -->

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

### T3 — Deterministic context-pooling intake → single consolidated LLM call `[size: M · risk: HIGH]` — ❌ CUT (ADR-005 rejected; see scope-change log). Original plan kept below for the record.
Layers: `packages/core` (intake state machine + canned prompts), `packages/server/src/orchestrator/orchestrator.ts`.
Collect the intake (name, intention, purpose) with **deterministic canned questions**
captured into `ConversationState` — **no LLM call per intake turn** (asking a fixed
question and storing an answer needs no model). Once pooled, **one consolidated LLM
call** processes the whole context (intent + grounded answer + CTA). This compacts a
multi-turn intake (N LLM calls today) into deterministic collection + **1 call**.

This DEFERS (does not bypass) the safety/grounding pass — the pooled visitor content
still gets a full safety-checked one-pass. But it changes the conversation flow and the
*timing* of that pass, and needs an **off-script rule** (a visitor who asks a real
question mid-intake must fall through to the LLM immediately, not get filed as "purpose").
Hard-to-reverse → **do NOT implement until ADR-005 is accepted** (pressure-tested via
`/council` first, per the owner decision + DOCS_Guide §4).

**Acceptance:** ADR-005 accepted; canned intake questions fire with **no** LLM call;
an off-script/substantive message falls through to the LLM immediately (no missed
answer); one consolidated call on the pooled context yields the grounded response; the
eval matrix (incl. every safety scenario + injection-during-intake) stays 100% green.

**DoD:**
- [ ] **ADR-005 written + `/council`-pressure-tested + accepted** — defines the canned intake steps, the pooling model, the off-script fall-through rule, and the max canned steps before the LLM must run. **Blocks the rest of T3.**
- [ ] Deterministic intake: canned questions + capture into `ConversationState`; **zero** LLM calls to ask/store.
- [ ] Off-script detection (cheap, no LLM): a substantive question during intake falls through to the normal one-pass flow immediately.
- [ ] One consolidated LLM call on the pooled context produces intent + grounded answer + CTA (still one-pass; safety + grounding applied to everything pooled).
- [ ] Eval 100% green id + en incl. new "off-script during intake" + "injection during intake" scenarios; measured LLM-call-count / cost reduction over a multi-turn intake.
<!-- QA: adversarial off-script + injection-during-intake are the gate — must fall through to the safety-checked pass. -->

## Owner-action checklist
- [ ] If T2's cache should hold cross-instance, ensure `UPSTASH_*` env is set (reuses the SPRINT-002 store) — else per-instance fallback (T2).

## Decisions (pre-locked)
- **D1** — ✅ RESOLVED → **ADR-005 (accepted): reject the deterministic free-text intake.** The `/council` found it structurally unsound (non-LLM off-script detection unsolvable + English-only; `name`/`purpose` not closed-form; saving negligible). T3 CUT; intake stays inside the single LLM pass; cost win comes from T1/T2 caching. The doctrine guard (L-024) held — the flow-changing/safety-timing idea was pressure-tested and rejected, not shipped.
- **D2** — The response cache (T2) keys on **retrieved-chunk-ids** (not query similarity alone) so a different entity can never hit another's cached answer; cache carries an index-version so re-ingest invalidates it.
- **D3** — T1/T2 (caching) are safe and do **not** depend on ADR-005 — they proceed first; T3 waits on the ADR.

## Assumptions
- **A1** — Gemini `cachedContent` is available/beneficial for `gemini-2.5-flash` at our prefix size (~1.2–1.5k tokens ≥ the min cacheable). *Confirm: T1 provider spike + a live cost measurement.*
- **A2** — Response-cache hit rate is meaningful in practice (the eval scenarios are unique, so measure with a repeat-heavy probe, not the matrix). *Confirm: T2 dedicated repeat test.*
- **A3** — Intake (name/intention/purpose) can be collected via deterministic canned questions + capture with no LLM call, and an off-script/substantive message can be detected cheaply (no LLM) to fall through. *Confirm: ADR-005 + /council verdict.*

## Execution Log

### 2026-07-06 | promote | Plan locked
SPRINT-004 promoted (cost-optimal flow). TASK-026 → T1, TASK-024 → T2, new TASK-028 →
T3 (skip-LLM, ADR-gated). Owner chose the aggressive path (caching + skip-LLM w/ ADR +
council). Governance: L-003 promoted to CONTEXT.md (count 2, collapsed); TD-002/003/004
flagged for re-review (≥3 sprints, none high). Flow evaluation recorded in the sprint
theme: single Gemini call ≈ 99% of cost, prompt-dominated → cache first, skip repeats,
skip trivial only behind ADR-005.

### 2026-07-06 | scope-change | T1 deprioritized after spike — explicit caching marginal
Spike (direct Gemini REST, real ~1169-tok prefix): **implicit caching cached 0/3** identical
calls (unreliable — can't count on it); **explicit `cachedContent` caches 1159/1165 (99%)**
but min 1024 tokens, saves **~26 µUSD/turn (~3%)**, with a storage break-even of **~5 turns/hr**
→ net ~0/negative at a personal widget's sporadic traffic, plus lazy-create/TTL/Upstash-name/
invalidate lifecycle complexity in a stateless serverless path. **Decision (owner):** resolve
TASK-026 as **evaluated → deferred** (revisit at >5 turns/hr sustained); **T2 becomes the
sprint's deliverable** — the response cache skips *whole* calls on repeats, no storage cost,
simpler. My earlier "T1 is the biggest lever" claim was wrong; the measurement says T2 is.
**Impact:** scope narrows to T2. **G2 re-confirm:** T2 unchanged (D2/D3 hold).

### 2026-07-06 | scope-change | T3 CUT after /council → ADR-005
**What broke:** the `/council` (5 advisors + moderator) found the deterministic free-text
intake structurally unsound — non-LLM off-script detection is an unwinnable, English-only
arms race; `name`/`purpose` can't be closed-form; saving is negligible vs the prompt cost
caching addresses. **Impact:** T3/TASK-028 dropped from the sprint; scope narrows to T1+T2
(the safe cost wins). **G2 re-confirm:** T1/T2 unchanged and were never gated on the ADR
(D3). Decision recorded in **ADR-005** (accepted). Intake stays inside the single LLM pass
(ADR-001/B9 intact). Verdict: `verdict-context-pooling-intake.md` (scratchpad) — superseded
by ADR-005. A measured chips-`intention` UX experiment re-filed to the backlog (TASK-029).

### 2026-07-06 | T3 | Rescoped (pre-build) — context-pooling intake, not generic skip-LLM
Owner aligned the intent: T3 is **deterministic context-pooling intake → one consolidated
LLM call**, not "skip the LLM for trivial turns." Intake (name/intention/purpose) is
collected via canned questions + capture (no LLM per turn), then one call processes the
pool. It DEFERS rather than bypasses the safety pass, and adds an off-script fall-through
rule. Sharper question now goes to `/council` → ADR-005. (Scope clarification of T3's
framing, not a change to the sprint's deliverables.)

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
