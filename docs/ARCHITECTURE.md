---
owner: Tech Lead
last_updated: 2026-07-06
update_trigger: Layer added, dependency rule changed, or major refactor
status: current
---

# Kenalin — Architecture

> Modular monorepo with one stateless orchestration flow: a pure `core` engine,
> a thin I/O `server`, and a self-contained `widget`. Structured output + modular
> policies — no multi-agent, no per-concern LLM calls.

## Dependency Rule

`widget → server → core` · `apps → core` · nothing depends back on `server`/`widget`.

- **`packages/core`**: pure TS, zero I/O, zero Node-only APIs. Owns the canonical
  Zod schemas (data contracts), config loader, module registry, orchestration
  logic, prompt builder, policies, and provider/store **interfaces**. Depends on
  nothing but `zod`. Must run in any JS runtime.
- **`packages/server`**: the only place with I/O. A Hono app exposing `/api/chat`
  (SSE), `/api/config/public`, and analytics/webhook emit; the concrete Gemini
  provider + local knowledge index + lead store; the `ingest` CLI. Depends on `core`.
- **`packages/widget`**: a Preact Web Component + `<script>` embed, Shadow-DOM
  isolated. Talks only to `/api/chat` and `/api/config/public` over HTTP — no core
  import at runtime. Ships as a single file, budgeted < 60 KB gzip.
- **`apps/*`**: owner-specific config + content only (e.g. `reference-aldi`). Zero
  core edits — this is the proof of config-driven behavior (PRD FR-1).

## Directory Structure

```
/packages/
  /core/     # schemas, config, module registry, orchestrator, prompt, policy, interfaces
  /server/   # Hono app, Gemini provider, local index, lead store, ingest CLI  (I/O lives here)
  /widget/   # Preact Web Component + script embed  (talks only to /api/chat)
/apps/
  /reference-aldi/   # aldianrizki.com integration — config + content only
/examples/   # plain-html (framework-agnostic) · custom-ui (headless API)
/content/demo/   # deterministic fictional owner for dev + evals
/evals/      # scenario YAML + runner (hits the orchestrator directly)
/docs/       # PRD + lean docs
```

Three packages is the floor and the ceiling for the MVP — no further fragmentation.

## Request flow (one turn)

`widget → POST /api/chat (SSE)` → server embeds the query → `KnowledgeStore.search`
(topK, metadata boosts, cosine threshold) → **single** orchestration pass (core
prompt + enabled-module fragments + persona + retrieved evidence + config actions)
→ `ChatProvider.generate` with structured output → policy validators (URL allowlist,
currency block, evidence-id check) → schema-validated `ChatResponse` streamed back.
The server is stateless (PRD FR-7): everything derives from the request payload;
`ConversationState` round-trips client↔server each turn.

## Key Integration Points

| System | Purpose | Location in code |
|:-------|:--------|:-----------------|
| Google Gemini (chat + embeddings) | LLM generation & vectors | `packages/server` (implements `ChatProvider`/`EmbeddingProvider` from `core`) |
| Local knowledge index (JSONL + vectors) | RAG retrieval, no vector DB | `packages/server` (implements `KnowledgeStore`) |
| Generic webhook (HMAC-signed) | Lead / handoff events out | `packages/server` (emits `WebhookEvent` from `core`) |
| Host website | Embed surface | `packages/widget` (Web Component + `<script>`) |

## Decision Records

See [`DECISIONS.md`](DECISIONS.md) (the ADR index) → `docs/adr/` for the decisions
behind this structure (single-pass orchestration, local index over vector DB,
Gemini as sole MVP provider, stateless no-DB default).
