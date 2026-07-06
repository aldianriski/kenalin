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
- **CORS allowlist.** `/api/*` is restricted to the origins listed in
  `server.allowedOrigins`.
- **Rate limiting.** A per-IP token bucket (default 20 messages / 10 min) guards
  the chat endpoint.
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
