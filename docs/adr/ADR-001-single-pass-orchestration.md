# ADR-001 — Single-pass orchestration with structured output

- **Status:** accepted (2026-07-06)
- **Deciders:** Tech Lead
- **Context driver:** Free-tier LLM budget + latency + keeping the engine small enough to reason about.

## Context

Each turn must produce several things: an inferred intent, a grounded answer,
evidence, suggested CTAs, and (for business intent) a broad category + complexity.
The obvious "enterprise" shape is a pipeline of specialized LLM calls — an intent
classifier, an answerer, a CTA selector, a complexity scorer — possibly a
multi-agent graph. That multiplies token cost and latency per turn, adds failure
surface between calls, and pushes the project toward being a chatbot *framework*
rather than a small embeddable widget. The target market runs on a Gemini free
tier at ~zero cost; per-turn call fan-out directly threatens that.

## Decision

Intent, answer, evidence, CTAs, and complexity are produced by **one** LLM call
per turn, using provider-enforced **structured output** validated against the
`ChatResponse` schema (PRD Part E). Modular behavior comes from composing the
system prompt (core policy + enabled-module fragments + persona + retrieved
evidence + config actions), not from separate calls. Splitting a concern into its
own call is allowed only as a recorded, eval-justified exception — never a default.

## Consequences

**Positive:** One call = predictable cost/latency, one schema for widget + headless
+ evals to parse, and a smaller system to audit for safety. Malformed output is
repaired once or degraded to a safe fallback — a single, well-defined failure path.

**Negative (trade-offs accepted):** One prompt carries a lot of responsibility, so
it is long and sensitive to edits; a weaker model may do some sub-tasks less well
than a dedicated call would. We accept this and lean on the eval matrix (PRD Part H)
to catch regressions rather than decomposing prematurely.

## Alternatives considered

| Option | Why rejected |
|---|---|
| Per-concern LLM pipeline (classify → answer → select CTA → score) | N× cost/latency, more inter-step failure modes, breaks the free-tier economics. |
| Multi-agent orchestration | Explicitly out of scope (PRD G3); massive complexity for a portfolio-scale widget. |
| Rules/classifier for intent + one LLM for answer | A separate classifier call still adds latency; the model already emits intent + confidence reliably in the single pass. |
