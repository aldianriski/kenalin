# Kenalin — hosted keyless demo

A self-contained, **keyless** Kenalin playground (fictional demo owner "Sari
Wibowo"), deployable to Vercel. Retrieval is real (hash embedder over a prebuilt
index); answers come from a deterministic **grounded responder** instead of an
LLM — so it runs with **no Gemini key, no cost, no secrets**, while still showing
real evidence cards, intent routing, and handoff.

> A real deployment swaps `FakeChatProvider(demoResponder)` for the Gemini
> provider (`buildAppDeps` with a key) for genuine conversation.

## How it works

- `src/handler.ts` — assembles the real Kenalin Hono app (`createApp`) with
  `HashEmbeddingProvider` + `FakeChatProvider(demoResponder)` over a bundled
  hash index, and exports a Vercel handler via `hono/vercel`.
- `src/responder.ts` — reads the evidence the retriever placed in the system
  prompt and answers from it (template + snippet), with keyword intent detection.
- `build.mjs` — esbuild bundles the handler (core + server + hono + zod + the
  index, all inlined) into `api/[...path].mjs`, and vendors the widget into
  `public/kenalin.js`. The deploy has **no** workspace/npm dependency.
- `public/index.html` — a landing page that embeds the widget (same origin).

## Build + deploy

Run the build **locally** (it needs the workspace to bundle), then deploy the
prebuilt files (Vercel does not build or install):

```bash
# from the repo root: build the widget + a HASH index for the demo owner
pnpm --filter @kenalin/widget build
pnpm --filter @kenalin/server exec jiti src/cli.ts ingest \
  --config content/demo/kenalin.config.ts --root . \
  --out examples/vercel-demo/.build/index --embedder hash

# then, in this dir:
node build.mjs                    # → src/chunks.json, api/[...path].mjs, public/kenalin.js
vercel deploy --prod --yes        # add --scope <team> in non-interactive shells
```

## Public access

New Vercel projects enable **Deployment Protection** (Vercel Authentication),
which gates the URL behind SSO. To make the demo public, disable it:
**Project → Settings → Deployment Protection → Vercel Authentication → Disable**
(or set it to protect Preview only). This is a security/access-control setting —
review before disabling.
