# World Body IR v0.1 Candidate

This directory is the integration record for the unified executable path:

```text
World Declaration
  -> World Body IR
  -> RSR authoritative bodies
  -> authority frames and deltas
  -> temporal presentation
  -> VSR scene and Render Graph
  -> backend specialization candidates
```

The implementation reduces repeated state, collision, visual-offset, interpolation, rollback, event-routing, render-pass, barrier, and resource-lifetime glue. It does not remove physics solvers, shaders, GPU/platform backends, network transports, asset providers, or RNCS authority gates.

## Records

- `00-FEDERATION-AND-EXECUTION-PLAN.md` — pre-code multi-civilization review and execution gate.
- `01-BASELINE-AUDIT.md` — actual repository versions, protocols, source paths, tests, schemas, manifests, and bridge boundaries.
- `02-PRODUCTION-DIFFERENTIAL-SCOPE.md` — what the real RSR/VSR differential proves and excludes.
- `03-EVIDENCE-LEDGER.md` — reproducible evidence index and maturity rule.
- `04-RELEASE-AND-ROLLBACK.md` — release, compatibility, and rollback route.
- `05-CODE-REDUCTION-REPORT.md` — reproducible authored/generated surface and diagnostic runtime comparison.

Formal definitions live with their executable packages:

- `packages/world/rsr-formal-theory/docs/RSR-FIVE-LEVEL-FORMALIZATION.md`
- `packages/world/vsr-formal-theory/docs/VSR-FIVE-LEVEL-FORMALIZATION.md`
- `packages/world/world-body-formal-theory/docs/WORLD-BODY-JOINT-FORMAL-THEORY.md`
- `packages/kernel/world-body-formal-kernel/rcl/world-body-formal-kernel.rcl`

## Verification

```bash
npm run verify:world-body
npm run verify:version-contract
```

Current candidate verdict: **F4.5 Partial Production Parity**.
