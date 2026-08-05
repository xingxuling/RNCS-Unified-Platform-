# Reality Kernel v0.2 implementation plan

## Goal and baseline

The RNCS mother project already has RFE generation, RNCS transition envelopes, LAF artifacts, authority fabric, and candidate reality branching. The missing reusable bottom layer is a small deterministic execution seam that can represent a reality object, query relations, execute a bounded transition, and compile evidence without taking over those existing authorities.

## Architecture decisions

- RFE remains the persistence and generation authority.
- The kernel owns canonical roots and a previewable in-memory graph.
- A transition is proposal → authority decision → commit; preview does not mutate the input graph.
- Evidence is content-addressed and explicitly bound to proposal, decision, and commit roots.
- The RFE bridge is duck-typed so this package does not create a circular workspace dependency.
- A typed continuity claim is the minimum subject-history unit: it names a subject and branch, binds a predecessor, and advances by one sequence or one epoch rollover.
- A subject-sovereignty envelope binds the claim to a transition, lease, fencing token, and nonce; the ledger rejects replay, gaps, stale leases, and unauthorized forks.
- The ledger is previewable and transactional. RFE persistence remains authoritative, so the RFE bridge advances the ledger only after `store.commit()` succeeds.

## Vertical slice order

1. Object ABI and canonical roots.
2. Graph snapshot and deterministic relation traversal.
3. Transition VM with stale-base, authority, and atomicity guards.
4. Evidence compiler and RFE local commit adapter.
5. Typed continuity claim, subject sovereignty, and anti-replay fencing.

## Test seams

Tests observe the public entry points only: object verification, graph query results, transition receipts, rejected transitions, compiled evidence, and the RFE-compatible commit call.

## Build and run

```bash
npm test
npm run demo
```

## Risks and rollback

The package is additive. If the seam proves incompatible with the mother project, remove the module registry entry and package directory; existing RFE/RNCS/LAF packages are untouched. Continuity enforcement is opt-in unless a caller constructs the VM with `requireContinuity: true`.

## Delivery

The package, execution contract, verification matrix, README, tests, and demo are committed to a dedicated GitHub branch and opened as a pull request against `main-95`.
