# create-kenalin

Scaffold a new [Kenalin](https://github.com/aldianriski/kenalin) project — the
embeddable AI introduction layer for portfolio and professional websites.

```bash
npm create kenalin@latest my-site
# or
npx create-kenalin my-site
```

This generates a runnable project:

```
my-site/
  kenalin.config.ts        # the one file you edit
  content/case-studies/    # your knowledge sources (Markdown)
  server.mjs               # minimal @kenalin/server host
  public/index.html        # demo page embedding @kenalin/widget
```

Then:

```bash
cd my-site
npm install
cp .env.example .env       # add your Gemini API key
npm run ingest
npm run dev                # http://localhost:8787
```

See the [main README](https://github.com/aldianriski/kenalin#readme) for
configuration, theming, and deployment.

## License

MIT
