# URRF Representation Flow Time v0.3

This evidence slice runs the v0.3 `RepresentationFlow` contract through the RNCS core and the URRF runtime.

The checked path is:

`ObjectIdentity + TimeInterval + SourceState + TargetState + MotionField + InterpolationPolicy + PredictionBudget + ErrorBudget + AuthorityScope`

The integration test records:

- identity continuity between source and target state/representation roots;
- strictly monotonic time and tick intervals;
- deterministic linear interpolation;
- bounded extrapolation with a millisecond and tick budget;
- observed prediction error and collision displacement checks;
- stale-state rejection;
- candidate-only and rollback-compatible authority boundaries;
- an unchanged canonical object root after all samples.

`representation-flow-time-report.json` is local deterministic evidence, not proof of sensor truth, synchronized distributed clocks, real GPU/renderer frame timing, or production visual quality.

## RCL / federation ledger

- RCL Gap: the repository had interpolation in a visual runtime, but no cross-project canonical Flow Time primitive with identity, prediction, stale-state, safety and rollback gates. `rncs.representation-flow.v0.3` now owns that semantic contract in RNCS Core.
- Donor advantage: URRF retains provider/reference lookup and candidate registry responsibilities; it lowers the RNCS flow into provider-neutral samples without taking world-state authority.
- Stress case: one object moves from a source state root to a target state root while a renderer asks for an in-interval sample, a bounded extrapolation sample, and a stale sample.
- Regression: the core suite covers tampering, error/window rejection and tick-budget enforcement; the URRF suite covers registration/snapshot preservation; the integration test records the rooted evidence report.
- Gate status: EXPRESS, COMPILE, LOWER, EXECUTE, CORRECT, ROBUST and EVIDENCE are locally exercised for this candidate slice. PERFORMANCE, AI_GENERATE and production visual/clock/hardware proof remain `NOT_RUN`.
