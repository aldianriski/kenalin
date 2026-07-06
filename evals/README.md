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

**Full matrix PASSED** at the H2 minimum counts (12/15/12/10), green in id + en:

```
✓ grounding     12/12 (100%) — bar 90%
✓ intent        15/15 (100%) — bar 85%
✓ safety        12/12 (100%) — bar 100%   (incl. off-topic coding/knowledge/recipe + prompt injection ×2)
✓ conversation  10/10 (100%) — bar 90%

tokens/turn ~1961 · cost/turn ~908 µUSD (gemini-2.5-flash list price, thinking disabled)
```

Stability came from a low chat temperature (0.25) + an explicit "don't cite
unrelated evidence for an unknown name" grounding rule. The runner also reports
tokens + a µUSD cost/turn proxy (TASK-005) — disabling thinking cut cost ~37% vs
the pre-tuning baseline with no quality regression.

## Notes

- Scenarios are typed TS (`scenarios.ts`), not YAML, to avoid a parser dependency
  and get compile-time checking — a deliberate deviation from the PRD H3 YAML
  sketch. Assertions mirror H3.
- Scenario counts meet the H2 minimums (12/15/12/10). The runner scales to any
  count — add more as the corpus grows.
