# Security Policy

## Reporting a vulnerability

Please report security issues privately by email to the maintainer rather than
opening a public issue. Include steps to reproduce and the affected version.
You can expect an acknowledgement within a few business days.

## Security model

Kenalin is self-hosted and designed to keep the owner in control of their data
and secrets.

- **Secrets never reach the client.** API keys and the webhook signing secret
  live only in server-side environment variables (`KENALIN_LLM_API_KEY`,
  `KENALIN_WEBHOOK_SECRET`). They are never included in `kenalin.config.ts`, the
  `/api/config/public` payload, or any response body.
- **No data at rest by default.** With `storage.lead: none` (the default) nothing
  a visitor types is stored server-side; the conversation lives only in the
  client session. Persistence (SQLite / webhook) is explicit opt-in.
- **Consent-explicit lead capture.** Personal details are requested only at
  handoff, with a stated purpose; a visitor can decline and still get contact links.
- **CORS allowlist + security headers.** `/api/*` is restricted to
  `server.allowedOrigins`, and responses carry baseline security headers
  (nosniff, frame-deny, referrer policy).
- **Rate limiting + abuse guards.** A per-IP token bucket (default 20 messages /
  10 min) plus cheap pre-LLM guards reject oversized/over-long inputs before any
  model spend: per-message ≤ 4000 chars, ≤ 60 messages/request, ≤ 40 turns/session,
  ≤ 64 KB body. Context sent to the model is trimmed (last 8 messages, capped
  length, ≤ 5 evidence items) to bound token cost.
- **Scope + injection resistance.** The assistant only introduces the owner; it
  declines off-topic requests (general knowledge, coding, etc.) and ignores
  visitor attempts to override its instructions or reveal the prompt. These are
  enforced in the core policy and covered by the eval Safety group.
- **Secrets are env-only.** The webhook signing secret comes solely from
  `KENALIN_WEBHOOK_SECRET`; the config schema has no secret field, so a secret
  cannot be committed via `kenalin.config.ts`.
- **Signed webhooks.** Outbound webhook payloads are signed with
  `X-Kenalin-Signature: hex(hmac_sha256(body, secret))`; verify this on receipt.
- **Non-overridable safety policy.** The answer pipeline blocks invented URLs,
  currency/pricing output, and owner impersonation, and refuses to fabricate
  evidence. Persona configuration cannot weaken these guarantees.

## Deployment hardening checklist

- [ ] Set `server.allowedOrigins` to your real domains (empty = allow all — dev only).
- [ ] Keep `.env` out of version control (`.gitignore` already excludes it).
- [ ] Set `KENALIN_WEBHOOK_SECRET` if you configure a handoff webhook, and verify
      the signature on your endpoint.
- [ ] Run the reverse proxy / platform with HTTPS; the widget expects same-site cookies-free.
- [ ] Review `content/index.manifest.json` before every deploy — only intended
      public content should be in the index (curation gate).
