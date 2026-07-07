---
owner: Tech Lead
last_updated: 2026-07-07
update_trigger: The Zod config schema (packages/core/src/config/schema.ts) changes
status: current
---

# Kenalin — Configuration Reference

> Every field of `kenalin.config.ts`, with type + default + purpose. The
> authoritative source is the Zod schema in
> [`packages/core/src/config/schema.ts`](../packages/core/src/config/schema.ts) —
> this page is checked against it by `scripts/check-config-doc.mjs` (in
> `pnpm verify`), so it cannot silently drift from the code.
>
> **Secrets never live here.** `KENALIN_LLM_API_KEY` and `KENALIN_WEBHOOK_SECRET`
> come from the environment only (`.env`), never from config.
> **Money never appears.** `complexity.showPricing` is schema-locked to `false`.

Author your config with `defineKenalinConfig({ … })` from `@kenalin/core`. Invalid
config refuses to boot with a precise error. Only `owner` and `assistant` are
required; every other group has a default.

## owner — who the assistant represents (required)

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `owner.name` | string | — (required) | The person the assistant speaks *about* (third person, never as them). |
| `owner.preferredName` | string | — | Short/first name used in conversation. |
| `owner.role` | string | — (required) | The owner's role/title (e.g. "Product engineer & consultant"). |
| `owner.website` | url | — (required) | The owner's primary site. |
| `owner.aboutUrl` | url | — | Specific "about" page for the profile-summary evidence link. Unset → the summary carries no link (never defaults to the bare site root). |

## assistant — the persona (required)

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `assistant.name` | string | — (required) | The assistant's persona name. |
| `assistant.launcherLabel` | string | `"Ask"` | Text on the launcher button. |
| `assistant.description` | string | — | One-line description of what the assistant does. |
| `assistant.languages` | ("id" \| "en")[] | `["id","en"]` | Conversation languages (at least one). |
| `assistant.openingMessage` | string | — | Contextual opener; never a generic "How can I assist you today?". |
| `assistant.tone` | string | — | Persona tone (e.g. "warm-professional, concise"). |
| `assistant.boundaries` | string | — | Extra persona guidance — **additive only**; cannot remove a B9 safety policy. |
| `assistant.idle.nudgeSeconds` | int > 0 | `60` | Seconds of inactivity before a gentle "still there?" nudge. |
| `assistant.idle.closeSeconds` | int > 0 | `30` | Further seconds after the nudge before the widget auto-minimizes. |

## modules — the seven toggles (each defaults `true`)

Each capability toggles independently; disabled contributes nothing.

| Field | Type | Default |
|-------|------|---------|
| `modules.portfolioDiscovery` | boolean | `true` |
| `modules.hiringAssistant` | boolean | `true` |
| `modules.leadQualification` | boolean | `true` |
| `modules.serviceMatching` | boolean | `true` |
| `modules.contactHandoff` | boolean | `true` |
| `modules.calendarBooking` | boolean | `true` |
| `modules.pageContext` | boolean | `true` |

## services — offerings for service-matching (optional)

An array; each entry:

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `services[].id` | string | — (required) | Stable service id. |
| `services[].name` | string | — (required) | Display name. |
| `services[].description` | string | — (required) | What the service is. |
| `services[].evidenceIds` | string[] | — | Knowledge-chunk ids backing this service. |

## complexity — opportunity sizing (never a price)

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `complexity.enabled` | boolean | `true` | Emit small/medium/complex sizing. |
| `complexity.showPricing` | `false` | `false` | **Schema-locked to `false`** — Kenalin never outputs money. |
| `complexity.levels` | ("small"\|"medium"\|"complex")[] | `["small","medium","complex"]` | The sizing labels. |

## handoff — human routing channels (at least one if `modules.contactHandoff`)

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `handoff.whatsapp.number` | string | — | WhatsApp number for handoff. |
| `handoff.email.address` | email | — | Email for handoff. |
| `handoff.calendar.url` | url | — | Booking link. |
| `handoff.webhook.url` | url | — | Endpoint for handoff events. The signing secret is env-only (`KENALIN_WEBHOOK_SECRET`) — **no secret field exists here**. |

## actions — suggested CTA buttons (optional)

An array; each entry. Every `url` must come from config (never invented by the model).

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `actions[].id` | string | — (required) | Stable action id. |
| `actions[].type` | link \| whatsapp \| email \| calendar \| contact_form \| custom | — (required) | Action kind. |
| `actions[].label` | string | — (required) | Button text. |
| `actions[].url` | string | — | Absolute https URL or root-relative path (validated). |
| `actions[].visibleFor.intents` | string[] | — | Show only for these intents. |
| `actions[].visibleFor.complexity` | ("small"\|"medium"\|"complex")[] | — | Show only for these complexity levels. |

## knowledge — retrieval sources

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `knowledge.sources[].kind` | url \| sitemap \| markdown \| json \| pdf | — (required) | Source type ingested into the local index. |
| `knowledge.sources[].path` | string | — (required) | File/dir path or URL for the source. |

`knowledge.sources` defaults to `[]`.

## storage — lead persistence

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `storage.lead` | none \| database \| webhook \| both | `"none"` | Where captured leads go. |
| `storage.retentionDays` | int > 0 | `30` | Lead retention window. |

## analytics

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `analytics.enabled` | boolean | `false` | Emit engagement events (no PII). |

## qualification — light screening (never a quotation)

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `qualification.maxQuestions` | int > 0 | `3` | Default screening questions. |
| `qualification.hardCap` | int > 0 | `5` | Hard ceiling; must be ≥ `maxQuestions`. |
| `qualification.categories` | string[] | — | Optional category taxonomy. |

## server — CORS + rate limit + model tuning

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `server.allowedOrigins` | string[] | `[]` | CORS allowlist for `/api/*`. Empty = allow all (dev only). |
| `server.rateLimit.maxMessages` | int > 0 | `20` | Messages allowed per window per IP. |
| `server.rateLimit.windowMs` | int > 0 | `600000` | Rate-limit window (10 min). |
| `server.model.default` | string | `"gemini-2.5-flash"` | Primary chat model. |
| `server.model.lite` | string | — | Lighter model for trivial whole turns; unset = never swap. |
| `server.model.liteMaxChars` | int > 0 | `120` | Max user-message length to count as "trivial" → lite. |
| `server.model.thinkingBudget` | int ≥ 0 | — | Gemini thinking-token budget; `0` disables (cost lever), unset = provider default. |

## branding — imagery + theme (optional)

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `branding.logoUrl` | url | — | Brand logo. |
| `branding.avatarUrl` | url | — | Header avatar image. |
| `branding.icons` | record<string, url> | — | Per-icon overrides (icon-name → image URL / data-URI). URLs only — no inline markup. |
| `branding.modes` | record<string, ThemeTokens> | — | Per-`data-mode` theme overrides; the widget observes the host's `data-mode` and applies `theme` + `modes[mode]`. Same token shape as `branding.theme`. |

### branding.theme — color tokens (each maps to a `--kenalin-*` CSS var; unset = neutral default)

| Field | Type | Field | Type |
|-------|------|-------|------|
| `branding.theme.navy` | string | `branding.theme.bg` | string |
| `branding.theme.accent` | string | `branding.theme.surface` | string |
| `branding.theme.accentStrong` | string | `branding.theme.text` | string |
| `branding.theme.accentText` | string | `branding.theme.muted` | string |
| `branding.theme.accentSoft` | string | `branding.theme.border` | string |
| `branding.theme.amber` | string | `branding.theme.userBg` | string |
| `branding.theme.radius` | string | `branding.theme.font` | string |

> Note: mode-sensitive tokens (`accentText`, `bg`, `surface`, `text`, `border`,
> `userBg`) are single-valued but the widget renders light **and** dark — setting
> them to one brand color can break the other mode. Override mode-invariant tokens
> (`accent`, `navy`, `amber`, `accentSoft`) freely; use `branding.modes` for the
> rest (TD-012 / TASK-043).

### branding.position — placement + stacking

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `branding.position.corner` | bottom-right \| bottom-left | `"bottom-right"` | Launcher corner. |
| `branding.position.offsetX` | CSS length | `"22px"` | Horizontal offset (always adds `env(safe-area-inset-*)`). |
| `branding.position.offsetY` | CSS length | `"22px"` | Vertical offset. |
| `branding.position.offsetYMobile` | CSS length | — (falls back to `offsetY`) | Bottom offset on ≤768px — set this to clear a host bottom-nav (safe-area does **not** account for app chrome). |
| `branding.position.zIndex` | int | `2147483000` | Stacking order. |
| `branding.position.mobile` | fullscreen \| docked | `"fullscreen"` | Mobile panel behavior. |

### branding.marks — built-in launcher/header shapes (no image needed)

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `branding.marks.launcher` | logo \| chat \| robot | — | Launcher badge shape (a configured `logoUrl` wins). |
| `branding.marks.header` | logo \| chat \| robot | — | Header avatar shape (a configured `avatarUrl` wins). |

## Cross-field rules (enforced at boot)

- `qualification.hardCap` **must be ≥** `qualification.maxQuestions`.
- If `modules.contactHandoff` is `true`, at least one `handoff` channel
  (`whatsapp` | `email` | `calendar` | `webhook`) must be configured.
- Each `actions[].url` must be an absolute `https` URL or a root-relative path.

See [`kenalin.config.example.ts`](../kenalin.config.example.ts) for a complete
starting point.
