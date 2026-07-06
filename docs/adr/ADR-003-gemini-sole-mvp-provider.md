# ADR-003 — Gemini as the sole shipped provider for the MVP

- **Status:** accepted (2026-07-06)
- **Context driver:** Adoption friction + cost for the target market (Indonesian freelancers/creators self-hosting at ~zero cost).

## Context

The engine needs both a chat model and an embedding model. Chat quality often
peaks with one vendor (e.g. Anthropic) while cheap/strong embeddings come from
another — which is why the provider interfaces are kept separate. But shipping
three half-working adapters spreads effort thin and, more importantly, raises the
bar to adopt: every extra key or paid tier is friction for a solo owner. A single
key that covers chat **and** embeddings **and** strong id/en multilingual support,
on a usable free tier, is the lowest-friction path for the primary market.

## Decision

Ship **one** complete provider for the MVP: **Google Gemini** — `gemini-2.5-flash`
for chat and `text-embedding-004` for embeddings, behind the `ChatProvider` /
`EmbeddingProvider` interfaces in `core`. Anthropic and OpenAI chat adapters are
explicitly P1, added behind the same interfaces only when there is a reason to.

## Consequences

**Positive:** One free-tier key gets an owner fully running. Strong multilingual
embeddings serve the id/en requirement directly. Least possible adoption friction.

**Negative (trade-offs accepted):** Single-vendor dependency and exposure to
Gemini free-tier rate limits on busy sites; chat quality is tied to one model
family for now. Mitigated by per-IP rate limiting and by the interface seam, which
makes swapping in a paid or alternative provider a small, localized change.

## Alternatives considered

| Option | Why rejected |
|---|---|
| Anthropic Claude for chat quality | Best chat, but a second key/vendor for embeddings raises adoption friction; kept as a P1 adapter. |
| OpenAI for both | Viable, but weaker free-tier story for the target market; kept as a P1 adapter. |
| Ship all three adapters at launch | Three half-working integrations instead of one solid one; spreads MVP effort and testing thin. |
