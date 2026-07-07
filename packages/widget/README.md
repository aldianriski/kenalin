# @kenalin/widget

The embeddable widget for [Kenalin](https://github.com/aldianriski/kenalin) — the AI
introduction layer for portfolio and professional websites.

A self-contained Preact **Web Component** (Shadow-DOM isolated, single file, < 60 KB
gzip) that talks only to your `/api/chat` and `/api/config/public` endpoints. No core
import at runtime.

## `<script>` embed (most hosts)

```html
<script src="https://unpkg.com/@kenalin/widget/dist/kenalin.js"
        data-api-url="https://your-site.com" defer></script>
```

This auto-registers and mounts the `<kenalin-ai>` element. Theme it from the host via
`--kenalin-*` CSS variables.

## Programmatic (bundler hosts)

```ts
import { defineKenalinElement } from "@kenalin/widget";
defineKenalinElement();
```

See the [main README](https://github.com/aldianriski/kenalin#readme) for configuration,
theming, and framework integration guides.

## License

MIT
