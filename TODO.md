---
owner: Tech Lead
last_updated: 2026-07-06
update_trigger: Sprint completed, task added, or task status changed
status: current
---

# Kenalin — Development Tracker

> **How to use this file**
> - **Session start** — read this + `CLAUDE.md` first; the Active Sprint is the current focus.
> - **Sprint promote/close** — `/lean-doc-generator promote` pulls Backlog tasks into a sprint file; `close` writes the retro.
> - **Sprint completed** — move its Changelog block to `docs/CHANGELOG.md`.
> - `src: you` = owner's note · `src: claude` = gap Claude flagged.

---

## Active Sprint

> **SPRINT-010 — Demo v2 + CI green** → [`docs/sprint/SPRINT-010-demo-v2-ci-green.md`](docs/sprint/SPRINT-010-demo-v2-ci-green.md) · promoted 2026-07-07 (T1 CI fix done + verified locally; T2 widget resilience, T3 icon align, T4 strengths+roadmap, T5 ship). SPRINT-001…009 archived → [`docs/sprint/archive/`](docs/sprint/archive/) · [`docs/sprint/INDEX.md`](docs/sprint/INDEX.md).

Status: `pnpm verify` green (**126 tests** + owner-string & config-doc gates) · widget 18.7 KB gz · **v0.6.0 PUBLISHED to npm** (`@kenalin/{core,server,widget}` + `create-kenalin`) · live demo at `https://vercel-demo-mu-seven.vercel.app` (target rename → `kenalin.vercel.app`). Demo landing page **redesigned** 2026-07-07 (frontend-design pass — self-typing intro hero, custom SVG icons, logo tile; verified light/dark in-browser) — **uncommitted, awaiting deploy** (TASK-053).

> **Backlog groomed 2026-07-07** (`/triage`). **Ready-to-promote → a "Go live" sprint:** TASK-053 (deploy redesign + `kenalin.vercel.app`) · TASK-041 (merge portfolio UX branch) · TASK-032 (portfolio prod smoke) · TASK-051 (portfolio → `@kenalin/*@0.6.0`) · TASK-045 (capture new-design visuals) · TASK-033 (Upstash REST env). Run `/lean-doc-generator promote` to form it.

---

## Backlog

### P0 — Critical / Blocking

- [ ] **TASK-055 — Fix CI: bump Node 20 → 22 (pnpm 11.9.0 needs ≥22.13)** [size: S] · src: claude · state: ready — CI red on every push since the pnpm bump: `ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite` + "pnpm requires Node.js v22.13". done-when: `ci.yml` + `eval.yml` pin `node-version: 22`, pushed, CI green. **Change made + `pnpm verify` green locally (Node 22.22.3); awaiting commit/push to confirm in CI.**
- [ ] **TASK-053 — Ship the redesigned demo + rename to `kenalin.vercel.app`** [size: S] [HITL] · src: claude · state: ready — from the 2026-07-07 frontend-design pass.
      done-when: `examples/vercel-demo/public/index.html` + the two `logo_*_nobg.png` committed; `vercel deploy --prod` live; Vercel project renamed **or** aliased to `kenalin.vercel.app` (owner action — subdomain must be free, else add a custom alias); `vercel-demo-mu-seven` URL strings updated repo-wide (TODO.md, docs). Note: the redesign is purely static (`public/`) — no rebuild needed. Verified locally: the widget launcher mounts over the new page when `/api/config/public` returns 200 (it renders nothing when config 404s — that is the "widget gone" locals see, not a regression).
- [ ] **TASK-032 — Confirm live production deploy + `/api/chat` smoke** [size: S] · src: claude · state: ready
      done-when: `www.aldianrizki.com/api/config/public` returns 200 and a real `/api/chat` turn answers grounded (the "404 mid-deploy" note was from a poll on 2026-07-07 — likely stale; the **demo** api verified 200 today, the **portfolio** api still needs a live check). If 404 persists: check Vercel Production Branch = `main` + build logs.
- [ ] **TASK-033 — Add Upstash REST env to the portfolio (cross-instance cache/limiter)** [size: S] · src: claude · state: ready
      done-when: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` set in the portfolio Vercel env (only `REDIS_URL` is set today → cache + rate-limiter run in-memory per-instance). Resolves TD-010.
- [ ] **TASK-041 — Merge + deploy the SPRINT-006 portfolio branch** [size: S] [HITL] · src: claude · state: ready — follow-up from SPRINT-006 T9.
      **Browser-visual pass DONE (2026-07-07)** against `next dev`: widget themed portfolio-blue (`#2563EB`), `--kenalin-pos-y-mobile:84px` + the `≤768px` launcher rule confirmed (clears the 68px dock), T3 answer evidence-led (QuickHub, no bio), evidence links → `/en/case-studies/…` + `/en/about`, Home preserved 3 rows + re-showed the grid, reload restored the full conversation. (Idle 60/30 timing is unit-tested only — not waited out live.)
      done-when: portfolio branch `sprint/portfolio-ux-answer-quality` (`4ef9334`) merged to `main`, full `next build` green, deployed to Vercel prod (overlaps TASK-032 live smoke).

### P1 — Next Phase (v0.2 — reliability & brand polish)

- [ ] **TASK-054 — Widget resilience: never silently vanish** [size: S] · src: claude · state: ready — created 2026-07-07 from the "widget gone" diagnosis. Today the launcher renders **nothing** if `GET /api/config/public` fails (`element.ts:90-93` → `return`), so any api hiccup makes the whole chat disappear with no signal. done-when: on config-fetch failure the element still mounts a launcher from a safe default config (or a one-line retry/console error), so a demo/prod never looks broken. Touches `packages/widget` + re-vendor the demo `kenalin.js`.
- [ ] **TASK-056 — Align quick-action icons (widget ↔ landing)** [size: M] · src: you · state: ready — created 2026-07-07. Landing "Try it now" chips use 4 distinct glyphs; the widget shows 4 identical bubbles (demo ids `what/cando/embed/oss` don't match `quickActionIcon()`, fall to default). done-when: set `branding.icons` (`quick:what|cando|embed|oss` → data-URI SVGs) in `examples/vercel-demo/src/kenalin.config.ts` so the widget renders the same 4 glyphs; use those identical glyphs on the landing chips; rebuild the demo bundle + re-vendor `kenalin.js` (no `packages/*` change — `toPublicConfig` already forwards `branding.icons`).
- [ ] **TASK-057 — Demo landing: strengths + roadmap sections** [size: M] · src: you · state: ready — created 2026-07-07. done-when: add a "Why Kenalin" strengths block (Easy to adopt · Fully customizable · Evidence-grounded · Private & self-hosted) and a **Now / Next / Later** roadmap. Now = shipped (real RAG retrieval, Redis/Upstash cache, token/context budgets, EN/ID). Next = context caching (TASK-026), structured knowledge (TASK-058). Later = learning loop (TASK-059). Public roadmap uses theme labels, not internal task ids.
- [ ] **TASK-043 — Per-mode widget theme tokens** [size: M] · src: claude · state: ready — promoted from P2 (2026-07-07 triage: design-relevant + resolves TD-012). done-when: `branding.theme` accepts light/dark values (or derives AA-safe mode variants from one brand color) so mode-sensitive tokens (accentText, bg, surface, text, border) can carry brand color without breaking either mode.

### P2 — Quality / Polish

- [ ] **TASK-009 — Lazy-loading skeleton placeholders** [size: S] · src: you — initial open, config fetch, evidence cards show skeletons.
- [ ] **TASK-010 — Premium micro-animations** [size: S] · src: you — message enter/stagger, typing, evidence reveal; respect `prefers-reduced-motion`.
- [ ] **TASK-014 — Real token streaming** [size: M] · src: claude — stream Gemini tokens for lower time-to-first-token vs the current word-by-word pseudo-stream. Resolves TD-003.
- [ ] **TASK-015 — Analytics module (PRD B11)** [size: M] · src: claude — emit engagement/intent/conversion events via webhook/console, off by default, no PII.
- [ ] **TASK-016 — Handoff brief enrichment** [size: S] · src: claude — capture the visitor's actual screening answers into the brief (values currently empty).
- [ ] **TASK-018 — Launcher unread badge** [size: S] · src: claude — minimize-to-badge with an unread count.
- [ ] **TASK-029 — Chips-based `intention` capture (UX/latency A/B)** [size: M] · src: you — closed-form tappable `intention` chips (name/purpose stay LLM-handled), measured as a latency/completion experiment, NOT a cost lever. The only safe residue of the cut TASK-028 (per ADR-005). Needs the widget behavior harness (TD-009) to test.
- [ ] **TASK-042 — Custom icon set for the portfolio** [size: S] · src: you · state: needs-info — the `branding.icons` mechanism shipped (SPRINT-006 T2) but no icons were supplied. done-when: owner provides hosted single-color SVG/PNG URLs (send, close, minimize, home, evidence, chart, quick:*, action:*); set `branding.icons` in the portfolio config + re-vendor if needed.
- [ ] **TASK-044 — De-emphasize the owner's role in non-role intents** [size: S] · src: you · state: needs-info — a hiring turn still leads with "Aldi is the Founding CTO of TemiDev" (relevant, but the owner flagged it as repetitive). done-when: decide + (if wanted) tune the prompt so role-adjacent intents lead with the specific ask rather than restating the current title. Judgment call — the role IS relevant to hiring.

### P3 — Long-term (v0.4 — scale & extensibility)

- [ ] **TASK-026 — Explicit Gemini context caching** [size: M] · src: claude · state: deferred — demoted P1→P3 (2026-07-07 triage: evaluated + parked). SPRINT-004 spike: works, ~3%/turn, net-marginal at low traffic. done-when: revisited at sustained >5 turns/hr where the storage economics flip positive.
- [ ] **TASK-027 — Enable the lite-model swap** [size: S] · src: claude · state: deferred — demoted P1→P3 (2026-07-07 triage). SPRINT-005: flash-lite ~35% cheaper but grounding/intent/conversation unstable (safety held). Capability config-gated. done-when: re-validate with a stronger lite model (multiple eval runs — L-006).
- [ ] **TASK-011 — Sound notification** [size: S] · src: you — demoted P2→P3 (2026-07-07 triage: lowest-value polish). Subtle chime on new assistant message; opt-in, muted by default.
- [ ] **TASK-019 — pgvector/Postgres KnowledgeStore** [size: L] · src: claude — for corpora beyond ~10³ chunks (ADR-002 P1).
- [ ] **TASK-020 — Anthropic + OpenAI provider adapters** [size: M] · src: claude — behind existing interfaces (ADR-003 P1).
- [ ] **TASK-021 — Admin / config UI** [size: L] · src: claude — no-code editing of persona/modules/actions/theme (completes TASK-004 end-to-end).
- [ ] **TASK-023 — Ingestion improvements** [size: M] · src: claude — map MDX frontmatter → type/projectId/url; incremental/scheduled re-index; PII redaction on briefs.
- [ ] **TASK-058 — Structured / graph knowledge retrieval** [size: L] · src: you · state: needs-info — created 2026-07-07 ("rag & okf structure"). Beyond flat-chunk RAG: typed/linked knowledge (entities + relations, graph-aware retrieval) so multi-hop questions pull connected evidence. Roadmap "Later". done-when: scoped (define "okf" — confirm graph vs typed-chunk direction) + spike.
- [ ] **TASK-059 — Conversation learning loop** [size: L] · src: you · state: needs-info — created 2026-07-07 ("learn process"). Capture which answers/evidence resolved intents and feed that back (retrieval reweighting or curated FAQ), so the assistant improves from real conversations. Roadmap "Later". done-when: scoped (privacy + no-PII constraints from PRD B9 hold) + design.

---

### P1 — OSS professionalization (v0.6 — adoption & clear implementation flow)

> Recorded 2026-07-07 from the "make Kenalin a professional open-source product" push.
> Goal: fast adoption + a clear implementation flow. Suggested SPRINT-009 order: TASK-045
> first (README visuals), then the chosen track. All owner-agnostic (demo content, not the portfolio).

> **SPRINT-009 closed** — done: TASK-022 (published `@kenalin/*@0.6.0` + `create-kenalin`), TASK-046 (live keyless demo — Deploy button deferred, see below), TASK-047 (Quickstart), TASK-048 (config ref + drift gate), TASK-049 (integration guides), TASK-050 (repo hygiene). Detail → [`docs/sprint/archive/SPRINT-009-oss-professionalization.md`](docs/sprint/archive/SPRINT-009-oss-professionalization.md).

- [ ] **TASK-045 — Visual README design showcase** [size: M] · src: you · state: **owner-action (carried)** — badges done in SPRINT-009; **remaining**: capture the **redesigned** demo hero GIF (the self-typing intro animation) + light/dark/mobile screenshots and commit under `assets/img/` (human-timed, runbook `assets/CAPTURE.md`; headless capture freezes — L-014). Depends on TASK-053 (deploy the redesign first). Demo target URL → `kenalin.vercel.app`.
- [ ] **TASK-051 — Migrate the portfolio to `@kenalin/*@0.6.0`** [size: M] · src: claude · state: ready — replace the vendored `kenalin-engine.js`/`kenalin.js` in the portfolio with `npm install @kenalin/{server,widget}@^0.6.0`. **Resolves TD-004.**
- [ ] **TASK-052 — Finish repo/community publishing** [size: S] · src: you · state: needs-owner — set the GitHub repo description + topics (repo-admin) and the CoC maintainer contact in `CODE_OF_CONDUCT.md`. Optionally: a `create-kenalin`-based "Deploy to Vercel" button once the scaffold path is confirmed on a fresh clone (the keyless demo can't be a git-clone Deploy target — artifacts are prebuilt).

## Tech Debt

- **TD-001** severity: medium | status: resolved → TASK-005 (Sprint-002) | created: Sprint-000 — Eval counts were 5/5/8/3. Expanded to 12/15/12/10 (49), 100% green id+en.
- **TD-002** severity: medium | status: open | created: Sprint-000 — Widget test coverage thin (only the SSE parser). done-when: component tests for app/message/evidence/chips render + click.
- **TD-003** severity: minor | status: open | created: Sprint-000 — Answer is pseudo-streamed word-by-word, not real token streaming. done-when: TASK-014.
- **TD-004** severity: minor | status: open → TASK-051 (unblocked: `@kenalin/*@0.6.0` published Sprint-009) | created: Sprint-000 — Portfolio still consumes a vendored bundle; migrate to `npm install @kenalin/*`. done-when: TASK-051.
- **TD-005** severity: medium | status: resolved → TASK-007 (Sprint-002) | created: Sprint-000 — Rate limiter is in-memory (per serverless instance). Redis-backed via Upstash; in-memory kept as fallback.
- **TD-006** severity: medium | status: resolved → TASK-007 (Sprint-002) | created: Sprint-001 — UsageTracker + per-session token budget were in-memory. Redis-backed via Upstash; cap holds cross-instance (verified w/ shared-FakeRedis test).
- **TD-007** severity: minor | status: resolved → TASK-005 (Sprint-002) | created: Sprint-001 — Gemini thinking-token overhead. Now config-controlled (`server.model.thinkingBudget`); disabled in demo — cost/turn −37%, quality green.
- **TD-008** severity: minor | status: open | created: Sprint-002 — The embedded `KenalinEngine` (`embed.ts`, vendored by the portfolio) stays in-memory/sync for limiter+usage — only the Hono `/api` path is Redis-backed (D4), so the vendored engine's counters remain per-instance. Also the Redis limiter is fixed-window (not the in-memory token bucket). done-when: move the embed engine to the shared Redis store (needs an async `KenalinEngine` API rev) if per-instance counting there becomes a problem.
- **TD-009** severity: minor | status: open | created: Sprint-003 — Widget has no render/behavior test harness (`environment: node`, no jsdom) — a11y behavior (focus trap, Escape, live region) can't be unit-tested, only browser-verified (L-004). done-when: add jsdom/happy-dom (or preact-render-to-string for static render) so widget behavior gets regression coverage; also covers TD-002.
- **TD-010** severity: minor | status: open | created: 2026-07-07 (release) — Portfolio prod runs cache + rate-limiter **in-memory per-instance**: only `REDIS_URL` is set, not the `UPSTASH_REDIS_REST_URL`/`_TOKEN` REST pair my `resolveRedisConfig` reads. Fine at low traffic; cross-instance needs the REST vars. done-when: TASK-033.
- **TD-013** severity: minor | status: open | created: Sprint-009 — The hosted demo (`examples/vercel-demo`) answers via a **deterministic responder** (`FakeChatProvider`), not a real LLM — by design (keyless, cost/secret-free). Retrieval is real (hash embedder) but answers are templated from the top chunk. done-when: if a live-LLM demo is wanted, add an env-gated Gemini path (`buildAppDeps` with a key) alongside the fake one.
- **TD-014** severity: minor | status: open | created: Sprint-009 — Vercel functions time out (504) on held-open **SSE streaming**, so the demo returns the whole SSE body at once (no word-by-word). Fine for the demo; if real streaming is needed on Vercel, use the Edge runtime or fluid/streaming responses. Related: TD-003 (widget pseudo-stream). (L-015.)
- **TD-016** severity: medium | status: open → TASK-054 | created: 2026-07-07 — The widget **renders nothing** if `GET /api/config/public` fails (`element.ts:90-93` returns early with only a `console.warn`). So any transient api/route failure makes the launcher silently vanish — indistinguishable from "no widget." Repeatedly mistaken for a regression ("widget gone again"). done-when: TASK-054 (mount a launcher from a fallback config on config-fetch failure).
- **TD-015** severity: minor | status: open | created: Sprint-009 — The demo build is **manual**: `pnpm --filter @kenalin/widget build` + a hash `ingest` + `node build.mjs` (locally, needs the workspace) then `vercel deploy`. Artifacts are gitignored + prebuilt (Vercel doesn't build it). done-when: a small script or CI step chains ingest→bundle→deploy if the demo needs frequent redeploys.
- **TD-012** severity: minor | status: open | created: Sprint-006 — Widget theme tokens are single-valued but the widget has light+dark modes. So mode-sensitive brand tokens (`accentText`, `bg`, `surface`, `text`, `border`, `userBg`) can't be set to a brand color without breaking one mode (e.g. a dark-blue accentText fails contrast on the dark surface). The portfolio config therefore overrides only the mode-invariant brand tokens (accent/navy/amber/soft), leaving neutrals + accentText at the widget's adaptive defaults (minor teal residual on small links). done-when: TASK-043 (per-mode theme tokens).
- **TD-011** severity: resolved (engine) → TASK-039 (SPRINT-006); content re-ingest → TASK-040 | created: 2026-07-07 (release) — Portfolio case-study MDX frontmatter used non-standard `type: technical`/`hybrid` → generic cards. `normalizeType()` (markdown.ts) now maps `technical`/`hybrid` → `case_study`; typed cards land once the portfolio re-ingests (TASK-040).

---

## Changelog (current sprint only)

> v0.1.0 (MVP) is already recorded in [`docs/CHANGELOG.md`](docs/CHANGELOG.md). No open sprint — nothing staged here.

---

## Quick Rules

```
- No owner-specific strings in packages/* — apps/config/content only (CI grep gate).
- core stays pure (zero I/O); all I/O in server; widget talks only to /api/chat.
- One LLM pass per turn; secrets env-only; every URL from config/evidence, never invented.
- Run `pnpm verify` before commit; keep the eval matrix green.
- Keep this file ≤ ~150 lines — prune at sprint promote.
```
