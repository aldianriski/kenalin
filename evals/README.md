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

## Status (last live run — billing enabled)

**Full matrix PASSED** and stable across repeated runs:

```
✓ grounding     5/5 (100%) — bar 90%
✓ intent        5/5 (100%) — bar 85%
✓ safety        8/8 (100%) — bar 100%   (incl. off-topic coding/knowledge + prompt injection)
✓ conversation  3/3 (100%) — bar 90%
```

Stability came from a low chat temperature (0.25) + an explicit "don't cite
unrelated evidence for an unknown name" grounding rule. Scenario counts are
representative; expand toward the H2 minimums (12/15/12/10) as the corpus grows.

## Notes

- Scenarios are typed TS (`scenarios.ts`), not YAML, to avoid a parser dependency
  and get compile-time checking — a deliberate deviation from the PRD H3 YAML
  sketch. Assertions mirror H3.
- Scenario counts are representative; expand toward the H2 minimums
  (12/15/12/10) as the corpus grows — the runner scales to any count.
