# Reference implementation — aldianrizki.com (RIZVA)

The Kenalin reference deployment (PRD Part F) does **not** live here as a
standalone app. Per the owner's decision, it is integrated directly into the real
production portfolio (a separate Next.js 15 repo) as:

- a **vendored engine bundle** — `packages/server` built via `pnpm --filter
  @kenalin/server run build:embed` (`dist/kenalin-engine.js`), copied into the
  portfolio's `lib/kenalin/`;
- **Next.js route handlers** wrapping the engine (`/api/chat` SSE + `/api/config/public`);
- the **`<kenalin-ai>` widget** (`packages/widget` → `public/kenalin.js`), mounted
  in the portfolio's locale layout;
- an owner-specific `kenalin.config.ts` (persona RIZVA) + `profile.json` + the
  ingested `content/**` — **none of which live in `packages/*`** (FR-1, enforced
  by `scripts/check-owner-strings.mjs`).

The integration proves FR-1: the reusable engine ships zero owner-specific
strings; everything about Aldi lives in config + content in the host app.

See the host app's `lib/kenalin/README.md` for the ingest command, environment,
and re-vendoring steps.
