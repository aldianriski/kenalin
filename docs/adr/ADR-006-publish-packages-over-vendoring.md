# ADR-006 — Publish `@kenalin/*` to npm instead of vendoring built bundles

- **Status:** accepted (2026-07-07)
- **Deciders:** Tech Lead
- **Context driver:** OSS adoption — the current "copy a built bundle into your app" model is the single biggest barrier to someone trying Kenalin, and forces re-vendoring on every release (TD-004).

## Context

Kenalin is being professionalized as an open-source product (SPRINT-009, v0.6). Today the
only way to consume the engine is to **manually vendor built bundles**: run
`pnpm --filter @kenalin/server run build:embed` → copy `dist/kenalin-engine.js` into the
host app's `lib/`, and copy the widget's `dist/kenalin.js` into the host's `public/`. The
`examples/` reference local built-file paths; nothing installs a package.

Measured blast radius: **2 vendored bundles** copied into the external portfolio
(`kenalin-engine.js` + `kenalin.js`), re-copied on every release; **3 packages** already
`@kenalin/*`-scoped and versioned in lockstep (0.5.3), non-private, with `files:["dist"]`
allowlists — so they are structurally close to publishable. The remaining blockers are
mechanical: `workspace:*` cross-refs (server→core, widget→core), a missing
`publishConfig.access:public`, the widget's absent `types`/`exports`, and no release
automation. This is the right time because the adoption push (README, Quickstart, guides)
is meaningless without a real `install` path to point at.

## Decision

Publish `@kenalin/{core,server,widget}` to npm under the **public `@kenalin` scope**, and
ship `npx create-kenalin <name>` to scaffold a runnable project that installs those
versioned packages. Adopters install semver-versioned packages; they no longer vendor
built bundles. The reference portfolio migrates from the vendored bundle to the published
package (resolving TD-004). Packages remain three separate artifacts (core / server /
widget), not one meta-bundle.

## Consequences

**Positive:** adopters get `npm install @kenalin/*` / `npx create-kenalin` instead of a
copy-paste ritual; no manual re-vendoring per release; a semver contract makes upgrades
legible; the portfolio consumes a version range instead of a stale copied file.

**Negative (trade-offs accepted):** we take on **real release discipline** — a coordinated
version bump across three packages, `workspace:*`→version rewriting at pack time, a
changelog, and `publishConfig.access:public`. A **published public package name and API is
hard to reverse** (you cannot cleanly rename or unpublish once adopted), and consumers are
now pinned to a semver contract we must not break casually. Ownership of the `@kenalin` npm
scope + an `NPM_TOKEN` becomes an operational dependency (owner-gated).

## Alternatives considered

| Option | Why rejected |
|---|---|
| Keep vendoring built bundles | The status quo that TD-004 flags: forces re-vendor per release, no version story, hostile DX for adopters. |
| One bundled meta-package (`kenalin`) | Collapses the core/server/widget boundary — `core` must run in any runtime, `widget` is browser-only, `server` is Node/I/O. A monolith can't respect those runtime lines and bloats every consumer. |
| Template repo / git submodule only | No versioning and still a manual sync; `create-kenalin` over a *published* package gives a genuine install path plus a scaffold, which a template repo alone does not. |
