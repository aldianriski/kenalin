---
sprint: 010
slug: demo-v2-ci-green
owner: Tech Lead
last_updated: 2026-07-07
status: active
plan_commit: (pending — uncommitted)
close_commit: (set at close)
update_trigger: sprint execute/close events
---

# SPRINT-010 — Demo v2 + CI green

> **Theme:** Turn the redesigned keyless demo into a finished adoption surface — icons that
> match between the landing page and the widget, a strengths + roadmap story, and a widget
> that never silently vanishes — and get `main` green again first (CI has been red on every
> push). Green bar before polish; polish before ship.

## Scope

**In:**
- Fix CI (Node 20 → 22) so the release bar guards again.
- Align the 4 quick-action icons across the widget and the landing "Try it now" chips.
- Add "Why Kenalin" strengths + a Now / Next / Later roadmap to the demo landing page.
- Widget resilience: a fallback launcher when `/api/config/public` can't load (TD-016).
- Rebuild + re-vendor the demo bundle, then ship (owner-gated deploy + rename).

**Out (deferred):** portfolio go-live (TASK-032/041/051 — separate "Go live" shortlist);
demo visual capture (TASK-045 — human-timed, after deploy, L-014); the roadmap's *Later*
items themselves (TASK-058 structured knowledge, TASK-059 learning loop — shown as roadmap,
not built here); per-mode theme tokens (TASK-043).

## Plan

### T1 — Fix CI: pin Node 22 + build-before-typecheck `[size: S · risk: low]`
Layers: `.github/workflows/ci.yml`, `.github/workflows/eval.yml`, `package.json`
Two stacked failures: (1) CI died at `pnpm install` in ~15s — pnpm 11.9.0 needs Node ≥ 22.13
(`node:sqlite`), but the workflows pinned Node 20. (2) Once install worked, `verify` failed at
typecheck: it ran `typecheck` **before** `build`, so in a clean checkout `@kenalin/core`'s
`dist`/types were absent when `packages/widget` typechecked (passed locally only because `dist`
already existed — the L-003 anti-pattern). Fix: bump Node to 22 **and** reorder `verify` to
`build` before `typecheck`.

**Acceptance:** a PR/commit runs `pnpm verify` to completion and CI is green.

**DoD:**
- [x] `ci.yml` + `eval.yml` pin `node-version: 22`
- [x] `verify` reorders `pnpm build` before `pnpm -r run typecheck`
- [x] `pnpm verify` green locally **from a clean `dist/`** (removed all `packages/*/dist`, re-ran → exit 0)
- [ ] pushed; CI run for the PR is green

### T2 — Widget resilience: never silently vanish `[size: S · risk: med]`
Layers: `packages/widget/src/element.ts` (+ a safe-default config)
Today a failed `GET /api/config/public` returns early with only a `console.warn`, so the launcher
never mounts — indistinguishable from "no widget" (TD-016, the recurring "widget gone"). Mount a
launcher from a minimal fallback config on fetch failure, so the surface is always present; opening
it can retry or show the standard error UX.

**Acceptance:** with the config endpoint 404/500, a launcher still appears; with it healthy, behavior is unchanged.

**DoD:**
- [x] config-fetch failure still mounts a launcher (fallback config: "Chat" + brand mark) — one retry first (L-001)
- [x] healthy path unchanged (normal load shows Kai + quick actions)
- [x] verified in a local browser with the config endpoint forced to 500 (L-004 probe + screenshot; new "config unavailable" log fires)
- [x] widget rebuilt (18.9 KB gz, within budget); unit tests green

### T3 — Align quick-action icons (widget ↔ landing) `[size: M · risk: low]`
Layers: `examples/vercel-demo/src/kenalin.config.ts` (`branding.icons`), `examples/vercel-demo/public/index.html`
The landing chips use 4 distinct glyphs; the widget shows 4 identical bubbles (demo ids
`what/cando/embed/oss` miss `quickActionIcon()`'s cases). Set `branding.icons`
(`quick:what|cando|embed|oss` → data-URI SVGs) so the widget renders the same 4 glyphs (D1),
and use those identical glyphs on the landing chips.

**Acceptance:** the icon on each landing chip is the same glyph as its matching widget quick-action card.

**DoD:**
- [x] `branding.icons` set with 4 data-URI SVGs (mask-rendered, inherit currentColor)
- [x] landing "Try it now" chips use the 4 glyphs (help · lightning · `</>` · heart) — verified light/dark
- [x] rebuilt config bundle serves the icons at `/api/config/public`; widget renders 4 distinct masked icons (local smoke of the vendored bundle, L-007)

### T4 — Demo landing: strengths + roadmap `[size: M · risk: low]`
Layers: `examples/vercel-demo/public/index.html`
Add a "Why Kenalin" strengths block (Easy to adopt · Fully customizable · Evidence-grounded ·
Private & self-hosted) and a **Now / Next / Later** roadmap. Now = shipped (real RAG retrieval,
Redis/Upstash cache, token/context budgets, EN/ID). Next = context caching, structured knowledge.
Later = a learning loop. Theme labels only, no internal task ids (D2). Static page — no rebuild.

**Acceptance:** the landing page shows the 4 strengths and a 3-column roadmap, on-brand, light + dark, responsive.

**DoD:**
- [x] strengths block added (Easy to adopt · Fully customizable · Evidence-grounded · Private & self-hosted; custom icons)
- [x] Now / Next / Later roadmap added (teal/navy/amber lane tags, check/arrow/clock markers)
- [x] verified light + dark in-browser (mobile via single-column media query)

### T5 — Ship: rebuild, re-vendor, deploy, rename `[size: S · risk: med]`
Layers: `examples/vercel-demo/*` (build), Vercel (deploy — owner)
Rebuild the widget (T2) + re-vendor `kenalin.js` and rebuild the api bundle (T3 config) via
`build.mjs`; **do NOT re-ingest** (knowledge unchanged). Commit; owner deploys + renames.

**Acceptance:** `kenalin.vercel.app` serves the new page; a real launcher mounts (config fetch 200) — verified on the *deployed* URL, not just local (L-015).

**DoD:**
- [x] widget built, `kenalin.js` re-vendored, api bundle rebuilt (`node build.mjs`; no re-ingest — knowledge unchanged)
- [x] local smoke of the **vendored bundle**: `/api/config/public` 200 with 4 icons; launcher + distinct cards mount (L-007/L-010)
- [ ] committed
- [ ] (owner) `vercel deploy --prod`; project renamed/aliased → `kenalin.vercel.app`; deployed URL verified (L-015)

## Owner-action checklist
- [ ] Commit + push (also triggers the CI-green check for T1) — or approve me to commit
- [ ] `vercel deploy --prod` the rebuilt demo
- [ ] Rename or alias the Vercel project → `kenalin.vercel.app` (subdomain must be free, else custom alias)

## Decisions (pre-locked)
- **D1** — Distinct quick-action icons come from the demo's `branding.icons` (data-URI SVGs), NOT by adding demo ids to core `quickActionIcon()` — keeps `packages/*` free of deployment-specific ids (Hard rule: no owner/demo strings in `packages/*`). `toPublicConfig` already forwards `branding.icons`.
- **D2** — The public roadmap uses theme labels (Now / Next / Later), not internal `TASK-NNN` ids.
- **D3** — Widget resilience = mount a launcher from a safe fallback config on config-fetch failure (resolves TD-016), rather than failing closed.

## Assumptions
- **A1** — `branding.icons` data-URI SVGs render via the widget's CSS-mask `MaskedIcon` (single-color, currentColor). *Confirm: local browser check of the rebuilt widget.*
- **A2** — A `branding.icons` change needs only an api-bundle rebuild (`node build.mjs`), NOT a re-ingest (knowledge index unchanged); the widget rebuild is driven by T2. *Confirm: smoke the vendored bundle, not source (L-007/L-010).*
- **A3** — Deploy + rename are owner actions; correctness is judged on the deployed URL (L-015), and asset capture is human-timed post-deploy (L-014, TASK-045).

## Execution Log

### 2026-07-07 | promote | Plan locked
Formed from the "continue improve" push. T1 already implemented + verified green locally (change made in `ci.yml`/`eval.yml`); remaining is commit → confirm in CI. Icon approach chosen "match exactly" (owner); strengths = all four + roadmap seeds (context optimization, structured knowledge/RAG, caching, learning loop → TASK-058/059).

### 2026-07-07 | execute | T2–T4 built + T3/T5 rebuilt & smoked
T4 (strengths + Now/Next/Later roadmap) and T3 landing chips done — verified light/dark in-browser. T2 (fallback launcher + 1 retry) added to `element.ts`; T3 icons added to the demo `branding.icons` (data-URI SVGs, D1). Rebuilt widget + `node build.mjs` (re-vendored `kenalin.js`, rebundled api). Local smoke of the vendored bundle: 4 distinct quick-action icons render (match the chips); with config forced to 500 the fallback "Chat" launcher still mounts. `pnpm verify` green after all changes. **Gotcha:** the browser HTTP-cached the old `kenalin.js` (no query on the embed src) — needed a cache-busted URL + fresh tab to load the rebuilt widget; relevant to verifying the *deployed* widget (hard-reload, L-015). Remaining: T1 push + T5 commit/deploy/rename (owner-gated).

### 2026-07-07 | execute | CI green on branch, not main (owner request) — surfaced a 2nd hidden failure
Committed T1–T5 to `sprint/010-demo-v2-ci-green`, opened PR #1 (not pushing `main`). The Node-22 bump worked — CI got *past* install — and immediately exposed a pre-existing `verify` ordering bug (typecheck before build → `@kenalin/core` types missing in a clean checkout; L-003). Reordered `verify` to build-first; proved it by deleting all `packages/*/dist` and re-running `verify` → exit 0. Pushed the fix to re-run CI.

## Files Changed

| File | Task | Change (WHY) | Risk | Test |
|------|------|--------------|------|------|
| `.github/workflows/ci.yml` | T1 | Node 20→22 (pnpm needs ≥22.13) | Low | CI reaches verify |
| `.github/workflows/eval.yml` | T1 | Node 20→22 (same) | Low | — |
| `package.json` | T1 | `verify`: build before typecheck (clean-checkout cross-package types) | Low | verify green after `rm -rf packages/*/dist` |
| `packages/widget/src/element.ts` | T2 | Fallback launcher + 1 retry on config-fetch failure (TD-016) | Med | browser smoke (config 500 → launcher mounts) + verify green |
| `packages/widget/dist/kenalin.js` | T2 | Rebuilt widget bundle | Low | 18.9 KB gz within budget |
| `examples/vercel-demo/src/kenalin.config.ts` | T3 | `branding.icons` — 4 data-URI glyphs (match chips) | Low | api serves 4 icon keys; widget renders 4 masks |
| `examples/vercel-demo/public/index.html` | T3,T4 | Strengths + roadmap sections; chip icons aligned | Low | verified light/dark in-browser |
| `examples/vercel-demo/public/kenalin.js`, `api/index.mjs`, `src/chunks.json` | T5 | Re-vendored widget + rebundled api (icons) | Low | local smoke of vendored bundle green |

## Retro
<!-- Written at close. -->

**Retrieval check** — n/a yet.

**Worked**
- 

**Friction**
- 

**Pattern candidate**
- 
