---
owner: Tech Lead
last_updated: 2026-07-07
update_trigger: A sprint/phase is closed
status: current
---

# Changelog

All notable changes to Kenalin. Format loosely follows Keep a Changelog.

## [Unreleased]

_Nothing yet._

## [0.4.0] — 2026-07-07

SPRINT-007 (portfolio polish round 2) — eight fixes from live inspection. `pnpm verify`
green (120 tests); eval 49/49 (100%, safety 100%).

### Added
- **Evidence de-dup (TASK-017)**: `dedupeByProject` collapses localized/duplicate
  variants of one project to a single card, preferring the conversation language. Also
  fixes an id collision — markdown ingest gave same-named files in different locale dirs
  the same `md:basename` id; ids are now path-relative and `projectId` derives from `slug`.
- **Built-in brand marks**: `branding.marks {launcher, header}` picks `logo|chat|robot`
  (IconChat/IconRobot) with no hosted assets — an AI chat/robot identity via config.
- **Fullscreen toggle** in the panel header (desktop); **Home** relocated from the header
  to a conversation chip (keeps history).
- **Host theme sync**: the widget mirrors the host `<html>` `dark` class / `data-theme`
  onto its own `data-theme` (MutationObserver) + a `:host([data-theme=light])` block, so
  the chat follows the site's light/dark toggle — not just `prefers-color-scheme`.

### Changed
- **Anti-repetition** prompt tightened: no repeating prior info, no re-summarizing the
  owner's role/company across intents (grounding kept verbatim).
- **Reference portfolio**: assistant name "Aldi's AI assistant" (RIZVA dropped from the
  UI), chat launcher + robot avatar, mobile full-screen, re-ingested index (unique ids +
  projectId). Owner owns the merge + deploy.

## [0.3.0] — 2026-07-07

SPRINT-006 (portfolio UX + answer quality). Widget UX + answer-quality upgrade,
applied to the reference portfolio. `pnpm verify` green (117 tests); eval matrix
100% (12/15/12/10, safety 100%) against a re-ingested index.

### Added
- **Configurable widget position (TASK-034)**: `branding.position` — `corner`
  (bottom-right/left), `offsetX/Y`, `zIndex`, `mobile` (fullscreen/docked), and
  `offsetYMobile` to clear a host app bottom-nav (safe-area alone doesn't — L-008).
  Launcher/panel add `env(safe-area-inset-*)`; the widget patches the host viewport
  meta for `viewport-fit=cover`.
- **Swappable icon set (TASK-035)**: `branding.icons` (name→URL) rendered via CSS
  mask so overrides inherit the theme accent; built-in SVG fallback per icon.
- **Header "Home" button (TASK-036)**: returns to the intro/quick-actions while
  **keeping** the conversation; Close still clears + closes.
- **Conversation persistence (TASK-013)**: `sessionStorage` of messages + state +
  session id — survives reload, clears on tab close. Pure serialize/deserialize with
  version+shape validation.
- **Idle detection + auto-close (TASK-012)**: after inactivity, a "still there?"
  nudge then auto-minimize; thresholds config-driven (`assistant.idle`, default
  60s/30s); `prefers-reduced-motion` respected.

### Changed / Fixed — answer quality
- **De-biased the profile bio (TASK-037)**: the profile summary was retrieved as
  evidence nearly every turn and re-grounded into every answer's opening ("… is a
  Founding CTO …"). A conversation rule now leads with the specific evidence and
  varies the opening, keeping the grounding-by-id requirement verbatim (retrieval +
  LIMITS untouched — L-005). Eval unchanged at 100%.
- **Profile "more" link off the homepage (TASK-038)**: the profile-summary chunk
  linked to the site root; it now uses `owner.aboutUrl` / profile-JSON `aboutUrl`,
  or carries no url — never the bare root.
- **MDX frontmatter type mapping (TASK-039, TD-011)**: `normalizeType()` maps
  non-canonical `type: technical|hybrid` → `case_study` so evidence cards render
  typed instead of generic; `url:` is carried through.

### Reference portfolio (TASK-040)
- Re-vendored engine + widget into aldianrizki.com; config gets brand theme (blue
  #2563EB / amber #E9A50D), mobile-docked position clearing the 68px dock, and
  `aboutUrl` → /en/about; 10 case-study MDX get `url:`; re-ingested 117 chunks
  (profile→/en/about, 110 typed case_study chunks with specific links, 0 root urls).
  Verified against the **vendored bundle** (L-007). Owner owns the merge + deploy.

## [0.2.0] — 2026-07-07

First tagged release beyond the MVP foundation (0.1.0). Bundles SPRINT-001…005:
distributed limiter + usage (Upstash), CI gate, model cost tuning + eval expansion
(12/15/12/10), config branding + accessibility, grounding-safe response cache, and the
production cost fix (thinking-off + cache re-vendored, ~31 → ~11 IDR/turn).

### Fixed — release prep
- **Agnostic deploy**: `ContentType` coerces an unknown/legacy chunk type to `custom`
  (`.catch("custom")`) instead of throwing — so a host index built with its own taxonomy
  (e.g. `technical`/`hybrid`) deploys and answers without a schema dependency. Caught by a
  live smoke of the reference portfolio (110/117 chunks used non-enum types).

### Changed — SPRINT-005 (cut cost to scale, 2026-07-07)
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
