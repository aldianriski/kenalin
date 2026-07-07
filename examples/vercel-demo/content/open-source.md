---
title: Is Kenalin free, open-source, and self-hosted?
type: case_study
projectId: open-source
url: https://github.com/aldianriski/kenalin
---

# Free, open-source, and self-hosted

Kenalin is **open-source (MIT)** and free to use. You run it on your own
infrastructure — Node, Vercel, or Cloudflare Workers — so **your data stays with
you**. There's no vendor lock-in and no mandatory backend: a fresh install needs
**no database**, because the knowledge index is a local file and each
conversation's state round-trips with the request.

It's cost-conscious by design: one LLM pass per turn, an optional response cache,
and tuning knobs to keep spend low. You bring a single API key (Google Gemini),
and the free tier covers a small site. For a public playground like this one, it
can even run **keyless** — retrieval is real, and answers come from a
deterministic responder instead of a model.

**Safety is non-negotiable:** Kenalin never states prices, never invents URLs,
never impersonates the owner, and won't fabricate facts — these guarantees can't
be turned off in config.
