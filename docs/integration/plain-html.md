---
owner: Tech Lead
last_updated: 2026-07-07
update_trigger: The widget embed contract or /api surface changes
status: current
---

# Integrate Kenalin — plain HTML (`<script>` embed)

> The framework-agnostic path: one `<script>` tag on any page, pointed at a
> running Kenalin API. Fully runnable from
> [`examples/plain-html`](../../examples/plain-html/index.html).

## 1. Run the API

Kenalin needs a server exposing `/api/chat` + `/api/config/public`. The fastest
path is to scaffold one:

```bash
npx create-kenalin my-site
cd my-site && npm install
cp .env.example .env      # add KENALIN_LLM_API_KEY
npm run ingest            # build the knowledge index
npm run dev               # http://localhost:8787
```

## 2. Embed the widget

Drop this on any page and point `data-api-url` at your API origin:

```html
<script
  src="https://unpkg.com/@kenalin/widget/dist/kenalin.js"
  data-api-url="http://localhost:8787"
  defer
></script>
```

The script auto-registers and mounts the `<kenalin-ai>` custom element in the
bottom corner. To place it yourself, add the element explicitly:

```html
<kenalin-ai></kenalin-ai>
```

## 3. Theme it (optional)

The widget is Shadow-DOM isolated; theme it from the host via `--kenalin-*` CSS
variables on `:root` (or configure `branding.theme` server-side — see
[CONFIG.md](../CONFIG.md#brandingtheme)):

```css
:root {
  --kenalin-accent: #2563eb;
  --kenalin-radius: 14px;
}
```

## Notes

- **CORS** — the page's origin must be in `server.allowedOrigins`
  ([CONFIG.md](../CONFIG.md#server)). For same-origin embeds (page served by the
  Kenalin host), add that origin.
- **Version pinning** — pin the widget: `…/@kenalin/widget@0.6.0/dist/kenalin.js`.
- **Self-hosting** — instead of the CDN, copy
  `node_modules/@kenalin/widget/dist/kenalin.js` into your assets and reference it
  locally.
