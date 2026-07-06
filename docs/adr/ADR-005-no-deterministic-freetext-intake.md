# ADR-005 — Reject deterministic free-text intake; keep intake inside the single LLM pass

- **Status:** accepted (2026-07-06)
- **Deciders:** Tech Lead (council-reviewed: 5-advisor LLM Council + moderator pass)
- **Context driver:** cost reduction (cut LLM calls/turn) without weakening safety or grounding

## Context

Every visitor turn currently costs exactly one Gemini call (ADR-001 single-pass:
intent + answer + evidence + CTA + adaptive screening in one structured output; the
non-overridable safety policy (PRD B9) and grounding run inside it). A proposal (T3 /
TASK-028, SPRINT-004) aimed to cut cost by collecting the visitor's **name, intention,
and purpose** through deterministic **canned questions captured into state with no LLM
call**, then firing one consolidated call on the pool — with a non-LLM detector to catch
off-script / prompt-injection input mid-intake and fall through to the safety-checked pass.

The proposal was pressure-tested via `/council`. The verdict (medium-high confidence)
found the free-text version structurally unsound:

- **Off-script detection on free text without an LLM is not solvable** — it *is* the
  prompt-injection problem (information-theoretic, not effort-bound). A regex/keyword gate
  loses to rephrasing; a fixed adversarial-string ship-gate does not generalize.
- **`name` is irreducibly free text** — cannot be reduced to chips/enums, appears in every
  intake, and is the highest false-positive field for any heuristic (unicode, apostrophes,
  hyphenated/foreign names, a name resembling an instruction). High escalation-to-LLM rate
  erodes the only real upside (latency/completion).
- **`purpose` is inherently open-ended** — enumerating it needs an "Other: specify"
  free-text box that reopens the exact injection surface chips were meant to close.
- **i18n:** the product is Indonesian-first + English; English imperative-verb / `?`
  heuristics do not generalize — the "cheap detector" is quietly English-only.
- **The saving is negligible** — intake is 1–3 turns, and each current call delivers an
  adaptive, grounded screening question; the deterministic version trades that quality for
  ~1–2 saved calls per multi-turn intake. Blast radius of the real cost win is elsewhere:
  the ~1782-token prompt on **every** turn (addressed by context caching, SPRINT-004 T1).

## Decision

**Do not build a deterministic free-text intake with a non-LLM off-script detector.** Intake
(name/intention/purpose) stays **inside the existing single LLM pass** — the one per-turn
call already runs safety + grounding and already emits screening questions; it captures the
intake fields opportunistically as part of its structured output. Cost reduction is pursued
through **context caching (T1) + response caching (T2)** — safe levers that make the per-turn
call cheaper and skip exact/near repeats — not by bypassing or deferring the LLM.

This keeps ADR-001 intact (still one pass/turn) and B9 intact (safety runs on all
visitor-influenced content, every turn, with no pre-pass storage window).

## Consequences

**Positive:** No new prompt-injection surface, no English-only detector, no unvetted-content
window; the cost goal is met by caching (the lever that actually dominates cost); intake
quality stays adaptive and grounded.
**Negative (trade-offs accepted):** We forgo the small per-session call saving from a canned
intake, and the "deterministic FSM + escalation" pattern (a genuine reusable idea raised by
the council) is not explored now — deferred to a measured UX experiment if wanted.

## Alternatives considered

| Option | Why rejected |
|---|---|
| Free-text canned intake + non-LLM off-script detector (original T3) | Detector is an unwinnable, English-only arms race; `name`/`purpose` can't be closed-form; unvetted-content window; saving negligible |
| Closed-form **chips** for all intake fields | `name` and `purpose` are not enumerable; "Other: specify" reopens the free-text/injection surface |
| Chips for `intention` only, as a **latency/completion A/B** (name/purpose still LLM) | Legitimate but UX/latency-only (not a cost lever) and higher effort — re-filed to the backlog (TASK-029) for a later, measured experiment, not this sprint |
| Do nothing / rely only on caching | Chosen in effect — caching (T1/T2) captures the real cost win; intake stays in-pass |
