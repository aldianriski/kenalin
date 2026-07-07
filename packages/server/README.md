# @kenalin/server

Server package of [Kenalin](https://github.com/aldianriski/kenalin) — the embeddable
AI introduction layer for portfolio and professional websites.

The **only** package with I/O. A [Hono](https://hono.dev) app exposing `/api/chat`
(SSE) and `/api/config/public`, the concrete Gemini chat + embedding provider, the
local JSONL knowledge index, the lead/webhook store, and the `kenalin` **ingest CLI**.
Implements the interfaces defined in
[`@kenalin/core`](https://www.npmjs.com/package/@kenalin/core).

```bash
npm install @kenalin/server
```

Ingest a knowledge index from your content:

```bash
npx kenalin ingest --config kenalin.config.ts --root .
```

Secrets are env-only (`KENALIN_LLM_API_KEY`, `KENALIN_WEBHOOK_SECRET`) — never in
config files. See the [main README](https://github.com/aldianriski/kenalin#readme).

## License

MIT
