---
owner: Tech Lead
last_updated: 2026-07-06
update_trigger: A sprint/phase is closed
status: current
---

# Changelog

All notable changes to Kenalin. Format loosely follows Keep a Changelog.

## [Unreleased]

### Changed — SPRINT-005 (cut cost to scale → v0.2, 2026-07-07)
- **Production cost fix (TASK-030)**: the live portfolio ran a stale vendored engine with
  thinking ON and no response cache. Re-vendored the current engine + set
  `server.model.thinkingBudget: 0` in the portfolio config, and **wired the response cache
  into the embed engine** (`createKenalinEngine` — it was Hono-only before). Vendored-bundle
  smoke: thinking=0, repeat=cache-hit (0 tokens), **cost/turn ~31 → ~11 IDR**. (Portfolio
  commit/deploy is the owner's — TASK-025.)
- **Evaluated → not adopted:** per-turn **context trimming (TASK-031)** — evidence/snippet/
  window cuts regress grounding + destabilize intent for ~5%; the prompt cost is the static
  safety/grounding prefix, which is load-bearing. **lite-model swap (TASK-027)** — flash-lite
  is ~35% cheaper but grounding/intent/conversation are unstable on it (safety holds); left
  config-gated for a future stronger lite model.

### Added — SPRINT-004 (cost-optimal chat flow → v0.2, 2026-07-06)
- **Grounding-safe response cache (TASK-024)**: caches the validated `ChatResponse` keyed
  on `SHA-1(normalized query + language + sorted retrieved chunk id:content)`; a hit on a
  non-screening turn returns the stored response **without the Gemini call** (~99% of
  cost/turn). Keying on the retrieved-chunk signature keeps it grounding-safe (a different
  entity retrieves different chunks → miss, never a cross-entity answer); chunk content in
  the key self-invalidates on re-ingest. In-memory LRU + Upstash impls (per-instance
  fallback). Live: identical repeat = 0 tokens vs 1999 on the first turn.

### Decided / not built — SPRINT-004
- **Deterministic context-pooling intake — rejected (ADR-005)**: a `/council` found a
  non-LLM off-script detector is an unwinnable, English-only arms race and `name`/`purpose`
  can't be closed-form; intake stays inside the single LLM pass.
- **Explicit Gemini context caching — evaluated, deferred (TASK-026)**: a live spike showed
  `cachedContent` works but saves only ~3%/turn with net-marginal economics at low traffic;
  revisit at >5 turns/hr sustained.

### Added — SPRINT-003 (launch polish → v0.2, 2026-07-06)
- **Custom branding via config (TASK-004)**: owners set a launcher logo/avatar (image
  URL) and theme-token overrides in `kenalin.config.ts` — no code. `BrandingConfigSchema`
  + `ThemeTokensSchema` (both `.strict()`), surfaced through `/api/config/public`
  (public-safe) and applied by the widget as `--kenalin-*` custom properties on the host,
  with a K-mark/image fallback. "Powered by Kenalin" footer is non-removable (schema has
  no hide-field). Default (no branding) is visually unchanged.
- **Accessibility (TASK-006)**: focus trap in the open panel (Tab/Shift+Tab wrap),
  Escape-to-close with focus restore to the launcher, `aria-modal` dialog, `role="log"` +
  `aria-live="polite"` message log so streamed answers are announced, and WCAG-AA contrast
  (new light/dark-aware `--k-accent-text` token fixes teal-as-text). Verified live in
  Chrome on the plain-HTML example. Widget 15.1 KB gz (budget 60).

### Added — SPRINT-002 (harden for scale → v0.2, 2026-07-06)
- **Distributed rate limiter + usage counters**: Upstash Redis-backed limiter and
  UsageTracker/token-budget (via REST over `fetch`, no SDK dep) so both hold across
  serverless instances; in-memory kept as fallback when `UPSTASH_*` env is unset.
  Cross-instance proven with a shared-`FakeRedis` test. Resolves TD-005 + TD-006.
- **CI gate (GitHub Actions)**: `ci.yml` runs `pnpm verify` (owner-string gate +
  typecheck + build + tests) on push/PR to main; `eval.yml` runs the token-spending
  eval matrix manually (`workflow_dispatch`) with the LLM key from a repo secret.
- **Model cost tuning (−37% cost/turn, quality-neutral)**: `server.model` config
  (thinking budget, lite model); Gemini provider honors per-request model +
  `thinkingConfig` + reports cached tokens; whole-turn lite-model swap
  (`selectTurnModel`, ADR-001-safe, config-gated off); prompt reorder puts config-
  static blocks first for a longer implicit-cache prefix. Thinking disabled in demo.
  Resolves TD-007.
- **Eval matrix expanded** to the H2 minimums (12/15/12/10 = 49 scenarios), 100%
  green in id + en; runner reports tokens + a µUSD cost/turn proxy. Resolves TD-001.

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
