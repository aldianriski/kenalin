---
sprint: 009
slug: oss-professionalization
owner: Tech Lead
last_updated: 2026-07-07
status: closed
plan_commit: fbafe3f
close_commit: b584768
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
- [x] Published to npm under the `@kenalin` scope — **`@kenalin/{core,server,widget}@0.6.0` + `create-kenalin@0.6.0` are live** (verified: `npx create-kenalin@0.6.0` from the registry scaffolds a project referencing the published packages)
- [ ] TD-004 marked resolved → TASK-022 — *unblocked; resolves when the portfolio migrates from the vendored bundle to `@kenalin/*@0.6.0` (follow-up)*
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
- [x] Quickstart uses the T1 scaffold path (`npx create-kenalin`) end to end
- [x] Each step (scaffold, key, ingest, run) run from a clean dir — *(`npx create-kenalin@0.6.0` from the **registry** verified: scaffolds a project referencing `@kenalin/*@^0.6.0`; the generated `npm install`/`ingest`/`dev` chain now resolves against the published packages. A real chat turn needs the owner's Gemini key.)*
- [x] Env/secret step names the real var (`KENALIN_LLM_API_KEY`) and the runtime source it's read from
- [x] Links to the config reference (T2) and integration guides (T4)

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

**DoD:** — **Built keyless + deployed** (`examples/vercel-demo/`). Owner supplied the Vercel connection + wanted it keyless, so instead of needing published packages + a Gemini key, the demo bundles everything and runs offline (hash retrieval + a grounded deterministic responder).
- [x] Demo app deployed + **LIVE and interactive** at `https://vercel-demo-mu-seven.vercel.app` — self-referential (owner=Kenalin, assistant "Kai"), knowledge = docs about Kenalin; every quick action + follow-up chip returns grounded info with an evidence card. Verified live: `/api/config/public` 200, `/api/chat` 200 (~0.6s) grounded, launcher mounts in-browser. *(Reframed from a persona demo per owner feedback; fixed the Vercel 504/routing bugs — see the T5 fix log.)*
- [ ] Deploy-to-Vercel button in the README — **deferred**: a git-clone Deploy button can't build the keyless-vendored demo (artifacts are prebuilt locally; Vercel doesn't build it) and there's no Gemini env to prompt for. Revisit as the `create-kenalin` clone path once packages publish.
- [x] A test deploy reaches a working chat turn — *(bundled function verified end-to-end: config/public 200, grounded chat with evidence cards)*
- [x] Demo uses the demo owner only; no portfolio/owner content — *(fictional Sari Wibowo; `content/demo`)*

**How built:** `src/handler.ts` = `createApp` with `HashEmbeddingProvider` + `FakeChatProvider(demoResponder)` over a prebuilt hash index, exported via `hono/vercel`; esbuild bundles core+server+hono+zod+index into `api/[...path].mjs` (self-contained, `createRequire` banner for CJS `node:*` requires); polished `public/index.html` + vendored widget. Deployed with `package.json` excluded (its `workspace:*` devDeps broke Vercel's `npm install`).

### T6 — Visual README showcase `[size: M · risk: low]`
Layers: `README.md` + committed `assets/`.
Lead the README with a hero GIF + screenshots of the widget (demo owner) covering the
full journey, plus status badges. The visual front-door that makes the value legible in
five seconds.

**Acceptance:** the README opens with a hero GIF + screenshots and a badge row; assets are committed and render on GitHub.

**DoD:**
- [ ] Hero GIF: launcher → chat → evidence cards → handoff (demo owner) — **owner-action: human-timed capture** (headless CDP freezes on the SSE stream — L-014; runbook at `assets/CAPTURE.md`)
- [ ] Screenshots: light + dark; mobile full-screen; code/product mode (green vs blue) — *(light + dark verified live against the demo widget; not committable this session — `save_to_disk` didn't land in a reachable path; mobile needs device emulation; code/product is portfolio-specific, out of the demo)* → **owner-action** per `assets/CAPTURE.md`
- [x] Badges: npm version (from T1), CI, bundle-size (<60 KB), license — *(added; bundle-size corrected to measured 18.7 KB gz)*
- [ ] Assets committed under `assets/`; README renders correctly on GitHub; no owner strings — *(README renders with the existing logo hero; demo GIF/screenshots are the owner-action above)*
<!-- QA: capture GIF/screenshots via Chrome-MCP against the demo widget (L-004 pattern). -->

### T7 — Community / repo hygiene `[size: S · risk: low]`
Layers: repo root + `.github/`.
The files that make a repo contributable and discoverable.

**Acceptance:** a new contributor finds CONTRIBUTING, templates, a CoC, a roadmap, and a clear repo description/topics.

**DoD:**
- [x] `CONTRIBUTING.md` (setup → `pnpm verify` → PR flow) + `CODE_OF_CONDUCT.md` — *(CoC maintainer contact is an owner placeholder)*
- [x] `.github/` issue templates + PR template — *(bug/feature YAML forms + config + PR template)*
- [x] A public roadmap section (link the v0.4 scale track + this v0.6 track) — *(`ROADMAP.md`; README link lands in T6)*
- [ ] Sharp GitHub repo description + topics set (owner-gated for the GitHub settings)

## Owner-action checklist
<!-- Non-dev, human-only. -->
- [x] npm: **PUBLISHED** `@kenalin/{core,server,widget}@0.6.0` + `create-kenalin@0.6.0` (2026-07-07). Took a token with bypass-2FA **and** no IP allowlist (the IP-restricted tokens couldn't `whoami`/publish from this env) + the `@kenalin` org created.
- [ ] Follow-up: migrate the reference portfolio from the vendored bundle to `@kenalin/*@0.6.0` (resolves TD-004).
- [ ] Vercel: **disable Deployment Protection** on the `vercel-demo` project (Settings → Deployment Protection → Vercel Authentication → Disable, or protect Preview only) to make the demo public. It's deployed + working, just SSO-gated.
- [ ] After publish: verify `npx create-kenalin` from the registry runs a real chat turn; migrate the portfolio to the package (resolves TD-004)
- [ ] GitHub: set the repo description + topics (repo-admin only) — T7
- [ ] Set the CoC maintainer contact in `CODE_OF_CONDUCT.md` — T7
- [ ] Capture + commit the demo hero GIF + light/dark/mobile screenshots to `assets/img/` (human-timed) — T6, runbook: `assets/CAPTURE.md`

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

### 2026-07-07 | T5 | Demo LIVE + interactive; reframed to Kenalin-about-Kenalin — b82602e
Owner disabled Deployment Protection. Reframed the demo per feedback: introduces **Kenalin itself** (owner=Kenalin, assistant "Kai", knowledge = Kenalin docs), custom Kenalin-topic quick actions, and follow-up chips after every answer → fully button-driven. **Fixed the reason the widget never showed**: on Vercel, `hono/vercel` `handle` + streaming SSE → `FUNCTION_INVOCATION_TIMEOUT` (504), and the `[...path]` catch-all only matched single-segment paths (404 on `/api/config/public`). Rewrote as a plain Node `(req,res)` handler over Vercel's parsed `req.body`, SSE returned in one shot; `vercel.json` rewrite funnels `/api/*` → `api/index`. Verified live (config 200, chat 200 grounded, launcher mounts). Headline set to "Meet Kenalin AI Assistant".

### 2026-07-07 | T1 | PUBLISHED to npm ✅
`@kenalin/{core,server,widget}@0.6.0` + `create-kenalin@0.6.0` published. The publish needed a token with **bypass-2FA AND no IP allowlist** — the earlier tokens failed (`E403` 2FA, then `E404`/`whoami` `E403` from an IP-restricted token) — plus the freshly-created `@kenalin` org. Verified `npx create-kenalin@0.6.0` from the registry scaffolds a project against the published packages. Unblocks T3's registry path, the README npm badge, and TD-004 (portfolio migration = follow-up).

### 2026-07-07 | T5 | Keyless demo BUILT + deployed to Vercel — 1fee246
Owner unblocked it (Vercel connected + "keyless" requirement). Built `examples/vercel-demo/`: `createApp` with `HashEmbeddingProvider` + `FakeChatProvider(demoResponder)` over a prebuilt hash index → esbuild-bundled self-contained Vercel function (createRequire banner fixed a CJS `node:os` require), polished landing + vendored widget. Verified end-to-end (grounded QuickHub/hiring/business answers with evidence, intent, handoff). Deployed to Vercel prod (READY) after two fixes: explicit `--scope`, and excluding `package.json` (its `workspace:*` devDeps failed Vercel's `npm install`). **Live but SSO-gated** — Deployment Protection is on; public access is an owner toggle. Also attempted the npm publish (T1): blocked by the token's 2FA requirement (owner needs an automation/bypass-2FA token).

### 2026-07-07 | T5 | (superseded) Owner-gated plan — now built above

### 2026-07-07 | T6(assets) | Live demo verified; capture blocked headless → runbook + L-014
Drove the demo widget live via Chrome-MCP (demo API :8787 + static :5173, both from the demo owner). **Verified working:** widget mounts, opening message + 4 quick-action cards render, light theme, and **dark theme correctly follows the host `data-theme`** (L-012/L-013) — captured both visually. **Blocked:** the hero GIF + a live "answer + evidence" shot repeatedly froze the renderer (SSE word-by-word pseudo-stream, TD-003 → 30–45s CDP timeouts); mobile-fullscreen needs device emulation the tool doesn't expose; and `save_to_disk` captures didn't land in a shell-reachable path, so none are committable. Filed **L-014**, wrote `assets/CAPTURE.md` (human-timed runbook), moved GIF+screenshots to owner-action. README keeps its existing logo hero (renders fine).

### 2026-07-07 | T3 + T6(badges) | Quickstart + README wiring — 5d527b7
`README.md`: create-kenalin Quickstart (T3) with a from-source fallback; npm + CI badges added and the stale widget-size badge corrected to the measured 18.7 KB gz; wired CONFIG.md, integration guides, ROADMAP, CONTRIBUTING. T3 dev-complete (full clean-checkout run is post-publish, same gate as T1).

**Remaining cluster (interactive / owner-gated):** T5 deployable demo app + Deploy-to-Vercel button (deploy owner-gated on a Vercel project + demo Gemini key) and T6 hero GIF + screenshots (Chrome-MCP capture, owner-approved). Checkpointed here to give the browser session fresh context budget.

### 2026-07-07 | T4, T7 | Integration guides + repo hygiene — 06e68ff, ff2ccfe
**T4** (`06e68ff`): `docs/integration/plain-html.md` (backed by the runnable `examples/plain-html`) + `docs/integration/nextjs.md` (mount `createApp` in an App Router catch-all route via `app.fetch`, widget in layout, mirroring the reference portfolio). Confirmed `loadConfig`/`createApp`/`buildAppDeps` are surfaced by the published packages. Next.js runtime proof is the reference portfolio (external); plain-HTML is locally runnable.
**T7** (`ff2ccfe`): CONTRIBUTING (hard rules + PR gate), CODE_OF_CONDUCT (Covenant 2.1), `.github` issue forms + PR template, public ROADMAP. Owner-gated: GitHub description/topics + CoC contact.

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
| `docs/integration/{plain-html,nextjs}.md` | T4 | two embed guides (published packages) | Low | plain-html backed by example |
| `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `ROADMAP.md`, `.github/**` | T7 | community + hygiene | Low | links resolve |
| `README.md` | T3/T6 | Quickstart + npm/CI/size badges + doc links | Low | rendered |
| `assets/CAPTURE.md` + `docs/LEARNINGS.md` (L-014) | T6 | demo-asset runbook + capture finding | Low | n/a |
| `examples/vercel-demo/**` | T5 | keyless bundled demo (Fake+Hash) + Vercel deploy | Med | live + bundled-fn smoke |

## Retro

**Outcome:** T1–T5 + T7 delivered; T6 badges/wiring done with demo assets deferred (owner-timed capture). v0.6.0 **published to npm** and a keyless demo **live** on Vercel.

**Retrieval check** — no prior `L-NNN`/ADR contradicted. L-007 (verify the shipped artifact) proved its worth: the demo passed every local test yet the widget was dead in production (Vercel 504/routing) — caught only by curling the live URL (→ L-015).

**Worked**
- Recon-first (two `Explore` agents) mapped publish-readiness + the schema before any code.
- Field-coverage drift gate (`check-config-doc`) — cheap, robust, non-fragile vs. a full generator.
- Keyless demo via `FakeChatProvider` + hash index — a real, cost-free, secret-free playground.
- Committing per-task kept state durable across a very long, multi-turn sprint.

**Friction**
- npm publish took 3 token/org iterations (→ L-016).
- Vercel raw-function quirks (POST-body hang, catch-all, no SSE streaming) — local-green ≠ prod (→ L-015).
- Headless capture of the streaming widget repeatedly froze (→ L-014).
- The demo went through 3 reframes (persona → generic persona → Kenalin-about-Kenalin) on owner feedback — clarify the demo's *subject* up front next time.

**Buckets routed**
- **Shipped** → `docs/CHANGELOG.md` [0.6.0].
- **Learnings** → **L-015** (Vercel raw function), **L-016** (npm publish token/org). L-014 filed earlier.
- **Tech debt** → **TD-013** (demo fake responder), **TD-014** (Vercel no-SSE-stream), **TD-015** (manual demo build/deploy). TD-004 unblocked.
- **Follow-ups** → **TASK-051** (portfolio→`@kenalin/*@0.6.0`, resolves TD-004), **TASK-052** (GitHub description/topics + CoC contact); TASK-045 (demo GIF/screenshots) carried.
