---
sprint: 008
slug: portfolio-polish-round-3
owner: Tech Lead
last_updated: 2026-07-07
status: closed
plan_commit: 20d860c
close_commit: 553051b
update_trigger: sprint execute/close events
---

# SPRINT-008 — Portfolio polish (round 3)

> **Theme:** Six more fixes from live inspection — mobile full-screen, fullscreen
> coverage, Chrome-style window controls, launcher alignment to the host dock, and the
> headline feature: the widget recolors to match the site's **code/product persona**.
> Ran inline (clarify → implement → verify live).

## Fixes (all done + verified live)

- **#1 Mobile full-screen** — the mobile breakpoint was 480px, so phones 480–768px didn't go full-screen. Raised to 768px (matches the site's `md` dock breakpoint). Verified at 510px: panel full-screen.
- **#2 Fullscreen coverage** — `.panel.full` now covers the whole viewport (`inset:0; 100vw; 100dvh`), no gap.
- **#3 Chrome-style controls** — maximize = square, restore = two offset squares, minimize = dash (was corner-arrows).
- **#4 Desktop align** — launcher `offsetY: 32px` = the desktop dock's `bottom-8` level.
- **#5 Mobile align** — launcher `offsetYMobile: 14px` = level with the mobile dock's dots row (was floating 84px above).
- **#6 Persona-mode recolor** — new `branding.modes` (per-mode theme overrides). The widget observes `<html data-mode>` and applies `theme + modes[mode]`, clearing stale vars on switch. Portfolio: **code mode → forest green `#21C45D`** (header, launcher, send, accents), product → blue. Verified live: toggling `data-mode` flips blue↔green.

## Owner-action checklist
- [ ] Merge the portfolio branch `sprint/portfolio-ux-answer-quality` (now `e761dc5`, SPRINT-006+007+008) → `main`, `next build`, deploy (TASK-041).

## Files Changed

| Area | Change |
|------|--------|
| `core/config/schema.ts` | `branding.modes` (per-mode ThemeTokens) |
| `server/public-config.ts` | surface `modes` |
| `widget/element.ts` | `applyTheme` (base+mode merge) + observe `data-mode`; renamed followHostTheme→followHost |
| `widget/icons.tsx` | Chrome-style maximize/restore |
| `widget/styles.ts` | mobile breakpoint 480→768; `.panel.full` full coverage |
| portfolio config | `modes.code` green, `offsetY`/`offsetYMobile`, re-vendor (commit `e761dc5`) |

pnpm verify green (**120 tests**).

## Retro

**Retrieval check** — No miss/contradiction. Reused L-012 (embed observes host theme) — extended the same observer to `data-mode` for persona recolor. L-004 (Chrome-MCP probes) again the primary verification.

**Worked** — The host-signal-observer pattern (L-012) generalized cleanly from theme→persona: one MutationObserver on `<html>` now drives both `data-theme` and `data-mode`. Live probes confirmed the green swap without needing a real device.

**Friction** — `resize_window` still can't force a phone viewport (verified `#1` at whatever width the window happened to be, 510px — enough to prove the 768 breakpoint). A stray orphaned dev server on :3000 returned 500 and briefly masked the real server on :3001 — check the actual bound port in the dev log.

**Pattern candidate** (→ `docs/LEARNINGS.md`, count 1)
- **L-013** — a Shadow-DOM widget can follow ANY host persona/mode signal (not just theme) by observing a `data-*` attribute on `<html>`; expose per-signal overrides in config rather than hard-coding.

**Buckets routed** — Shipped → CHANGELOG [0.5.0]; Tech debt → TD-012 still open (per-mode-per-theme accentText); Follow-ups → TASK-041 (merge/deploy); Learnings → L-013.
