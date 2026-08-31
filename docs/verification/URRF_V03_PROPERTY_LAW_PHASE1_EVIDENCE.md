# URRF v0.3 Property/Law Phase 1 Evidence

Status: `CANDIDATE / LOCAL_VERIFIED / NOT_PRODUCTION`

Scope: close the first v0.3 Reality Property & Law gap without promoting any
provider or renderer to Canonical Owner.

## Implemented contract surface

- `rncs.reality-quantity.v0.3`: unit and dimension-bound scalar values with
  provenance, authority, validity interval, evidence refs, and a sealed root.
- `rncs.reality-property-set.v0.3`: intrinsic, dynamic, field, and custom
  property maps owned by RNCS.
- `rncs.reality-law-bindings.v0.3`: world, constitutive, and interaction law
  bindings owned by RNCS.
- `rncs.reality-property-transition.v0.3`: candidate-only property changes
  carrying source property/state roots, a law binding, provider, prediction,
  uncertainty, constraint result, and an authority fence.
- URRF binds PropertySet/LawBindings roots into RealityObject,
  MaterializationPlan, MaterializationReceipt, queries, and candidate
  transitions. Provider claims to mutate canonical property/law state fail
  closed.

## Reproducible local checks

Run from the repository root:

```text
npm test --workspace @taowind/rncs-core-contract
npm test --workspace @taowind/reality-representation-fabric
npm run test:urrf-v03
npm run test:urrf-runtime
npm run test:large-world
```

Observed on 2026-08-31:

- RNCS Core Contract: legacy suites plus Reality Property tests `12/12 PASS`.
- URRF runtime: `8/8 PASS`.
- v0.3 truth integration: `3/3 PASS`.
- URRF representation integration: `1/1 PASS`.
- Large-world package: `16/16 PASS`; root integration: `7/7 PASS`.

## Evidence boundary

This phase verifies contract sealing, queryability, dimensional rejection,
provider authority fencing, and regression compatibility with the existing
representation and large-world paths. It does **not** verify distributed
Property Commit, multi-physics execution, P0-P5 physical fidelity, power or
thermal fault recovery, leases/fencing, transport profiles, or production
hardware/CI behavior.
