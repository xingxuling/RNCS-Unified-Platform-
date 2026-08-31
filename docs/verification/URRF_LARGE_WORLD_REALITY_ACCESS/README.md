# URRF large-world Reality Access evidence

This slice closes the v0.3 access-to-streaming seam:

`RealityHorizon → InterestGraph → RealityQuery → CognitiveWorkingSet →
forced Chunk requests → bounded stream → VSR spatial scene`

The large-world runtime now places every generated Chunk in the URRF query
index at its deterministic center (meters), with biome, structure/resource
tags, state counters, public scope, and Chunk roots as evidence references.
The query result remains a candidate and must be canonically revalidated. Its
capacity-bounded working set becomes forced Chunk requests; the normal load
radius, unload hysteresis, active-count and byte budgets still apply.

## Gate ledger

| Gate | Result | Evidence |
| --- | --- | --- |
| EXPRESS | PASS | v0.3 Horizon, InterestGraph, Query and WorkingSet are explicit in the core contract |
| COMPILE | PASS | core, URRF fabric, large-world runtime and VSR integration suites |
| LOWER | PASS | WorkingSet object IDs lower to Chunk IDs and forced stream requests |
| EXECUTE | PASS | bounded stream and VSR scene/frame/CPU reference render execute locally |
| CORRECT | PASS | query/result/working-set/stream/scene roots verify; tampering is rejected |
| ROBUST | PASS | permission, capacity, deterministic ranking and stream budgets remain bounded |
| PERFORMANCE | CANDIDATE | 5×5 synthetic region and CPU reference render; no production-scale timing |
| AI_GENERATE | NOT_DEPLOYED | no external generative model/provider invoked |
| EVIDENCE | PASS | `large-world-reality-access-report.json` is content-addressed; PNG is a visual artifact |

## Ownership and limits

RNCS owns world truth and query permission semantics. URRF owns representation
selection and candidate access lowering. The large-world runtime owns Chunk
generation and bounded stream state. VSR owns the spatial scene/frame
execution. This is not proof of canonical promotion, network/CDN delivery,
real GPU/VRAM execution, or AAA visual quality.

Artifacts:

- `large-world-reality-access-report.json`
- `large-world-reality-access.png`
