# {{projectName}}

A [Kenalin](https://github.com/aldianriski/kenalin) assistant — an embeddable AI
introduction layer for your portfolio or professional site.

## Quickstart

```bash
npm install
cp .env.example .env      # then add your Gemini API key
npm run ingest            # build the knowledge index from content/
npm run dev               # serve the API + demo page on http://localhost:8787
```

Open <http://localhost:8787> and click the launcher to chat.

## Make it yours

1. **`kenalin.config.ts`** — your name, assistant persona, modules, handoff channels.
2. **`content/`** — one Markdown file per case study (see `content/case-studies/`).
   Re-run `npm run ingest` after editing.
3. **Embed on your real site** — copy the `<script>` tag from `public/index.html`
   onto any page and point `data-api-url` at your deployed API.

## Layout

| Path | What it is |
|------|------------|
| `kenalin.config.ts` | The one file you edit — persona, modules, handoff, theme. |
| `content/` | Your knowledge sources (Markdown), ingested into a local index. |
| `server.mjs` | Minimal host wiring `@kenalin/server` (API) + the demo page. |
| `public/index.html` | Demo page embedding `@kenalin/widget`. |

Docs: <https://github.com/aldianriski/kenalin#readme>
