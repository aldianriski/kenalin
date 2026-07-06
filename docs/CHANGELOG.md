---
owner: Tech Lead
last_updated: 2026-07-06
update_trigger: A sprint/phase is closed
status: current
---

# Changelog

All notable changes to Kenalin. Format loosely follows Keep a Changelog.

## [Unreleased]

### Added — SPRINT-001 (launch readiness, 2026-07-06)
- **Token usage tracker**: capture Gemini `usageMetadata` per turn (prompt/candidates/total,
  incl. thinking tokens) + estimated embedding tokens; `UsageTracker` (per-session + global);
  `GET /api/usage` (counts only, no PII); per-session token budget → `usage_limit`.
- **Graceful typed error UX**: stable server error-code taxonomy; widget surfaces `{code,status}`
  and renders localized id/en messages with retryable-vs-informational recovery; offline detection.
- **Resilience**: Gemini chat provider retries transient failures (429/5xx/timeout, backoff) so a
  hiccup doesn't degrade a visitor to the fallback.
- **Fix**: parallel-ingest manifest race (manifest co-located in the index dir).

_(Deferred from this sprint: reference deployment finalization — owner-blocked, → TASK-025.)_

## [0.1.0] — unreleased

First working end-to-end MVP, built phase-by-phase against `docs/PRD.md` Part G.

### Added
- **Foundation** (`@kenalin/core`): Zod data contracts (PRD Part E), config
  loader + validation, provider/store interfaces, module registry, non-overridable
  safety constants. Pure, zero I/O.
- **Knowledge**: heading-aware chunker, retrieval scoring (cosine + metadata
  boosts + threshold), ingest pipeline (markdown/json/url/sitemap/pdf sources),
  deterministic idempotent local index + curation manifest, `kenalin ingest` CLI,
  Gemini + offline hash embedders.
- **AI Core** (`@kenalin/server`): Gemini chat provider (structured output),
  stateless single-pass orchestrator, prompt builder, non-overridable policy
  validators (currency block, impersonation strip, URL allowlist, id-only
  references), conversation brief, handoff resolver, repair + fallback, Hono API
  (`/api/chat` SSE, `/api/config/public`, `/healthz`), CORS allowlist, per-IP
  rate limiter.
- **Widget** (`@kenalin/widget`): `<kenalin-ai>` Preact Web Component, Shadow-DOM
  isolated, CSS-custom-property theming, SSE streaming, evidence cards,
  suggested/quick actions, page context, id/en i18n, responsive. Single-file
  script embed, **10.3 KB gzip** (budget 60 KB).
- **Modules**: registry-driven routing, adaptive qualification + server-enforced
  caps, contact handoff (WhatsApp/email/calendar), signed webhook emit
  (HMAC-SHA256, retries), lead-store modes `none | webhook | database | both`,
  page-context retrieval boost.
- **Quality**: scenario eval harness (PRD Part H), CI owner-string gate,
  `SECURITY.md`, MIT `LICENSE`, lean docs (README/ARCHITECTURE/SETUP/CONTEXT/
  DECISIONS + ADR-001..004).

### Verified
- Full pipeline live end-to-end against Gemini (`gemini-2.5-flash` +
  `gemini-embedding-001`): grounded, evidence-cited, third-person answers over SSE.
- 57 unit tests green (core 25 · widget 2 · server 30). Safety + Grounding eval
  groups 100% on fresh quota.

### Pending
- Reference deployment into the real portfolio (Next.js API route + widget).
- Full eval-matrix pass on non-free-tier quota; expansion to H2 minimum counts.
