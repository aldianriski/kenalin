# @kenalin/core

Pure-TypeScript core of [Kenalin](https://github.com/aldianriski/kenalin) — the
embeddable AI introduction layer for portfolio and professional websites.

This package is **runtime-agnostic** (zero I/O, zero Node-only APIs — runs on Node,
Vercel, and Workers). It owns the canonical Zod schemas (the data contracts), the
config loader, the module registry, the single-pass orchestrator, the prompt builder,
the safety policies, and the provider/store **interfaces**. Concrete I/O
implementations live in [`@kenalin/server`](https://www.npmjs.com/package/@kenalin/server).

```bash
npm install @kenalin/core
```

Most adopters don't install this directly — scaffold a project with
`npx create-kenalin <name>` instead. See the
[main README](https://github.com/aldianriski/kenalin#readme) for the full picture.

## License

MIT
