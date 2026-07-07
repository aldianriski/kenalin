---
sprint: 007
slug: portfolio-polish-round-2
owner: Tech Lead
last_updated: 2026-07-07
status: closed
plan_commit: e811df5
close_commit: [set post-commit]
update_trigger: sprint execute/close events
---

# SPRINT-007 — Portfolio polish (round 2)

> **Theme:** Eight fixes from the owner's live inspection of the deployed widget —
> evidence duplication, cross-intent repetition, header controls, brand identity
> (name/icons/logo), host theme sync, and mobile sizing. Engine gains owner-agnostic
> knobs; the portfolio supplies values. Ran inline (clarify → implement → verify).

## Scope

**In:** evidence de-dup (#1) · stronger anti-repetition (#2) · fullscreen toggle + Home→chip (#3) · drop RIZVA in UI (#4) · chat launcher icon (#5) · robot header logo (#6) · theme follows host light/dark (#7) · mobile full-screen (#8).
**Out:** further de-emphasis of the role in non-role intents (→ TASK-044, needs-info); per-mode brand theme tokens (TD-012 → TASK-043).

## Fixes (all done + verified)

- **#1 Evidence de-dup** — ingest gave same-named files in different locale dirs a colliding id (`md:basename`); now uses the path-relative id and derives `projectId` from `slug`. Orchestrator de-dups retrieved evidence by projectId, preferring the conversation language (`dedupeByProject` in core). Verified: "projects" turn returns GBU once, all `/en/`, 0 duplicate project keys.
- **#2 Anti-repetition** — prompt now forbids repeating prior info + re-summarizing the owner's role/company across intents. Answers are topic-distinct (projects turn ≠ hiring turn). Eval 49/49. *Residual:* a hiring turn still legitimately leads with the CTO role (relevant to hiring, first mention in-conversation) → TASK-044 if further de-emphasis wanted.
- **#3 Header** — fullscreen expand/restore toggle in the header (desktop; hidden on mobile); Home moved to a conversation "Home" chip (keeps history, re-shows the grid). Verified live.
- **#4 Name** — `assistant.name` = "Aldi's AI assistant"; opening message no longer says RIZVA; launcher stays "Ask Aldi". Verified.
- **#5/#6 Marks** — built-in `IconChat` + `IconRobot` + `BrandMark`; `branding.marks {launcher, header}` selects logo|chat|robot without hosted assets. Portfolio: launcher=chat, header=robot. Verified live (chat badge, robot avatar).
- **#7 Theme sync** — the widget mirrors the host `<html>` `dark` class / `data-theme` onto its own `data-theme` via a MutationObserver; added `:host([data-theme=light])`. Verified live: flipping the site theme flips the chat section.
- **#8 Mobile full-screen** — portfolio `position.mobile: fullscreen`; launcher still clears the dock via `offsetYMobile`.

## Owner-action checklist
- [ ] Merge the portfolio branch `sprint/portfolio-ux-answer-quality` (now `46860f8`, SPRINT-006 + 007) → `main`, `next build`, deploy (TASK-041).
- [ ] (optional) TASK-044 — decide whether hiring/role-adjacent answers should omit the CTO-role restatement.

## Files Changed

| Area | Change |
|------|--------|
| `core/retrieval/scoring.ts` (+test) | `dedupeByProject` (language-preferred project de-dup) |
| `core/config/schema.ts` | `branding.marks` (logo\|chat\|robot) |
| `core/prompt/builder.ts` | stronger anti-repetition rule |
| `server/ingest/sources/markdown.ts` (+test) | path-relative unique id; projectId from slug |
| `server/orchestrator/orchestrator.ts` | de-dup retrieved evidence before the prompt slice |
| `server/public-config.ts` | surface `marks` |
| `widget/{icons,app,styles,element,i18n,types}` | chat/robot marks, fullscreen toggle, Home chip, host-theme sync |
| portfolio `D:\Project\portofolio` | config (name/marks/mobile) + re-vendor + re-ingest (commit `46860f8`) |

pnpm verify green (**120 tests**); eval 49/49 (100%, safety 100%).

## Retro

**Retrieval check** — No miss/contradiction. Applied L-002 (env/key), L-004 (Chrome-MCP Shadow-DOM probes), L-007 (vendored-bundle smoke), L-010 (re-ingest after ingest change). The #1 id-collision was invisible to unit tests but surfaced by real inspection — reinforces L-004/L-010.

**Worked** — Clarify-first (4 questions) then a single implement→verify pass; the browser probe caught that the id-collision was a real correctness bug (not just cosmetic), and that a persisted session showed stale pre-change copy (a good reminder that persistence hides config changes for returning visitors).

**Friction** — `resize_window` wouldn't shrink the viewport to a phone width (verified mobile CSS by construction instead); the anti-repetition ask (#2) is inherently soft — "relevant role mention" vs "repetition" is a judgment call, left tunable via TASK-044.

**Pattern candidate** (→ `docs/LEARNINGS.md`, count 1)
- **L-011** — deriving a chunk id from the file basename collides across parallel dirs (en/id same filename); use a path-relative id.
- **L-012** — a Shadow-DOM widget embedded in a themed host must observe the host's theme mechanism (class/attr), not just `prefers-color-scheme`.

**Buckets routed** — Shipped → CHANGELOG [0.4.0]; Tech debt → TD-012 open (→ TASK-043); Follow-ups → TASK-017 **resolved**, TASK-041 (merge/deploy), TASK-044 (role de-emphasis, needs-info); Learnings → L-011, L-012.
