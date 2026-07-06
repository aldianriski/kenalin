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
- [ ] `branding` config: optional `logoUrl`/`avatarUrl` (validated) + theme preset and/or CSS-token overrides; schema rejects unknown/unsafe fields.
- [ ] `/api/config/public` exposes branding (no secrets); widget renders logo/avatar + applies theme tokens via CSS custom properties.
- [ ] "Powered by Kenalin" footer always rendered; **no** config field can hide/remove it (assert in a test).
- [ ] Default (no branding set) is visually unchanged from today (K-mark + current theme).
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

## Files Changed
<!-- Filled during execution; feeds CHANGELOG at close. -->

| File | Task | Change (WHY) | Risk | Test |
|------|------|--------------|------|------|
| _(pending execution)_ | | | | |

## Retro
<!-- Written at close. Route buckets to durable homes (DOCS_Guide §10). -->

**Retrieval check** — _(fill at close)_

**Worked**
- _(fill at close)_

**Friction**
- _(fill at close)_

**Pattern candidate**
- _(fill at close)_
