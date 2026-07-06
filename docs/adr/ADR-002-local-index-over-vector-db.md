# ADR-002 — Local brute-force index over a vector DB

- **Status:** accepted (2026-07-06)
- **Context driver:** Corpus scale (10²–10³ chunks) + the "no infrastructure for a fresh install" goal.

## Context

RAG needs a vector store. The reflexive choice is a vector database (pgvector,
Pinecone, etc.). But a portfolio's knowledge corpus is tiny — on the order of
hundreds to low thousands of chunks. A vector DB adds a service to run, a
connection to configure, and a dependency an owner must provision before the
widget works at all — directly against the goal that a fresh install runs with
just a config file, content, and one API key, no database.

## Decision

Ship the MVP `KnowledgeStore` as a **local index**: `content/index/` holds JSONL
chunks plus their Float32 vectors, and retrieval does brute-force cosine similarity
in memory at query time. The store sits behind the `KnowledgeStore` interface in
`core`, so a pgvector/Postgres adapter can replace it later without touching the
orchestrator.

## Consequences

**Positive:** Zero external infrastructure; a fresh clone ingests and serves with
no database. Brute-force cosine over ~10³ vectors is well under a millisecond —
simpler and faster than a network round-trip to a vector DB at this scale.

**Negative (trade-offs accepted):** Does not scale to large corpora — beyond a few
thousand chunks the in-memory scan and index file size become a problem. That is an
accepted ceiling for the portfolio use case; the interface seam makes the pgvector
swap a P1 task, not a rewrite.

## Alternatives considered

| Option | Why rejected |
|---|---|
| pgvector / Postgres from day one | Forces every owner to run a database — breaks the no-infra install promise; premature for 10³ chunks. |
| Hosted vector DB (Pinecone/Weaviate) | Adds a paid third-party dependency and data leaves the owner's infrastructure. |
| Keyword/BM25 search, no embeddings | Weaker on multilingual id/en semantic matching, which the evidence-first thesis depends on. |
