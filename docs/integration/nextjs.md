---
owner: Tech Lead
last_updated: 2026-07-07
update_trigger: The @kenalin/server API surface or widget embed contract changes
status: current
---

# Integrate Kenalin — Next.js (App Router)

> Mount the Kenalin API inside your Next.js app as a Route Handler, and embed the
> widget in your layout. This mirrors the reference portfolio integration, using
> the published `@kenalin/server` + `@kenalin/widget` packages.

## 1. Install

```bash
npm install @kenalin/server @kenalin/widget
```

Add a `kenalin.config.ts` at the project root (see
[create-kenalin](../../packages/create-kenalin) for a starting point and
[CONFIG.md](../CONFIG.md) for every field). Put `KENALIN_LLM_API_KEY` in your
environment (`.env.local` locally; project env vars on Vercel).

## 2. Build the knowledge index

Kenalin retrieves from a local index built by the ingest CLI. Run it in your
build (so the index ships with the deployment):

```jsonc
// package.json
{
  "scripts": {
    "ingest": "kenalin ingest --config kenalin.config.ts --root .",
    "build": "npm run ingest && next build"
  }
}
```

## 3. Mount the API (Route Handler)

Delegate a catch-all API route to the Hono app. The app already owns
`/api/chat`, `/api/config/public`, `/api/usage`, and `/healthz`.

```ts
// app/api/[[...route]]/route.ts
import { loadConfig } from "@kenalin/core";
import { buildAppDeps, createApp } from "@kenalin/server";
import rawConfig from "@/kenalin.config";

export const runtime = "nodejs"; // needs Node APIs (fs for the index)

let appPromise: ReturnType<typeof build> | undefined;
async function build() {
  const config = loadConfig(rawConfig); // validate + apply defaults
  const deps = await buildAppDeps(config, {
    rootDir: process.cwd(),
    indexDir: "content/index",
  });
  return createApp(deps);
}
function getApp() {
  return (appPromise ??= build());
}

export async function POST(req: Request) {
  return (await getApp()).fetch(req);
}
export const GET = POST; // /api/config/public, /healthz
```

The incoming path (`/api/chat`) matches what the Hono app expects, so no rewrite
is needed.

## 4. Embed the widget

```tsx
// app/layout.tsx
import Script from "next/script";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="https://unpkg.com/@kenalin/widget/dist/kenalin.js"
          data-api-url={process.env.NEXT_PUBLIC_SITE_URL ?? ""}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
```

Set `data-api-url` to your site origin (or leave `""` for same-origin relative
calls). Add that origin to `server.allowedOrigins` in your config.

## Notes

- **Runtime** — the API route must run on the Node runtime (`export const runtime = "nodejs"`), not Edge — the local index reads the filesystem.
- **Cross-instance cache/limiter** — set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` for a shared rate-limiter/usage counter across serverless instances (otherwise in-memory per-instance).
- **Theming a themed host** — the widget follows the host's `data-theme` / `data-mode` on `<html>`; configure per-mode colors with `branding.modes` ([CONFIG.md](../CONFIG.md#branding--imagery--theme-optional)).
