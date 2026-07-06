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
