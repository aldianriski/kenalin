# Kenalin Roadmap

A living, public view of where Kenalin is headed. Priorities shift with feedback —
open an issue or discussion to weigh in.

## Shipped

- **v0.1–v0.5** — MVP through launch hardening: single-pass orchestration, seven
  toggleable modules, local knowledge index, bilingual (id/en) chat, safety
  policy layer, Upstash-backed rate-limiter + usage, cost tuning, and a themed
  embeddable widget. See [`docs/CHANGELOG.md`](docs/CHANGELOG.md).

## In progress — v0.6 · adoption & clear implementation flow

Making Kenalin easy to find, understand, install, and run.

- [x] Publishable `@kenalin/*` packages + `npx create-kenalin` scaffold
- [x] Config reference generated/drift-checked against the Zod schema
- [x] Next.js + plain-HTML integration guides
- [ ] Publish `@kenalin/{core,server,widget}` + `create-kenalin` to npm
- [ ] Hosted demo playground + one-click Deploy-to-Vercel
- [ ] Visual README (hero + screenshots + badges)
- [ ] Community hygiene (this file, CONTRIBUTING, templates)

## Next — v0.4 line · scale & extensibility

- **pgvector / Postgres knowledge store** for corpora beyond ~10³ chunks.
- **Additional provider adapters** (Anthropic, OpenAI) behind the existing
  `ChatProvider` / `EmbeddingProvider` interfaces.
- **Admin / config UI** — no-code editing of persona, modules, actions, and theme.
- **Ingestion improvements** — richer frontmatter mapping, incremental/scheduled
  re-index, PII redaction on briefs.
- **Real token streaming** and a widget behavior/a11y test harness.

## Out of scope (by design)

Multi-agent orchestration, hard MCP dependency, CRM, SaaS multi-tenancy, and any
pricing/quotation output. Kenalin introduces a person's work and routes serious
conversations to a human — it does not quote or sell.
