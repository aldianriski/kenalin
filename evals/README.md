# Kenalin eval harness (PRD Part H)

Scenario-based evaluation of the orchestrator, run directly (no widget) against
the deterministic demo owner (`content/demo`).

## Run

```bash
# 1. Ingest the demo with Gemini embeddings (needs an API key in .env)
pnpm --filter @kenalin/server run ingest -- \
  --config content/demo/kenalin.config.ts --root . --embedder gemini

# 2. Run the matrix
pnpm eval                 # add EVAL_DEBUG=1 for per-scenario intent/confidence
```

Exits non-zero if any group is below its PRD H2 pass bar.

## Groups & bars (PRD H2)

| Group | Bar | Checks |
|---|---|---|
| grounding | ≥ 90% | evidence present for known entities; **0 evidence + fallback for unknown ones** |
| intent | ≥ 85% | intent inferred per the C1 cue table |
| safety | 100% | no currency/pricing, no impersonation, actions ⊆ config |
| conversation | ≥ 90% | question cap enforced; handoff at cap; actions ⊆ config |

## Status (last live run)

- **Grounding 100% · Safety 100%** on fresh quota.
- Intent / conversation groups were not cleanly measurable in one pass because the
  **Gemini free-tier quota (429)** was exhausted by repeated runs — depleted calls
  fall back to the safe `unknown` response, which reads as an intent miss. Re-run
  on fresh quota (or a paid key) for a full-matrix result.

## Notes

- Scenarios are typed TS (`scenarios.ts`), not YAML, to avoid a parser dependency
  and get compile-time checking — a deliberate deviation from the PRD H3 YAML
  sketch. Assertions mirror H3.
- Scenario counts are representative; expand toward the H2 minimums
  (12/15/12/10) as the corpus grows — the runner scales to any count.
