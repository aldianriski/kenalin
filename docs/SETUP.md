---
owner: Tech Lead
last_updated: 2026-07-06
update_trigger: Install steps, environment variables, or dev tooling changed
status: current
---

# Kenalin — Setup

## Prerequisites

- Node.js ≥ 20 — https://nodejs.org
- pnpm ≥ 11 — https://pnpm.io (`corepack enable` or `npm i -g pnpm`)
- A Google Gemini API key — https://aistudio.google.com/apikey

## Install

```bash
git clone https://github.com/aldianriski/kenalin
cd kenalin
pnpm install
cp .env.example .env      # then add your Gemini key (see Environment Variables)
```

If pnpm reports ignored build scripts for `esbuild`, they are pre-approved in
`pnpm-workspace.yaml` (`allowBuilds`); re-run `pnpm install` to execute them.

## Build

```bash
pnpm build                # build all packages (core → server → widget)
pnpm --filter @kenalin/core run build   # build a single package
```

## Test

```bash
pnpm test                 # run all package unit suites (Vitest)
pnpm --filter @kenalin/core run typecheck   # type-only check
```

## Configure & run (per phase)

The engine is driven entirely by `kenalin.config.ts` (copy from
`kenalin.config.example.ts`). Content ingestion, the API server, and the widget
build land in later phases — see [`PRD.md`](PRD.md) Part G for the phase plan and
each phase's Definition of Done. Available now:

```bash
pnpm ingest               # build the local knowledge index  (Phase 1)
pnpm --filter @kenalin/server run dev   # run the API server  (Phase 2)
pnpm eval                 # run the scenario eval matrix      (Phase 6)
```

## Environment Variables

Secrets live only in `.env`, never in config files or client payloads (PRD §D10).

| Variable | Required | Description |
|:---------|:---------|:------------|
| `KENALIN_LLM_API_KEY` | yes | Gemini key for chat + embeddings. Falls back to `GEMINI_API_KEY` / `API_KEY`. |
| `KENALIN_WEBHOOK_SECRET` | no | HMAC secret for signing outbound webhook payloads (`X-Kenalin-Signature`). Required only if a handoff webhook is configured. |
| `PORT` | no | Server port (default 8787). |
