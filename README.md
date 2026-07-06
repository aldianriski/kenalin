<a id="readme-top"></a>

# Kenalin — your AI introduction

> An open-source, plug-and-play, embeddable AI assistant that turns a static
> portfolio or professional website into a guided, evidence-based conversation.

Kenalin answers visitor questions about a site owner — who they are, what they've
built, what expertise is relevant — always backed by curated public evidence, and
routes meaningful intent (hiring, business opportunity) to a human via configured
channels (WhatsApp, email, calendar, webhook). One `<script>` tag or Web Component.
One config file. **No database required for a fresh install.**

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
- A Google Gemini API key (chat `gemini-2.5-flash` + embeddings `text-embedding-004`).

## Adopt

```bash
git clone https://github.com/aldianriski/kenalin
cd kenalin
pnpm install
cp .env.example .env          # add your Gemini key as KENALIN_LLM_API_KEY
pnpm build
```

Full setup: [`docs/SETUP.md`](docs/SETUP.md)

## Usage

Configure `kenalin.config.ts` (start from `kenalin.config.example.ts`), point it at
your content, ingest, then embed the widget on any page.

| Command / entry point | When |
|---|---|
| `pnpm build` | Build all packages (`core`, `server`, `widget`) |
| `pnpm ingest` | Build the local knowledge index from your configured sources¹ |
| `pnpm test` | Run the unit test suites |
| `pnpm eval` | Run the scenario eval matrix against the demo owner¹ |
| `<script src=".../kenalin.js">` | Embed the assistant on any host page¹ |

¹ Arrives in a later build phase — see the phase plan in [`docs/PRD.md`](docs/PRD.md) Part G.

## Project status

Built phase-by-phase against the canonical spec in [`docs/PRD.md`](docs/PRD.md).
Current phase is pinned in [`CLAUDE.md`](CLAUDE.md). Phase 0 (Foundation — schemas,
config, interfaces, module registry) is complete and green.

## Links
- [Architecture](docs/ARCHITECTURE.md)
- [Decisions](docs/DECISIONS.md)
- [Setup](docs/SETUP.md)
- [PRD & implementation blueprint](docs/PRD.md)

## License
MIT — see [LICENSE](LICENSE).

<sub>Doc owner: Tech Lead · last updated: 2026-07-06 · status: current</sub>
