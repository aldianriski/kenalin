# Contributing to Kenalin

Thanks for your interest! Kenalin is an embeddable AI introduction layer for
portfolio and professional websites. This guide gets you productive fast.

## Setup

Requirements: Node ≥ 20 and pnpm 11.

```bash
pnpm install
pnpm build
pnpm verify   # the gate you must pass before a PR (see below)
```

## Project layout

```
packages/core            pure TS: schemas, config, orchestrator, policies, interfaces (zero I/O)
packages/server          Hono API, Gemini provider, local index, ingest CLI (all I/O here)
packages/widget          embeddable Preact Web Component (< 60 KB gz)
packages/create-kenalin  the `npx create-kenalin` scaffold
content/demo             fictional demo owner for dev + evals
docs/                    PRD, architecture, decisions (ADRs), config reference
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the dependency rules and
[`.claude/CONTEXT.md`](.claude/CONTEXT.md) for conventions.

## The rules that get PRs rejected

These are hard constraints, enforced in review (and some by CI):

- **No owner-specific strings in `packages/*`.** Names, phone numbers, and personal
  URLs live only in `apps/*` config + `content/*`. There is a CI grep gate
  (`pnpm check:owner-strings`).
- **`core` stays pure** — zero I/O, zero Node-only APIs. All I/O lives in `server`.
- **Zod schemas are the single source of truth.** TS types are inferred; config
  docs are drift-checked against the schema (`pnpm check:config-doc`).
- **One orchestration pass per turn** — intent, answer, CTA, and complexity come
  from a single structured LLM call, never per-concern calls.
- **Safety policy is non-overridable.** Config adds persona flavor, never subtracts
  a safety guarantee.
- **Secrets only via env** (`KENALIN_LLM_API_KEY`, `KENALIN_WEBHOOK_SECRET`).

## Before you open a PR

1. `pnpm verify` is green (owner-string gate + config-doc gate + typecheck + build + tests).
2. New behavior has tests. New config fields are documented (the gate enforces it).
3. Commits use `type(scope): summary` (e.g. `fix(widget): …`).
4. Keep the widget under its 60 KB gzip budget (`pnpm --filter @kenalin/widget size`).

## Reporting bugs / requesting features

Use the issue templates. For security issues, please **do not** open a public
issue — contact the maintainers via the [Code of Conduct](CODE_OF_CONDUCT.md)
contact instead.

By contributing you agree your work is licensed under the repository's MIT license.
