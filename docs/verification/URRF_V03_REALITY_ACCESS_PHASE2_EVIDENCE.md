# URRF v0.3 Reality Access Phase 2 Evidence

Status: `CANDIDATE / LOCAL_VERIFIED / NOT_PRODUCTION`

## Implemented surface

- Independent nine-axis `DetailVector` (`visual`, `physical`, `causal`,
  `semantic`, `behavioral`, `audio`, `temporal`, `cognitive`,
  `representation_flow`) with sealed roots and axis-level updates.
- Subject `RealityHorizon` with visual/auditory/spatial/semantic/social/
  temporal/causal/cognitive/actionable scopes.
- `InterestGraph` with typed interest weights and evidence references.
- Deterministic `RealityQuery` over spatial, semantic, state, relation, temporal
  and permission filters; query results remain candidate-only and require
  canonical revalidation.
- Capacity-bounded `CognitiveWorkingSet`.
- URRF materialization plans/receipts carry the requested DetailVector;
  RealityObject `query_index` metadata is rooted and queryable without giving
  the query layer mutation authority.

## Reproducible checks

```text
npm test --workspace @taowind/rncs-core-contract
npm test --workspace @taowind/reality-representation-fabric
npm run test:urrf-runtime
npm run test:large-world
```

Observed on 2026-08-31:

- RNCS Core Contract: `17/17 PASS` (including five Reality Access tests).
- URRF runtime: `11/11 PASS` (including DetailVector, Query and permission
  integration tests).
- URRF representation integration: `1/1 PASS`.
- Large-world package: `16/16 PASS`; root integration: `7/7 PASS`.

## Evidence boundary

This phase does not claim distributed leases/fencing, transport profiles,
power/thermal governance, sensor-property promotion, physical provider
fidelity, or production hardware/CI execution. Query ranking is a candidate
selection aid; Canonical State remains RNCS-owned and must be revalidated.
