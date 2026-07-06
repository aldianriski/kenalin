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

## L-002 [tags: deploy] [status: active]: Verify host secrets/env before a deploy smoke — don't assume the target repo inherited them
- seen: Sprint-001
- count: 1
- promoted: no
- related: —

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
