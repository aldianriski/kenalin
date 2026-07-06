---
sprint: 003
slug: launch-polish
owner: Tech Lead
last_updated: 2026-07-06
status: active
plan_commit: 18f0f6c
close_commit: [sha — set at close]
update_trigger: sprint execute/close events
---

# SPRINT-003 — Launch polish (UX)

> **Theme:** Make the widget presentable and inclusive for the public launch. Let an
> owner brand it from config (logo/avatar + theme tokens) without touching code, and
> bring it to Lighthouse a11y ≥ 90 — the two user-facing gaps standing between the
> hardened engine (SPRINT-002) and a launch-ready reference embed.

## Scope

**In:** custom branding via config (TASK-004) · accessibility to Lighthouse a11y ≥ 90
(TASK-006).
**Out (deferred):** explicit context caching (TASK-026), lite-swap validation (TASK-027),
the P2 polish set (skeletons/animations/sound/idle/persistence), and TASK-025 (owner-blocked).

## Plan

<!-- Shared-file note: BOTH tasks touch widget/src/app.tsx + widget/src/styles.ts.
     Sequential T1 → T2; T1 owns the structural/theme changes, T2 layers a11y on the
     settled markup. See § Decisions D1. -->

### T1 — Custom branding via config `[size: M · risk: med]`
Layers: `packages/core/config/schema.ts`, `packages/server/src/public-config.ts`, `packages/widget/src/app.tsx`, `packages/widget/src/styles.ts`.
Let an owner set a launcher logo/avatar (image URL, or keep the default K-mark) and a
theme preset / token overrides in `kenalin.config.ts` — surfaced through
`/api/config/public` and consumed by the widget. The "Powered by Kenalin" footer is
always present and **cannot** be removed or hidden by config (schema has no field for it).

**Acceptance:** editing branding in config (logo URL + theme tokens) changes the rendered
widget with no code change; the Powered-by footer is present and there is no config path
to remove it.

**DoD:**
- [x] `branding` config: optional `logoUrl`/`avatarUrl` (`.url()`) + `theme` token overrides; `.strict()` rejects unknown/unsafe fields.
- [x] `/api/config/public` exposes branding (no secrets — test asserts); widget renders logo/avatar + applies theme tokens as `--kenalin-*` host props.
- [x] "Powered by Kenalin" footer always rendered (`app.tsx` unconditional); **no** config field can hide it — `branding.test.ts` asserts strict rejects `hideFooter`/`showPoweredBy`/`poweredBy`.
- [x] Default (no branding) visually unchanged — `<img>` renders only when a URL is set, else the K-mark; no tokens applied when `theme` unset.
<!-- QA: schema test for the no-hide-footer guarantee; widget render test for logo + token application. -->

### T2 — Accessibility to Lighthouse a11y ≥ 90 `[size: M · risk: med]`
Layers: `packages/widget/src/app.tsx`, `packages/widget/src/styles.ts`.
Bring the widget to the PRD Phase 3 a11y bar: focus trap while the panel is open, an
ARIA live region announcing the streaming answer, full keyboard navigation (open/close,
send, tab order, escape), and verified color contrast (including branded themes from T1).

**Acceptance:** Lighthouse a11y ≥ 90 on the example page; the widget is fully operable by
keyboard and announces streamed answers to a screen reader.

**DoD:**
- [ ] Focus trap in the open panel; Escape closes and returns focus to the launcher.
- [ ] ARIA live region (`aria-live="polite"`) on the streaming answer; roles/labels on controls.
- [ ] Full keyboard nav: launcher, input, send, suggested replies, actions, close — logical tab order.
- [ ] Contrast verified (default + a branded theme) meets WCAG AA.
- [ ] Lighthouse a11y ≥ 90 measured on the example page (record the score).
<!-- QA: prefers-reduced-motion already respected elsewhere; a11y is the regression surface here. -->

## Owner-action checklist
<!-- Non-dev actions a human must do. Omit if none. -->
- [ ] If the a11y verification needs a hosted example page (not just local), confirm where to run Lighthouse (T2).

## Decisions (pre-locked)
- **D1** — T1 and T2 share `widget/src/app.tsx` + `styles.ts`. Run **sequential T1 → T2**;
  T1 owns structural markup + theme tokens, T2 adds a11y attributes/behavior on the settled
  markup. Stage shared files per-hunk at commit; no plain `git add` across the two tasks' WIP.
- **D2** — The Powered-by footer is a **non-removable** brand requirement: the branding
  schema has no field that could hide it (mirrors the B9 "config can't weaken a guarantee" rule).

## Assumptions
- **A1** — Lighthouse can run against the widget example page in this environment (dev server + a Lighthouse run). *Confirm: T2 verification step; else owner-run on a hosted page.*
- **A2** — Theme tokens are applied via CSS custom properties already used in `styles.ts` (Shadow-DOM scoped). *Confirm: T1 in `widget/src/styles.ts`.*

## Execution Log
<!-- Append-only, dated. Log here rather than editing § Plan — the plan is frozen at promote. -->

### 2026-07-06 | promote | Plan locked
SPRINT-003 promoted from Backlog P1 (Launch-polish UX track). TASK-004 → T1,
TASK-006 → T2. Shared widget files → sequential (D1). Governance: L-002 promoted to
CONTEXT.md (count 2); TD-002/003/004 flagged for re-review (≥3 sprints, none high).

### 2026-07-06 | G2 | Test-harness approach noted
No widget render harness exists (`api.test.ts` only, `environment: node`). To avoid a
network-gated dep install (L-002 lesson), branding logic is extracted to a pure
`branding.ts` and unit-tested in the node env; schema/server guarantees use existing
harnesses. A11y *behavior* (focus trap/Escape) will be verified via Lighthouse + manual
keyboard (implement-direct + note manual step); static a11y attrs are what Lighthouse scores.

### 2026-07-06 | T1 | Done — custom branding via config (all DoD [x])
Branding threaded core schema (`BrandingConfigSchema`/`ThemeTokensSchema`, both `.strict()`)
→ `public-config` (public-safe map) → widget `types` → `element.ts` (theme tokens applied as
`--kenalin-*` on host) + `app.tsx` (logo/avatar `<img>` with K-mark fallback). Powered-by
footer stays unconditional; strict schema rejects any hide-field (D2). Pure `branding.ts`
helper unit-tested. `pnpm verify` green (91 tests: core 34 · widget 8 · server 49); widget
14.6 KB gz (budget 60).

## Files Changed
<!-- Filled during execution; feeds CHANGELOG at close. -->

| File | Task | Change (WHY) | Risk | Test |
|------|------|--------------|------|------|
| `packages/core/src/config/schema.ts` | T1 | `BrandingConfigSchema` + `ThemeTokensSchema` (strict) | Low | `branding.test.ts` |
| `packages/server/src/public-config.ts` | T1 | Expose branding (public-safe) via `toPublicConfig` | Low | `public-config.test.ts` |
| `packages/widget/src/types.ts` | T1 | Mirror `branding` on widget `PublicConfig` | Low | typecheck |
| `packages/widget/src/branding.ts` | T1 | New: pure theme→CSS-var + avatar resolver | Low | `branding.test.ts` (widget) |
| `packages/widget/src/element.ts` | T1 | Apply theme tokens as `--kenalin-*` on host | Low | build |
| `packages/widget/src/app.tsx` | T1 | Render logo/avatar `<img>` w/ K-mark fallback | Low | size + verify |
| `packages/widget/src/styles.ts` | T1 | `.brandimg` fills badge/avatar square | Low | size |

## Retro
<!-- Written at close. Route buckets to durable homes (DOCS_Guide §10). -->

**Retrieval check** — _(fill at close)_

**Worked**
- _(fill at close)_

**Friction**
- _(fill at close)_

**Pattern candidate**
- _(fill at close)_
