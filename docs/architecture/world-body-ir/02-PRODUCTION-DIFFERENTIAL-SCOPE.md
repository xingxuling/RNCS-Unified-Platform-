# Production Differential Scope

The differential executes generated artifacts through the repository's built package exports, rather than comparing two copies of the new reference model.

## Executed path

1. Load the generated RSR `v0.6` world configuration.
2. Construct two real `SpatialEmbodimentWorld` instances from RSR `0.9.0-alpha.1`.
3. Compare initial and one-step sealed roots for deterministic replay.
4. Verify real RSR snapshots and `rsr.authoritative-state.v0.7` frames.
5. create, verify, and apply a real RSR authority delta; require the exact target state root.
6. Pass real frames through generated temporal bindings and the real VSR temporal buffer; require authority-root preservation.
7. Project the real RSR snapshot through the existing RSR-to-VSR adapter.
8. Apply generated BodyMap visual offsets, compile a real VSR frame plan, and run the real VSR frame verifier.
9. Compare selected production RSR and VSR observables against the formal refinement relations.
10. Execute the real CPU PBR function twice and require finite, non-negative deterministic output.

The selected RSR step relation allows at most `1 mm` axis error; the observed fixture passes. Initial RSR and VSR projection relations require `0 mm` tolerance.

## What this proves

- Generated configuration and bindings are executable against the actual checked-out RSR/VSR package builds.
- The selected authority, identity, pose, delta, temporal, and frame-integrity observables refine their executable reference relations.
- Presentation operations do not rewrite the audited RSR authority root.
- The exercised CPU implementation is deterministic for the fixed fixture.

## Explicit exclusions

- Browser or target GPU adapter execution and pixel equivalence.
- PhysX, Jolt, Chaos, Unity, Unreal, or other external physics-engine equivalence.
- Packet loss, latency, reordering, distributed recovery, and real transport behavior.
- Production asset stores, streaming providers, databases, filesystems, and device drivers.
- Target-hardware performance or budget compliance.
- Universal equivalence outside the declared fixture and observables.

Therefore the result is `PARTIAL_PRODUCTION_DIFFERENTIAL`, not WB-T10 closure and not F5.
