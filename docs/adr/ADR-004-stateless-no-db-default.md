# ADR-004 — Stateless server, client-held session, no-DB default

- **Status:** accepted (2026-07-06)
- **Context driver:** No-DB installs + horizontal scaling + privacy-by-default.

## Context

A conversation needs memory — what intent is active, which screening questions
were already asked, the qualification progress. The default instinct is to persist
sessions server-side (a database or cache keyed by session id). But that forces a
stateful backend on every owner, complicates horizontal scaling, and means visitor
message content lives on the server by default — the opposite of the privacy-first,
no-database install the product promises.

## Decision

The server is **stateless**: it derives everything it needs from the request
payload each turn. `ConversationState` (PRD Part E) is held client-side and echoed
to the server on every request; nothing about a conversation is stored server-side
in the default `leadStore: none` mode. The default lead store is a no-op; a SQLite
file or webhook emit is opt-in. Restarting the server mid-conversation loses nothing.

## Consequences

**Positive:** A fresh install runs with no database. The server scales horizontally
with no shared session store. Privacy by default — no silent capture; message
content never persists unless the owner explicitly enables a store.

**Negative (trade-offs accepted):** Server-enforced limits (e.g. the screening
question cap) must be re-validated from client-supplied state every turn, since the
client could tamper with it — the server treats incoming state as untrusted and
re-checks caps. Larger histories travel over the wire each turn (mitigated by a
trimmed ~12-message window). Cross-device session continuity is out of scope.

## Alternatives considered

| Option | Why rejected |
|---|---|
| Server-side session store (DB/Redis) | Forces stateful infra on every owner; breaks the no-DB install and privacy defaults. |
| Signed server-issued session token carrying state | Still requires the server to trust/track state; adds crypto + rotation complexity for little gain at this scale. |
| No conversation state at all | Would re-ask answered screening questions and break qualification/handoff memory (PRD FR-8). |
