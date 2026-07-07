# Capturing the demo assets (hero GIF + screenshots)

Runbook for producing the README demo visuals against the **demo owner** (Sari
Wibowo / NARA) — owner-agnostic, safe to publish. Do this in a real browser
(a human can time the capture; automated headless capture is unreliable — see the
note at the bottom).

## Servers

```bash
# 1. Build the widget
pnpm --filter @kenalin/widget build

# 2. API on :8787 (demo owner, prebuilt index, key from .env)
pnpm --filter @kenalin/server exec jiti src/dev-server.ts \
  --config content/demo/kenalin.config.ts --root . --index content/index
#   (needs a Gemini key in .env: KENALIN_LLM_API_KEY / API_KEY_GEMINI)

# 3. Static host on :5173 (an allowed CORS origin for the demo)
#    serve the repo root, then open /examples/plain-html/index.html
npx serve -l 5173 .
```

Open <http://localhost:5173/examples/plain-html/index.html>.

## Shots to capture → `assets/img/`

| File | What | How |
|------|------|-----|
| `demo-hero.gif` | launcher → open → ask "Tell me about the QuickHub project" → answer + evidence card → a handoff prompt | screen-record the flow |
| `demo-light.png` | open panel, opening message + quick-action cards | light theme |
| `demo-dark.png` | same, dark | toggle OS dark (or set `data-theme="dark"` on `<html>` — the widget follows it, L-012) |
| `demo-mobile.png` | full-screen panel on mobile | device toolbar / a real phone (≤768px → `position.mobile: fullscreen`) |

Then reference them in `README.md` (replace/augment the logo hero) and commit
under `assets/img/`.

## Note — why not automated

The widget answer is a **word-by-word SSE pseudo-stream** (TD-003). Under headless
CDP automation it pins the renderer long enough to time out screenshots (30–45s),
and device-metric emulation for the mobile shot isn't exposed by the browser tool.
A human-timed capture (record, then interact) sidesteps both. Resolving TD-003
(real token streaming) would also make this automatable.
