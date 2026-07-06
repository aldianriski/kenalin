<a id="readme-top"></a>

<div align="center">

<img src="assets/img/logo_with_tag.png" alt="Kenalin — your AI introduction" width="440" />

<br />

**An open-source, plug-and-play, embeddable AI assistant that turns a static portfolio into a guided, evidence-based conversation.**

[![License: MIT](https://img.shields.io/badge/License-MIT-22B8A7.svg)](LICENSE)
[![Widget](https://img.shields.io/badge/widget-13.5_KB_gz-0F2742.svg)](packages/widget)
[![Powered by Gemini](https://img.shields.io/badge/LLM-Gemini-22B8A7.svg)](docs/adr/ADR-003-gemini-sole-mvp-provider.md)
[![No database](https://img.shields.io/badge/database-optional-0F2742.svg)](docs/adr/ADR-004-stateless-no-db-default.md)

</div>

---

Kenalin answers visitor questions about a site owner — who they are, what they've
built, what expertise is relevant — always backed by curated public evidence, and
routes meaningful intent (hiring, business opportunity) to a human via configured
channels (WhatsApp, email, calendar, webhook). **One `<script>` tag. One config
file. No database required for a fresh install.**

## What It Is
- **Evidence-first** — every claim about the owner is grounded in curated public
  knowledge with source links; no evidence → it says so, it never fabricates.
- **Guided, not open-ended** — infers intent per turn and routes toward a useful
  next action (portfolio discovery, hiring, light lead qualification, human handoff).
- **Plug-and-play** — configure behavior in `kenalin.config.ts`; embed one script.
  No core edits, no backend team, one API key (Gemini free tier covers the MVP).
- **Self-hosted & portable** — `core` runs in any JS runtime; `server` deploys to
  Node, Vercel, or Workers. Your data stays in your infrastructure.

## What It Is Not
- Not a generic ChatGPT/customer-service widget, and never impersonates the owner.
- Not an autonomous sales agent, CRM, or multi-tenant SaaS — the webhook is the boundary.
- Never states prices, claims availability, or invents URLs (see [safety policy](docs/PRD.md#b9-safety-requirements-non-overridable-policy-set)).

## Requirements
- Node.js ≥ 20 and pnpm ≥ 11 (monorepo).
- A Google Gemini API key (chat `gemini-2.5-flash` + embeddings `gemini-embedding-001`).

## Adopt

```bash
git clone https://github.com/aldianriski/kenalin
cd kenalin
pnpm install
cp .env.example .env          # add your Gemini key as KENALIN_LLM_API_KEY
pnpm build
```

Full setup: [`docs/SETUP.md`](docs/SETUP.md)

## Embed

```html
<!-- one tag, anywhere on the page -->
<script src="/kenalin.js" data-api-url="https://your-site.example" defer></script>
```

The `<kenalin-ai>` Web Component mounts a Shadow-DOM-isolated assistant, themeable
via CSS custom properties on the element. See the [design system](docs/DESIGN.md).

## Usage

| Command / entry point | When |
|---|---|
| `pnpm build` | Build all packages (`core`, `server`, `widget`) |
| `pnpm ingest` | Build the local knowledge index from your configured sources |
| `pnpm verify` | Owner-string gate + typecheck + build + tests |
| `pnpm eval` | Run the scenario eval matrix (PRD Part H) |
| `<script src=".../kenalin.js">` | Embed the assistant on any host page |

## Architecture

A modular pnpm monorepo with one stateless orchestration flow:

```
packages/core     pure TS — schemas, config, orchestrator, prompt, policies, interfaces
packages/server   Hono API, Gemini providers, local index, ingest CLI  (all I/O here)
packages/widget   Preact Web Component + <script> embed  (talks only to /api/chat)
```

More: [Architecture](docs/ARCHITECTURE.md) · [Decisions (ADRs)](docs/DECISIONS.md) · [Design system](docs/DESIGN.md) · [PRD](docs/PRD.md)

## Brand

<div align="center">

| | |
|---|---|
| **Navy** `#0F2742` | **Teal** `#22B8A7` |
| **Soft teal** `#8DE2D4` | **Amber** `#D99A2B` |

</div>

Type: **Inter**. The full system — colors, type scale, icon set, component library,
and interaction cues — lives in [`assets/design/guideline.png`](assets/design/guideline.png)
and is documented in [`docs/DESIGN.md`](docs/DESIGN.md).

## License
MIT — see [LICENSE](LICENSE).

<sub>Doc owner: Tech Lead · last updated: 2026-07-06 · status: current</sub>
