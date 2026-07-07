---
owner: Tech Lead
last_updated: 2026-07-06
update_trigger: A learning confirmed at Sprint Close, or a learning promoted to a durable rule
status: current
---

# Kenalin — Learnings Ledger

Append-only record of confirmed corrections and patterns surfaced at Sprint Close. A learning that
**recurs (count ≥ 2)** is promoted into a *durable* rule — a `CLAUDE.md` anti-pattern, a `CONTEXT.md`
rule, or a skill red-flag — and marked below. Reviewed at every **Sprint Promote** before planning.

---

## L-013 [tags: widget, integration] [status: active]: A Shadow-DOM widget can follow ANY host persona/mode signal by observing a data-* attribute on <html>
- seen: Sprint-008
- count: 1
- promoted: no
- related: L-012 (same observer pattern, generalized from theme to persona)

The portfolio has a code/product persona toggle (Zustand) that reflects to
`document.documentElement.setAttribute('data-mode', …)`. The widget follows it the same
way it follows dark/light: one MutationObserver on `<html>` watches `class`/`data-theme`/
`data-mode` and re-applies a merged theme (`branding.theme + branding.modes[mode]`). Lesson:
expose per-signal overrides in config (`branding.modes`) and observe the host's `data-*`
signal — don't hard-code the host's persona names or colors into the widget package.

## L-012 [tags: widget, theming, integration] [status: active]: A Shadow-DOM widget in a themed host must OBSERVE the host's theme mechanism, not just prefers-color-scheme
- seen: Sprint-007
- count: 1
- promoted: no
- related: L-009 (both: the host's theme reality constrains the widget)

The widget only reacted to `@media (prefers-color-scheme)`, so it ignored the portfolio's
manual next-themes toggle (a `dark` class on `<html>`) — the chat stayed one mode while the
site switched. Fix: a MutationObserver on `document.documentElement` mirrors the host's
`dark` class / `data-theme` onto the widget host's `data-theme` (+ an explicit
`:host([data-theme=light])` to beat the OS media query). When embedding a themed component,
follow the host's theme signal, don't assume the OS preference is the source of truth.

## L-011 [tags: ingest, correctness] [status: active]: A chunk id derived from the file basename collides across parallel dirs — use a path-relative id
- seen: Sprint-007
- count: 1
- promoted: no
- related: L-010 (both: an ingest bug invisible to unit tests, caught by inspecting real data)

The markdown ingest used `md:${basename}` as the sourceId, so `content/en/x.mdx` and
`content/id/x.mdx` produced the SAME chunk id — two distinct chunks sharing an id, which
surfaced as duplicate evidence cards (and would corrupt any id-keyed logic). Unit tests
passed (single-dir fixtures); only inspecting the live index revealed it. Fix: derive the id
from the path relative to the ingest root. When an id is built from a name, prove it's unique
across the whole corpus, not just one directory.

## L-010 [tags: ingest, verification] [status: active]: A built index goes stale after an ingest-logic change — re-ingest and re-verify the real index, not just the code
- seen: Sprint-006
- count: 1
- promoted: no
- related: L-007 (both: verify the artifact that actually ships, not the source)

T4/T5 changed how the profile url and MDX types are ingested, but a headless probe still showed the profile "more" link pointing at the site root — because the demo `content/index` (gitignored build artifact) was built *before* the change. Unit tests were green (they test the ingest function); the stale index wasn't. Fix: after changing any ingest logic, **re-ingest** the demo/host index and grep the actual `chunks.jsonl` (urls, types) before declaring the behavior fixed. The eval also runs against that index, so a stale one silently hides ingest regressions.

## L-009 [tags: widget, theming] [status: active]: Single-valued theme tokens can't brand-match a light+dark widget — override only mode-invariant tokens
- seen: Sprint-006
- count: 1
- promoted: no
- related: L-004 (both: the widget's real rendering constrains the config surface)

The widget exposes one value per `--kenalin-*` token, but renders in both light and dark. A mode-sensitive token (accentText, bg, surface, text, border) set to a brand color breaks the other mode (e.g. a dark-blue accentText fails contrast on the dark surface). So a host can only safely override the **mode-invariant** brand tokens (accent, navy, amber, soft); neutrals must stay adaptive. Real fix is per-mode theme values (TD-012). When theming a dual-mode component, check both modes before promising a full brand match.

## L-008 [tags: widget, css, mobile] [status: active]: `env(safe-area-inset-*)` clears OS insets, NOT a host app bottom-nav — those need an explicit offset
- seen: Sprint-006
- count: 1
- promoted: no
- related: L-004 (both: verify against the real host layout)

T1 shipped safe-area insets to "clear a host bottom nav", but `env(safe-area-inset-bottom)` only accounts for the OS home-indicator/notch — it's 0 for an in-page 68px app dock. The portfolio's launcher still collided until an explicit `offsetYMobile` knob was added. Lesson: safe-area ≠ app chrome; clearing a host's own fixed nav needs a configurable offset, and the acceptance must be checked against the *host's* actual nav height, not assumed from safe-area alone.

## L-007 [tags: deploy, architecture] [status: active]: The portfolio vendors the `embed` engine, not the Hono app — wire production features into `embed.ts` too
- seen: Sprint-005
- count: 1
- promoted: no
- related: L-003 (both: verify the real artifact that ships)

The live site imports the vendored `kenalin-engine.mjs` (built from `embed.ts` / `createKenalinEngine`),
NOT the Hono `createApp`. So a feature added only to the Hono path never reaches production: the
response cache (SPRINT-004, D4 "Hono-path only") was invisible to the portfolio until wired into
`embed.ts` in SPRINT-005. When adding a prod-facing capability, ask "does the embed engine get it?"
and smoke the **vendored bundle**, not the repo source.

## L-006 [tags: cost, models, eval] [status: active]: Validate a cheaper-model swap across MULTIPLE eval runs — cheap models trade quality for variance
- seen: Sprint-005
- count: 1
- promoted: no
- related: L-005 (both: measure the real behavior before committing)

`gemini-2.5-flash-lite` is ~35% cheaper but its quality is *unstable*: one eval run passed all bars,
the next gave grounding 75% / intent 80% / conversation 70%. **Safety held 100% both runs** (the
policy prompt is robust), but grounding/intent/conversation don't. A single green eval is not enough
for a cheap-model swap — run it several times and look at the variance, not just one pass. Cheaper
models fail *silently and intermittently*, which is worse than failing consistently.

## L-005 [tags: cost, measurement, planning] [status: active]: Measure cost levers with a live spike before committing sprint scope — don't rank optimizations by intuition
- seen: Sprint-004
- count: 1
- promoted: no
- related: L-003 (both: measure the real runtime, don't assume)

Twice in one sprint an intuited cost lever was wrong: (1) "implicit Gemini caching is enough" —
a spike showed cached 0/3 on a real prefix; (2) "context caching (T1) is the biggest lever" —
the spike showed it saves ~3%/turn, net-marginal at low traffic, while the response cache (T2)
skips whole calls. A 5-minute direct-API spike reordered the sprint (deprioritized T1, focused
T2) and would have been wasted effort if built on the assumption. For any cost/perf optimization,
spike-and-measure the actual saving before scoping the build.

## L-004 [tags: widget, testing, a11y] [status: active]: Verify widget behavior/a11y via Chrome-MCP Shadow-DOM probes when there's no jsdom harness
- seen: Sprint-003
- count: 1
- promoted: no
- related: L-002 (both: verify against the real runtime, not an assumption)

The widget test env is `node` with no jsdom, so focus trap / Escape / roles can't be unit-tested.
Instead: build the widget, run the API dev server (:8787) + a static server on an **allowed CORS
origin** (:5173, per demo `allowedOrigins`), load the example in Chrome (MCP), and drive
`javascript_tool` probes against `element.shadowRoot` — inspect `role`/`aria-*`, dispatch
`KeyboardEvent`s, read `shadowRoot.activeElement`. Note: an automated tab has `document.hasFocus()
=false`, but `.focus()` still sets `shadowRoot.activeElement`, so focus assertions work. This gave
live proof of the focus trap that no static test could.

## L-003 → promoted: `.claude/CONTEXT.md` § Anti-Patterns (rebuild a changed package's `dist` before cross-package typecheck/test/measure). Seen Sprint-002, Sprint-003. Durable rule is the record now.

---

## L-002 → promoted: `.claude/CONTEXT.md` § Anti-Patterns (verify a real-runtime probe before declaring env/secret-blocked). Seen Sprint-001, Sprint-002. Durable rule is the record now.

The portfolio `.env` had Supabase/Resend/Upstash but no Gemini key; `/api/chat` returned
`server_misconfigured`. Unit tests + eval (run in the Kenalin repo, which *has* the key) couldn't
catch it — only the live host smoke did. Check the host's env before wiring an integration.

---

## L-001 [tags: resilience] [status: active]: Transient upstream failures read as logic/quality bugs — retry before falling back
- seen: Sprint-001
- count: 1
- promoted: no
- related: L-002 (both surfaced only under live conditions)

Eval runs intermittently showed intent at ~20% (mass `unknown`). It looked like an intent-classification
regression, but was the Gemini call transiently failing → the safe fallback (`unknown`). Adding a
provider retry (429/5xx/timeout, backoff) made both production and the eval stable (3/3). Don't debug
a "logic" failure before ruling out a flaky dependency.
