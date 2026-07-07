# Kenalin Roadmap

A living, public view of where Kenalin is headed — the same **Now / Next / Later**
framing as the [live demo](https://kenalin.vercel.app). Priorities shift with
feedback: open an issue or discussion to weigh in.

## Now — shipped & live

- **v0.1–v0.6** — MVP through launch hardening and OSS release: single-pass
  orchestration, seven toggleable modules, real retrieval over your own content,
  bilingual (id/en) chat, a non-overridable safety policy, Upstash-backed
  rate-limiter + usage, token/context budgets, cost tuning, and a themeable
  embeddable widget.
- **Published** — `@kenalin/{core,server,widget}` + `npx create-kenalin` on npm.
- **Adoption** — config reference (drift-checked against the Zod schema), Next.js +
  plain-HTML integration guides, and a hosted **keyless demo** at
  [kenalin.vercel.app](https://kenalin.vercel.app).

See [`docs/CHANGELOG.md`](docs/CHANGELOG.md) for the detail.

## Next — in progress

- **Explicit context caching** — cut cost/latency on longer conversations.
- **Structured, graph-aware knowledge** — typed/linked knowledge so multi-hop
  questions pull connected evidence (beyond flat-chunk RAG).
- **Real token streaming** — lower time-to-first-token vs. the current pseudo-stream.
- **Widget resilience & test harness** — a fallback launcher when config is
  unreachable (shipped), plus render/a11y regression coverage.

## Later — exploring

- **A learning loop** — improve retrieval/answers from real conversations, within
  the no-PII safety constraints.
- **No-code config studio** — edit persona, modules, actions, and theme without code.
- **More model providers** — Anthropic and OpenAI adapters behind the existing
  `ChatProvider` / `EmbeddingProvider` interfaces.
- **pgvector / Postgres knowledge store** — for corpora beyond ~10³ chunks.
- **Ingestion improvements** — richer frontmatter mapping, incremental/scheduled
  re-index, PII redaction on briefs.

## Out of scope (by design)

Multi-agent orchestration, hard MCP dependency, CRM, SaaS multi-tenancy, and any
pricing/quotation output. Kenalin introduces a person's work and routes serious
conversations to a human — it does not quote or sell.

<sub>Doc owner: Tech Lead · last updated: 2026-07-07 · status: current</sub>
