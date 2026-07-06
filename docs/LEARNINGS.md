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

## L-003 [tags: build, tooling] [status: active]: Rebuild workspace `dist` before measuring — eval/tests import deps from `dist`, not `src`
- seen: Sprint-002
- count: 1
- promoted: no
- related: —

`pnpm eval` (and package tests) import `@kenalin/server` / `@kenalin/core` from their built
`dist`, not source. After editing the orchestrator/provider I ran the eval and saw the tuning
"not working" (thinking still present) — it was a stale `dist`; only core had been rebuilt. A
direct API probe (thinkingBudget 833→0) proved the lever worked, then `pnpm build` before
re-running showed the real result. Rebuild the packages you changed before trusting a live
measurement, or you measure the old code path.

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
