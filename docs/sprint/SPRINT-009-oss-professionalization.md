---
sprint: 009
slug: oss-professionalization
owner: Tech Lead
last_updated: 2026-07-07
status: active
plan_commit: fbafe3f
close_commit: [sha — set at close]
update_trigger: sprint execute/close events
---

# SPRINT-009 — OSS professionalization (v0.6)

> **Theme:** Turn Kenalin from a working monorepo into a professional open-source
> product someone can *find, understand, install, run, and contribute to* without
> reading the source. This is the adoption layer: a published package, a visual
> front-door, generated config docs, integration guides, a hosted try-it demo, and
> community hygiene — all against the **demo** owner, never the portfolio.

## Scope

**In:** publish `@kenalin/{core,server,widget}` + `create-kenalin` scaffold · a config
reference generated from the Zod schema · a verified <5-min Quickstart · Next.js +
plain-HTML integration guides · a visual README (hero GIF + screenshots + badges) · a
hosted demo playground with a Deploy-to-Vercel button · community/repo hygiene files.

**Out (deferred):** the P0 portfolio release chain (TASK-032/033/041 — separate,
owner-blocked); v0.4 scale track (TASK-019 pgvector, TASK-020 provider adapters,
TASK-021 admin UI, TASK-023 ingestion); TASK-043 per-mode theme tokens; analytics
(TASK-015). **No owner-specific content** — everything here uses the demo owner.

## Plan

<!-- Dependency order: T1 (package) unblocks the install path every other task documents;
     T2 (config ref) feeds T3/T4; T5 (demo) needs the installable package; T6 (README badges)
     needs the published npm version + the demo URL; T7 is independent, grouped at the end. -->

### T1 — Publish `@kenalin/*` + `create-kenalin` scaffold `[size: L · risk: med]`
Layers: `packages/{core,server,widget}` package.json + build/publish config; new `create-kenalin` package; `apps/reference-aldi` (migrate off the vendored bundle — optional within this sprint).
Foundation for the whole track: adopters should `npm install` / `npx create-kenalin`
instead of vendoring a bundle (resolves TD-004). The scaffold must produce a runnable
project — config + example + ingest — not just files.

**Acceptance:** from a clean dir, `npx create-kenalin demo-app` produces a project that installs, ingests, and serves a working chat turn against the demo owner.

**DoD:**
- [x] `@kenalin/{core,server,widget}` build clean, publishable artifacts (types, exports map, `files` allowlist, `sideEffects`), versioned `0.6.0` — *(widget now emits `.d.ts`; core/server/widget bumped 0.5.3→0.6.0)*
- [x] Dry-run publish green for all three; owner-string grep gate still passes on the packed tarballs — *(`pnpm -r publish --dry-run`, not `npm` — npm can't resolve `workspace:*`; packed server tarball pins `@kenalin/core 0.6.0`)*
- [x] `create-kenalin <name>` scaffolds config + one example + an ingest step *(built-bin scaffold verified: 9 files, name-substituted, dotfiles renamed; 6 vitest smokes)* — **the generated project runs a real chat turn locally is post-publish (installs `@kenalin/*` from the registry) → owner-gated**
- [ ] Published to npm under the `@kenalin` scope (owner-gated — see checklist)
- [ ] TD-004 marked resolved → TASK-022 *(resolves once the portfolio consumes the published package — post-publish)*
<!-- QA: create-kenalin scaffold-smoke test added (generate → assert files/name/deps). -->
<!-- T1 dev-complete; the 3 remaining items are the owner-gated publish tail. -->

Owner-gated tail (post `npm publish`): confirm `npx create-kenalin` from the registry produces a project that `npm install`s + runs a real chat turn; resolve TD-004 by migrating the portfolio to the package.

### T2 — Config reference doc, generated from the Zod schema `[size: M · risk: low]`
Layers: `packages/core/schemas` (config schema — source of truth); new `docs/CONFIG.md` (or `docs/config-reference.md`); a small generator/check script.
One page documenting every `kenalin.config.ts` field with type + default, **derived from
or checked against the Zod schema** so it cannot silently drift from the code.

**Acceptance:** `docs/CONFIG.md` lists every config field with type + default; a check step fails if the doc and the Zod schema diverge.

**DoD:**
- [x] Every top-level group covered: owner, assistant, branding {theme, modes, position, marks, icons}, modules, complexity, handoff, actions, knowledge, storage, analytics, qualification, server — *(79 fields; `docs/CONFIG.md`)*
- [x] Each field shows type + default + one-line purpose (WHAT/WHY, never HOW)
- [x] A generator or drift-check ties the doc to the schema — *(`scripts/check-config-doc.mjs` introspects `KenalinConfigSchema`, wired into `pnpm verify` after build)*
- [x] No owner-specific values in examples (demo owner only) — *(placeholder examples; owner-string gate green)*

### T3 — True <5-min Quickstart `[size: S · risk: low]`
Layers: `README.md` and/or `docs/SETUP.md`.
A copy-paste path proven from a **clean checkout**: scaffold → add key → `pnpm ingest`
→ run/deploy. Every step actually executed, not assumed.

**Acceptance:** a fresh clone following only the Quickstart reaches a working chat turn in under 5 minutes; each command verified.

**DoD:**
- [ ] Quickstart uses the T1 scaffold path (`npx create-kenalin`) end to end
- [ ] Each step (scaffold, key, ingest, run) run from a clean dir and confirmed working
- [ ] Env/secret step names the real var (`KENALIN_LLM_API_KEY`) and the runtime source it's read from
- [ ] Links to the config reference (T2) and integration guides (T4)

### T4 — Integration guides: Next.js + plain HTML `[size: S · risk: low]`
Layers: `examples/` (plain-html, custom-ui) + new guide docs; mirrors `apps/reference-aldi` for the Next.js path.
Two runnable guides — a Next.js embed (API routes + widget mount, mirroring the
reference portfolio) and a plain-HTML `<script>` embed — both buildable from `examples/`.

**Acceptance:** both guides are followed end to end and produce a working embedded widget from the `examples/` code.

**DoD:**
- [ ] Next.js guide: API route wiring + widget mount, mirroring the reference portfolio (no owner strings)
- [ ] Plain-HTML guide: `<script>` embed against `/api/chat`, runnable from `examples/plain-html`
- [ ] Both cite the config reference (T2); both verified to boot a real chat turn
- [ ] Guides live in the core doc set (README links / `docs/`), not orphan files

### T5 — Hosted demo playground + Deploy-to-Vercel button `[size: M · risk: med]`
Layers: a deployable demo app (demo owner) + `README.md` deploy button + `vercel.json` / deploy-button env spec.
A public try-it demo (demo owner) plus a one-click Deploy-to-Vercel button that
provisions a working install and prompts for the Gemini key.

**Acceptance:** the hosted demo answers a real grounded chat turn; the README button deploys a working install prompting only for the Gemini key.

**DoD:**
- [ ] Demo app (demo owner, populated index) deployed to a public URL; a real `/api/chat` turn answers grounded
- [ ] Deploy-to-Vercel button in the README provisions the server with an env prompt for `KENALIN_LLM_API_KEY`
- [ ] A test deploy from the button reaches a working chat turn (owner-gated — see checklist)
- [ ] Demo uses the demo owner only; no portfolio/owner content

### T6 — Visual README showcase `[size: M · risk: low]`
Layers: `README.md` + committed `assets/`.
Lead the README with a hero GIF + screenshots of the widget (demo owner) covering the
full journey, plus status badges. The visual front-door that makes the value legible in
five seconds.

**Acceptance:** the README opens with a hero GIF + screenshots and a badge row; assets are committed and render on GitHub.

**DoD:**
- [ ] Hero GIF: launcher → chat → evidence cards → handoff (demo owner)
- [ ] Screenshots: light + dark; mobile full-screen; code/product mode (green vs blue)
- [ ] Badges: npm version (from T1), CI, bundle-size (<60 KB), license
- [ ] Assets committed under `assets/`; README renders correctly on GitHub; no owner strings
<!-- QA: capture GIF/screenshots via Chrome-MCP against the demo widget (L-004 pattern). -->

### T7 — Community / repo hygiene `[size: S · risk: low]`
Layers: repo root + `.github/`.
The files that make a repo contributable and discoverable.

**Acceptance:** a new contributor finds CONTRIBUTING, templates, a CoC, a roadmap, and a clear repo description/topics.

**DoD:**
- [ ] `CONTRIBUTING.md` (setup → `pnpm verify` → PR flow) + `CODE_OF_CONDUCT.md`
- [ ] `.github/` issue templates + PR template
- [ ] A public roadmap section (link the v0.4 scale track + this v0.6 track)
- [ ] Sharp GitHub repo description + topics set (owner-gated for the GitHub settings)

## Owner-action checklist
<!-- Non-dev, human-only. -->
- [ ] npm: create/own the `@kenalin` scope + provide an `NPM_TOKEN` (publish auth) — blocks T1 publish
- [ ] Vercel: a project + a demo Gemini key for the hosted demo — blocks T5 deploy
- [ ] GitHub: set the repo description + topics (repo-admin only) — T7

## Decisions (pre-locked)
- **D1** — Adopters consume published `@kenalin/*` packages; the portfolio migrates off the vendored bundle (resolves TD-004). Trade-off: adds a semver/release step vs. copy-vendoring. **→ [ADR-006](../adr/ADR-006-publish-packages-over-vendoring.md)** (accepted 2026-07-07).
- **D2** — The config reference is generated from / drift-checked against the Zod schema, never hand-authored — consistent with the project's "Zod is the single source of truth" rule.
- **D3** — Every showcase, demo, example, and guide uses the **demo** owner only; the CI owner-string grep gate stays green (no "Aldi"/"TemiDev"/personal URLs in `packages/*` or the OSS surface).

## Assumptions
- **A1** — The `@kenalin` npm scope is available/claimable. *Confirm: npm registry check + owner.*
- **A2** — The demo owner's knowledge index is rich enough for a compelling GIF (evidence cards, handoff). *Confirm: build the demo index + drive the widget locally before recording.*
- **A3** — A Deploy-to-Vercel button can provision the server package with a single env prompt. *Confirm: the Vercel deploy-button env spec + one test deploy.*

## Execution Log
<!-- Append-only, dated. Plan frozen at promote. -->

### 2026-07-07 | promote | Plan locked
SPRINT-009 promoted from the TODO Backlog (OSS professionalization v0.6, full 7-task track). Governance review clean: no `count ≥ 2` learnings to promote; no `high`-severity tech debt to escalate (TD-002/003/004 flagged as ≥3-sprints-old but carried); TODO at 119 lines (under the soft cap). Tasks ordered by dependency (package → docs → demo → README → hygiene).

### 2026-07-07 | T2 | Config reference + drift gate — 740c2c6
`docs/CONFIG.md` documents all **79** schema fields (type + default + purpose), including the branding sub-groups, `server.model` tuning knobs, and the three `superRefine` cross-field rules. `scripts/check-config-doc.mjs` walks `KenalinConfigSchema` (built `@kenalin/core`, unwrapping ZodDefault/Optional/Effects/Array/Record) and fails `pnpm verify` if any field path is undocumented → the doc can't drift on field coverage. Decided a field-coverage gate over a fragile full-render generator (types/defaults stay hand-maintained). Verify green.

### 2026-07-07 | T1 | Dev-complete (publish-prep + create-kenalin) — cfcb089, d5c2f34
**T1a** (`cfcb089`): all three packages made publishable — `publishConfig.access:public`, widget `.d.ts` emit + `types`/`exports`/`module`/CDN entries + precise `sideEffects`, repo metadata, per-package READMEs, root `release`/`release:dry`. Verified `pnpm -r publish --dry-run` green and that pnpm rewrites `workspace:*`→`@kenalin/core 0.6.0` in the packed tarball; owner-string gate clean on tarballs; `pnpm verify` green.
**T1b** (`d5c2f34`): new `create-kenalin` package (`npx create-kenalin <name>` → runnable template: config + case-studies + `@kenalin/server` host + `@kenalin/widget` demo page). Pure `scaffold()` + thin CLI; 6 vitest smokes + a real built-bin scaffold (9 files, name-substituted, dotfiles renamed, invalid-name rejected). Bumped everything to 0.6.0; gate extended to `create-kenalin/src`. **126 tests green.** Owner-gated tail: real `npm publish` + registry-install runtime smoke + TD-004 portfolio migration.

### 2026-07-07 | G1+G2 | Batch gates signed off
Recon (two `Explore` agents) established: packages already `@kenalin/*`/0.5.3/non-private with `files:["dist"]`; publish blockers are mechanical (`workspace:*` refs, no `publishConfig.access:public`, widget missing `types`/`exports`, no `sideEffects`). `create-kenalin` + config-doc generator are greenfield; no `zod-to-json-schema` dep (schema at `packages/core/src/config/schema.ts`, defaults inline via `.default()`). Three owner-gated halts confirmed: real `npm publish`, Vercel demo deploy, GitHub description/topics. **Decisions:** T1 (L) split → T1a prep / T1b scaffold; config generator = custom schema-walker (no new dep) + drift-check on the field set; README single-owner = T6 (serial edit order T3→T5→T7→T6); T6 assets captured live via Chrome-MCP; D1 recorded as ADR-006. Approach: take all 7 to dev-complete, halt at each owner gate.

## Files Changed
<!-- Filled during execution; feeds CHANGELOG at close. -->

| File | Task | Change (WHY) | Risk | Test |
|------|------|--------------|------|------|
| `packages/{core,server,widget}/package.json` | T1a | publishConfig.access:public, exports/types/module, sideEffects, repo metadata, 0.6.0 | Low | `pnpm -r publish --dry-run` + pack inspect |
| `packages/widget/package.json` + `build.mjs` flow | T1a | emit `.d.ts` (`tsc --emitDeclarationOnly`), unpkg/jsdelivr | Low | widget build + tarball file list |
| `packages/{core,server,widget}/README.md` | T1a | per-package npm README | Low | present in tarball |
| `package.json` (root) | T1a | `release`/`release:dry` scripts; 0.6.0 | Low | dry-run |
| `packages/create-kenalin/**` | T1b | new scaffold CLI + `templates/default/` | Med | 6 vitest + built-bin scaffold |
| `scripts/check-owner-strings.mjs` | T1b | gate now covers `create-kenalin/src` | Low | gate green |
| `docs/CONFIG.md` | T2 | config reference (79 fields, type+default+purpose) | Low | check-config-doc |
| `scripts/check-config-doc.mjs` + `package.json` | T2 | schema→doc drift gate wired into verify | Low | verify green |

## Retro
<!-- Written at close. Route buckets per DOCS_Guide §10. -->

**Retrieval check** — _pending close._

**Worked** — _pending._

**Friction** — _pending._

**Pattern candidate** — _pending._
