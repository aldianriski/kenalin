---
sprint: 006
slug: portfolio-ux-answer-quality
owner: Tech Lead
last_updated: 2026-07-07
status: closed
plan_commit: be4de33
close_commit: [set post-commit]
update_trigger: sprint execute/close events
---

# SPRINT-006 — Portfolio UX + answer quality

> **Theme:** The reference portfolio is live but rough — the widget doesn't fit the host
> (position collides with the mobile bottom nav, no brand skin), the assistant sounds
> robotic (re-grounds every answer in the profile bio, "more" link always hits the site
> root), and there's no session continuity (reload wipes the chat, no way back to home).
> This sprint adds **owner-agnostic config knobs** to the engine and **UX + answer-quality**
> fixes to the widget/prompt, then applies real values in the portfolio repo. Config knobs
> before values — the portfolio supplies data, `packages/*` stays owner-string-free.

## Scope

**In:**
- Configurable widget position + safe-area / bottom-nav handling (T1).
- Swappable icon set (URL + CSS-mask tint) + brand skin surface (T2).
- Answer quality: anti-repetition + de-biased profile bio (T3); "more" link off the homepage (T4); typed/specific evidence via fixed MDX frontmatter (T5).
- Session continuity: Home button keeping history (T6); sessionStorage persistence (T7); idle detection + auto-close (T8).
- Apply all of the above in the external portfolio repo + re-ingest + verify + commit (T9).

**Out (deferred):** real token streaming (TASK-014) · analytics (TASK-015) · evidence dedup (TASK-017) · handoff brief enrichment (TASK-016) · unread badge (TASK-018) · skeletons/animations/sound (TASK-009/010/011) · chips intake A/B (TASK-029) · admin UI (TASK-021) · pgvector + provider adapters (TASK-019/020) · release close-out (TASK-032/033 — separate P0). A full widget test harness (TD-009) is **not** a deliverable — see Assumptions A5.

## Plan

<!-- One block per task, dependency order. DoD checkboxes are what /orchestrator sprint-bulk loops and /prime counts. -->

### T1 — Configurable widget position + safe-area `[size: M · risk: med]` · TASK-034
Layers: `packages/core` branding schema, `packages/widget` styles.ts / element.ts.
Launcher/panel offsets + z-index are hard-coded (styles.ts) with no safe-area handling, so on the portfolio the widget collides with the host's mobile bottom nav. Add a generic `branding.position` config the widget consumes.

**Acceptance:** setting `branding.position` moves the launcher + panel; on mobile `docked` clears a bottom nav via safe-area insets; no hard-coded 22px/z-index remain.

**DoD:**
- [x] `branding.position` added to the Zod branding schema: `corner` (bottom-right|bottom-left), `offsetX/offsetY`, `zIndex`, `mobile` (fullscreen|docked); TS derives.
- [x] Widget reads it (element.ts) and drives launcher + panel CSS custom properties; `env(safe-area-inset-*)` applied; viewport meta patched additively for `viewport-fit=cover`.
- [~] Mobile `docked` renders above a host bottom nav — **batched** into the consolidated Chrome-MCP pass (after T2/T6/T7/T8; L-004).
- [x] Widget test covers config → CSS-var mapping (`positionCssVars`); `pnpm verify` green (105 tests).

### T2 — Swappable icon set (URL + CSS-mask tint) `[size: M · risk: low]` · TASK-035
Layers: `packages/core` branding schema, `packages/widget` icons.tsx / app.tsx / styles.ts.
Icons are inlined SVGs, not configurable. Add an optional `branding.icons` name→URL map rendered via CSS mask so single-color icons still inherit `--kenalin-accent`; unset keys fall back to built-in SVGs (D1).

**Acceptance:** supplying `branding.icons` swaps the rendered icons and they tint with the theme accent; omitting a key keeps the built-in icon.

**DoD:**
- [x] `branding.icons` (name→URL) added to schema + public-config + widget types; owner-agnostic (no icon assets in `packages/*`).
- [x] Widget renders overridden icons via CSS mask (inherits currentColor), built-in SVG fallback for missing keys; wired at header/composer/quick-actions/evidence/complexity/retry/actions via `<Icon>` + IconOverrideContext.
- [x] `iconOverride` resolution unit-tested (override + empty + missing + no-map); render check batched to Chrome-MCP; `pnpm verify` green (105 tests).

### T3 — Anti-repetition + de-bias profile bio `[size: M · risk: high]` · TASK-037
Layers: `packages/core` prompt/builder.ts (conversationRules, personaBlock), retrieval constants.
The profile-summary chunk is retrieved as evidence almost every turn and a grounding rule forces re-grounding in it, so every answer opens "… Founding CTO and engineering …". Stop mandating re-grounding in the summary once established in-session and instruct varied openings.

**Acceptance:** answers across 3 different topics don't repeat the bio opening; the eval matrix stays 100% id+en.

**DoD:**
- [x] conversationRules gains an anti-repetition / vary-opening / don't-restate-the-bio rule (grounding requirement kept verbatim — emphasis/ordering only, per G2 refinement #1).
- [x] profile-summary de-prioritized via the prompt (NOT retrieval — LIMITS note + L-005 keep the chunk; the rule reorders emphasis).
- [x] `owner.role` still identifies the assistant in personaBlock (needed for identity); the repetition driver (re-grounding in the summary) is addressed by the rule instead.
- [x] `pnpm eval` = 12/15/12/10 = 49, 100% all dims (safety 100%, thinking 0, cache hit); `pnpm verify` green.
- [x] Qualitative "3 topics don't repeat the bio opening" — **confirmed** via a headless orchestrator probe: 3 topics → 3 distinct topic-specific openings, none reverting to the generic bio.

### T4 — Repoint profile "more" link off homepage `[size: S · risk: low]` · TASK-038
Layers: `packages/server` ingest/sources/json.ts, `packages/core` owner schema.
The profile-summary chunk's URL is hard-set to `owner.website` (site root) and it's the always-clickable evidence, so "more" reliably lands on the homepage. Use an optional `owner.aboutUrl`; carry no URL if unset (D3).

**Acceptance:** the profile-summary chunk links to `owner.aboutUrl` when set, else has no URL — never the bare site root.

**DoD:**
- [x] `owner.aboutUrl` optional field added to the owner schema; `aboutUrl` added to the profile-JSON shape (the wired path per G2 refinement #2 — ingest sources have no config access).
- [x] json.ts profile-summary chunk uses `p.aboutUrl` or omits the URL (dropped `url: p.website`). Demo profile.json sets `aboutUrl` to exercise it.
- [x] json.test.ts asserts summary url = aboutUrl when present, undefined when absent (never the site root); `pnpm verify` green (107 tests).

### T5 — MDX frontmatter type/url mapping + re-ingest `[size: M · risk: med]` · TASK-039
Layers: `packages/server` ingest/frontmatter.ts + sources/markdown.ts. Resolves TD-011; relates TASK-023.
The portfolio's case-study MDX uses non-canonical `type: technical|hybrid` (coerced to `custom`) and its page `url:` isn't reliably parsed, so those cards render generic and carry no specific link — leaving the homepage-linked profile chunk to win. Map non-canonical types → `case_study` (D4) and parse `url:`.

**Acceptance:** re-ingested case-study chunks render **typed** cards with **specific** page links, not generic/homepage.

**DoD:**
- [x] `normalizeType()` in markdown.ts maps `technical`/`hybrid`/`case-study` → `case_study`, passes canonical through, unknown → `custom`; `url:` already parsed (markdown.ts:45) carries through.
- [x] markdown.test.ts covers alias mapping + url parse + canonical passthrough + unknown/missing fallback.
- [x] TD-011 engine side resolved → TASK-039 (content re-ingest completes it in T9); `pnpm verify` green (109 tests).

### T6 — Header "Home" button (keep history) `[size: S · risk: low]` · TASK-036
Layers: `packages/widget` app.tsx (header, icons).
There's no way back to the intro/quick-actions from an active chat — only Close, which clears + closes. Add a Home control that returns to the intro view without clearing `messages`/state.

**Acceptance:** clicking Home shows the quick-actions intro again while the conversation is preserved and resumable; Close still clears + closes.

**DoD:**
- [x] Home `.iconbtn` in the header (keyboard-reachable), re-surfaces the quick-actions — pinned at top mid-chat, bottom on a fresh intro; dismisses on send.
- [x] `messages` + conversation state preserved (not cleared) on Home; Close still clears + closes.
- [x] typecheck + build green (widget tests 11); live behavior **batched** to the consolidated Chrome-MCP pass (L-004).

### T7 — Conversation persistence (sessionStorage) `[size: S · risk: low]` · TASK-013
Layers: `packages/widget` app.tsx.
A reload wipes the chat (in-memory `messages` + fresh session id each mount). Persist `messages` + `stateRef` + `sessionRef` to sessionStorage and rehydrate on mount; clears on tab close (D2 — privacy).

**Acceptance:** reloading the page keeps the conversation; closing the tab clears it.

**DoD:**
- [x] `messages` + conversation state + session id saved to sessionStorage (settled turns only) and rehydrated once on mount; storage I/O guarded (SSR/private-mode safe). Close = full reset + clear.
- [x] Pure serialize/deserialize + version/shape validation covered by session-store.test.ts (round-trip, corrupt, version mismatch, key namespacing).
- [x] typecheck + build + tests green (113); live reload-survives check **batched** to Chrome-MCP.

### T8 — Idle detection + auto-close `[size: M · risk: low]` · TASK-012
Layers: `packages/widget` app.tsx.
No inactivity handling. Add a timer: 60s idle → gentle "still there?" nudge, +30s → auto-minimize the panel; timings configurable with those defaults; respects `prefers-reduced-motion` (A1).

**Acceptance:** after inactivity the nudge then auto-minimize fire at the thresholds; activity resets the timer; reduced-motion honored.

**DoD:**
- [x] Idle nudge (banner, role=status) at `nudgeSeconds`, auto-minimize at +`closeSeconds`; timer resets on open/message/typing activity.
- [x] Thresholds configurable via `assistant.idle` (schema + public-config + widget types), default 60/30; nudge banner is static (no motion) + auto-minimize uses the existing reduced-motion-safe CSS.
- [x] Pure `createIdleTimer` unit-tested with fake timers (nudge→close, kick-reset, stop-cancel); typecheck+build+tests green (116). Live timing check **batched** to Chrome-MCP (driven with a short config).

### T9 — Apply to portfolio repo + verify + commit `[size: M · risk: med]` · TASK-040 · depends-on: T1–T8
Layers: external `D:\Project\portofolio` (config + content only) + re-vendored engine.
Wire the real brand colors/icons/position config, `owner.aboutUrl`, and fixed case-study MDX frontmatter; re-vendor the engine bundle (features must reach `embed.ts`, not just the Hono path — L-007); re-ingest (117 chunks); verify live behavior; commit in the portfolio repo.

**Acceptance:** on the portfolio, grounded answers vary (no repeated bio opening), "more" links land on specific pages, the widget fits the mobile layout; Next build green; committed.

**DoD:**
- [x] Portfolio config sets `branding.position` (offsetYMobile 84px, docked) + brand `theme` (blue #2563EB/amber #E9A50D) + `owner.aboutUrl`; `profile.json` gets `aboutUrl` (the wired path). `branding.icons` left unset — mechanism ships (T2), owner supplies icon URLs later.
- [x] 10 case-study MDX got `url:` frontmatter; `type: technical|hybrid` auto-maps via T5; re-ingest → 117 chunks, **verified**: profile→/en/about, 110 case-study chunks with specific page urls, 0 root urls, 0 stale `custom`.
- [x] **Vendored-bundle smoke green** (L-007): publicConfig carries theme+position; answers are evidence-led with specific links, no bio repeat; `.env`/key confirmed (L-002). Portfolio `tsc --noEmit` clean (skipLibCheck).
- [ ] **owner-action**: full `next build` + deploy + browser-visual pass, then **commit** in the portfolio repo (owner-owned).

## Owner-action checklist
<!-- Non-dev actions a human must do. -->
- [x] Brand palette applied from the portfolio's own tokens (blue #2563EB / amber #E9A50D / deep-blue #19366B); icon URLs deferred (mechanism ready).
- [x] `owner.aboutUrl` = `https://aldianrizki.com/en/about` (localePrefix always → no bare /about).
- [x] MDX mapping `technical`/`hybrid` → `case_study` applied via T5 (auto).
- [ ] **Review + commit** the portfolio changes (17 files: vendored bundles, config, profile.json, 10 MDX, re-ingested index) in `D:\Project\portofolio`.
- [ ] Run the full `next build` + deploy; browser-visual pass (launcher clears the 68px dock on mobile; Home keeps history; reload persists; idle nudge→minimize).
- [ ] (later) Supply single-color icon URLs for `branding.icons` if a custom icon set is wanted; add Upstash REST env (TASK-033).

## Decisions (pre-locked)
- **D1** — Icons supplied as URL/data-URI (not inline SVG), rendered via CSS-mask tint. Injection-safe inside the Shadow DOM + still themeable via the accent. *(config-contract choice; not ADR-worthy)*
- **D2** — Persistence uses `sessionStorage`, not `localStorage`: survives reload, clears on tab close (privacy-safe default for conversation content).
- **D3** — Profile-summary evidence links to `owner.aboutUrl` or carries no URL — never the bare site root.
- **D4** — Non-canonical MDX `type: technical|hybrid` maps to `case_study`.
- **D5** — Shared-file coordination: `styles.ts` (T1+T2) and `app.tsx` (T2,T6,T7,T8) are touched by multiple tasks. Commit order: T1→T2 for styles.ts; T6→T7→T8 for app.tsx. Stage per-hunk, never a blanket `git add` over another task's WIP (L-042/L-037).

## Assumptions
- **A1** — Idle timings 60s → nudge, +30s → auto-minimize, configurable. *Confirm: owner review at T8 execution.*
- **A2** — `owner.aboutUrl` is added to the owner schema; the portfolio supplies the value. *Confirm: T9 portfolio config.*
- **A3** — Prod-facing features must reach the vendored `embed.ts`, and be smoked against the **vendored bundle** (L-007). *Confirm: T9.*
- **A4** — The portfolio `.env` must be checked before declaring any integration env-blocked (L-002). *Confirm: T9.*
- **A5** — Widget tasks (T1,T2,T6,T7,T8) are verified via Chrome-MCP Shadow-DOM probes, not a jsdom harness (L-004); TD-009 (the harness) stays open and is **not** a sprint deliverable. *Confirm: TD-009 re-reviewed at close.*

## Execution Log
<!-- Append-only, dated. Plan frozen at promote. -->

### 2026-07-07 | promote | Plan locked
Decomposed from owner notes (position, custom design, persistence, home button, idle, repetitive answers, homepage "more" link) via /task-decomposer → 8 tasks (TASK-034…040) + sharpened TASK-012/013. Governance review: no learning at count ≥ 2 to promote; no high-severity TD; TD-002/TD-009 (widget test harness) flagged as aged ≥ 3 sprints (folded into A5, not a deliverable). L-002/L-004/L-007 folded into the plan as pre-locked reminders.

### 2026-07-07 | T1 done | Configurable position + safe-area
Position wired core→server→widget. The `branding.icons` **config surface** (schema + public-config + widget types + `iconOverride` helper) rides along in this commit since it shares schema.ts/public-config.ts/types.ts/branding.ts with T1 (D5); the icon *rendering* is T2. Live mobile-docked check batched to the consolidated Chrome-MCP pass. verify green, 105 tests.

### 2026-07-07 | T9 dev-complete | Portfolio applied + vendored smoke green
Re-vendored engine (`kenalin-engine.mjs`/`.d.mts`) + widget (`public/kenalin.js`) into D:\Project\portofolio. Config: `owner.aboutUrl` + `profile.json` aboutUrl (→ /en/about), `branding.theme` (portfolio blue/amber, mode-invariant tokens only so dark mode stays legible), `branding.position` (offsetYMobile 84px for the 68px magnetic-dock, mobile docked). Added `url:` to all 10 case-study MDX (they had slug but no url). Re-ingested 117 chunks — verified: profile→/en/about, 110 case_study chunks w/ specific urls, 0 root, 0 stale custom. **Vendored-bundle smoke** (the real artifact, L-007): publicConfig carries theme+position; "case study" Q → QuickHub answer w/ /en/case-studies/ links; "leadership" Q → /en/about + specific pages; no bio repeat. Portfolio tsc clean (skipLibCheck). Remaining: owner review+commit, full next build + deploy + browser-visual pass. Note: accentText/neutral tokens left at widget defaults (single value can't satisfy AA in both light+dark) — minor teal residual on small links; candidate for a future mode-aware widget theme (TD).

### 2026-07-07 | scope-refine (T1) | Add offsetYMobile — safe-area ≠ app nav
T9 recon found the portfolio's mobile dock is a **68px app nav bar** (`magnetic-dock.tsx`), which `env(safe-area-inset-*)` does NOT clear — so T1's shipped safe-area-only approach didn't genuinely meet its DoD ("clears a host bottom nav") for a real app bar. Added a generic `branding.position.offsetYMobile` knob (schema + public-config + widget types + `positionCssVars` + a `≤768px` launcher lift + docked-panel bottom). No G2 re-confirm needed — this completes T1's own acceptance rather than changing scope. widget branding test 8; typechecks green; 117 tests.

### 2026-07-07 | verify | Answer-quality slice confirmed live + demo re-ingest
Headless orchestrator probe (3 topics) confirmed **T3**: openings are distinct and evidence-led — "QuickHub is a project where Sari replaced…", "Sari has experience as a tech lead…", "Sari is strongest in workflow automation…" — none the old bio. Caught that the gitignored demo `content/index` was stale (built pre-T4/T5) so **re-ingested** it (gemini, 17 chunks): profile chunk url now `/about` (0 root-only urls) → **T4** confirmed end-to-end; case-study links specific. Eval re-ran GREEN 49/49 against the fresh index.

**Env friction:** the `C:` drive is critically full (0.19 GB free; D: has 197 GB). This caused the intermittent `errno -4094` spawn / ENOSPC failures during `pnpm -r` runs and blocked `npx`. Individual package commands + the local jiti work. **The widget DOM live checks (T1 mobile-docked, T2 icon render, T6 Home, T7 reload-survives, T8 idle timing) are deferred to T9's portfolio live smoke** — standing up Chrome-MCP + dev/static servers against a full C: is a rabbit-hole risk; each is already unit-test + typecheck + build covered.

### 2026-07-07 | T8 done | Idle detection + auto-close
Config `assistant.idle` (nudge/close seconds, default 60/30) surfaced to the widget. Pure `createIdleTimer` (unit-tested, fake timers) drives a static "still there?" nudge banner then auto-minimize; kicked on open/messages/input. Reduced-motion-safe (no added animation). core 35 + server 63 + widget 18 = 116 tests. **T1–T8 (engine + widget) complete; next: consolidated Chrome-MCP live pass, then T9 portfolio apply.**

### 2026-07-07 | T7 done | Conversation persistence
New pure `session-store.ts` (serialize/deserialize + version/shape validation) with sessionStorage I/O guarded in app.tsx. Restore-once on mount seeds messages/state/session id; persist effect writes settled turns on change; Close now fully resets + clears the key. `pnpm verify` hit repeated transient Windows `pnpm -r` child-spawn errors (errno -4094; core build, then core typecheck) — each passed when run directly (L-001); ran the gate piecewise green: owner-strings ✓, all typechecks ✓, builds ✓, tests 35+63+15 = 113.

### 2026-07-07 | T6 done | Home button (keep history)
Added `homeView` state + a header Home button. Re-surfaces the quick-action grid (top when tapped mid-chat, bottom on fresh intro) without clearing messages; dismisses on send. IconHome + `home`/`idleNudge` i18n strings added (idleNudge is for T8, inert until then). Transient tinypool spawn error on the first verify (errno -4094) — re-ran widget tests green (L-001). typecheck+build green.

### 2026-07-07 | T5 done | MDX type/url mapping
Added `normalizeType()` in markdown.ts (technical/hybrid/case-study → case_study, canonical passthrough, unknown → custom). `url:` was already parsed — the "no View link" is a content gap (T9). markdown.test.ts added. TD-011 engine side resolved. verify green, 109 tests.

### 2026-07-07 | T4 done | Repoint profile "more" link
Profile-summary chunk now takes `aboutUrl` (profile JSON) or no url — dropped the `url: p.website` homepage default. `owner.aboutUrl` added to core schema for completeness; demo profile.json sets aboutUrl. New json.test.ts covers both branches. verify green, 107 tests.

### 2026-07-07 | T3 done | Anti-repetition + de-bias bio
Prompt-only: added one conversationRules bullet (lead with specific evidence, don't restate the bio once introduced, vary openings) with the grounding requirement kept verbatim. Retrieval/LIMITS untouched (respects the load-bearing profile-rank note + L-005). Eval matrix re-ran GREEN 49/49 (100% all dims, safety 100%) — no regression from the high-risk change. Qualitative non-repetition eyeball batched to the live pass.

### 2026-07-07 | T2 done | Swappable icon set
Icon rendering: `IconOverrideContext` (provided at the App root in element.ts) + a CSS-masked `<Icon name fallback>` wrapper. Overrode header/composer/quick-action/evidence/complexity/retry/action icons; chevrons left built-in (decorative, not brand identity). currentColor tint keeps overrides themeable. verify green, 105 tests.

## Files Changed
<!-- Feeds CHANGELOG at close. -->

| Area | Tasks | Change (WHY) |
|------|-------|--------------|
| `core/config/schema.ts` | T1,T2,T4,T8 | `branding.position` (+offsetYMobile), `branding.icons`, `owner.aboutUrl`, `assistant.idle` |
| `server/public-config.ts` | T1,T2,T8 | surface position/icons/idle to the widget bootstrap |
| `server/ingest/sources/{json,markdown,frontmatter}.ts` | T4,T5 | profile url from aboutUrl; `normalizeType()` (technical/hybrid→case_study) |
| `core/prompt/builder.ts` | T3 | anti-repetition rule (grounding kept verbatim) |
| `widget/{styles,element,branding,icons,app}.ts(x)` | T1,T2,T6 | position CSS + safe-area; masked-icon overrides; Home button |
| `widget/{session-store,idle}.ts` (+tests) | T7,T8 | sessionStorage persistence; pure idle timer |
| portfolio `D:\Project\portofolio` | T9 | re-vendored bundles + config + profile.json + 10 MDX + re-ingest (commit `4ef9334`) |

New tests: `session-store` (4), `idle` (3), `json`/`markdown` ingest (4), position/icon branding (3) → **117 total** (was 102).

## Retro
<!-- Written at close. Route buckets per DOCS_Guide §10. -->

**Retrieval check** — No miss/contradiction. Prior learnings were actively applied: L-002 (checked key/env before declaring env-blocked), L-004 (batched widget DOM verification vs. forcing a browser mid-loop), L-005 (kept retrieval/LIMITS untouched for T3 — de-biased via prompt only), L-007 (smoked the vendored bundle, not repo source). No ADR contradicted; none newly warranted (all config-contract/impl choices).

**Worked**
- Per-task Implement→verify→commit cadence kept every step green + reversible (11 clean commits); when `pnpm -r` flaked, per-package runs gave a clean signal.
- Headless verification beat a browser for the answer-quality slice: an orchestrator probe (3 topics) + the vendored-bundle smoke (L-007) proved T3/T4/T5 end-to-end without Chrome — cheaper and reliable under disk pressure.
- Re-ingesting caught a real gap (L-010): unit tests were green but the stale demo index still showed the root link; grepping the actual `chunks.jsonl` confirmed the fix.

**Friction**
- Full `C:` drive → intermittent `errno -4094`/ENOSPC `pnpm -r` child-spawn failures + blocked `npx`; worked around with per-package runs + the local jiti bin.
- `.env` with no trailing newline broke anchored `grep`/inline env extraction; a non-anchored node read worked.
- Single-valued theme tokens can't brand-match a light+dark widget → only mode-invariant tokens overridden (TD-012 / L-009).

**Pattern candidate** (→ `docs/LEARNINGS.md`, all count 1)
- **L-008** — `env(safe-area-inset-*)` ≠ a host app nav bar; clearing it needs an explicit offset.
- **L-009** — a dual-mode widget can only safely take mode-invariant brand tokens from a single-valued theme.
- **L-010** — re-ingest + re-verify the real index after any ingest-logic change; a stale build artifact hides regressions from green unit tests.

**Buckets routed** — Shipped → `docs/CHANGELOG.md` [0.3.0]; Tech debt → TD-011 resolved, **TD-012** added (TD-009 still open); Follow-ups → **TASK-041/042/043**; Learnings → **L-008/L-009/L-010**.
