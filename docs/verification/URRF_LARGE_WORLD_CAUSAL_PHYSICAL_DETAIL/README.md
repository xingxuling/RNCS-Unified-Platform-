# URRF large-world CausalPhysicalProfile evidence

This slice closes the v0.3 causal/physical detail seam:

`demand → C0–C5/P0–P5 requirement → execution behavior/cost → bounded budget → representation selection → VSR frame/CPU reference`

The same 5×5 deterministic region is evaluated with a low-demand ambient
profile and a high-risk interactive profile. The profile is registered against
each active Chunk's canonical state root, but remains a candidate-only URRF
description. Its derived cost is consumed before visual portfolio selection, so
the high-detail case visibly and mechanically falls back from `STANDARD` to
`PROXY` under the fixed synthetic budget.

## Gate ledger

| Gate | Result | Evidence |
| --- | --- | --- |
| EXPRESS | PASS | Core `CausalPhysicalProfile` contract, C/P levels, execution map and resource model |
| COMPILE | PASS | Core, URRF fabric, VSR build, large-world runtime and root integration suites |
| LOWER | PASS | Per-Chunk profile roots lower into portfolio rows and spatial-scene metadata |
| EXECUTE | PASS | Bounded portfolio selection, VSR frame compilation and deterministic CPU-reference PNGs |
| CORRECT | PASS | Profile, selection, scene, frame and report roots verify; canonical world root is unchanged |
| ROBUST | PASS | Independent C/P levels, resource admission, safety/authority-preserving fallback and object/state-root binding |
| PERFORMANCE | CANDIDATE | 5×5 synthetic region and 320×180 CPU reference; no production-scale timing or GPU telemetry |
| AI_GENERATE | NOT_DEPLOYED | No external generative model/provider invoked |
| EVIDENCE | PASS | Rooted JSON report plus low/high PNG artifacts |

## Ownership and limits

RNCS owns canonical Chunk/world truth and authority. URRF owns the
candidate-only CausalPhysicalProfile and representation selection. VSR owns
frame compilation and the CPU reference renderer. The high-detail profile
changes execution metadata and budget consumption; it is not a physics engine,
real GPU/VRAM measurement, network-scale simulation, canonical write, or proof
of AAA visual quality.

Artifacts:

- `large-world-causal-physical-detail-report.json`
- `large-world-causal-physical-detail-low.png`
- `large-world-causal-physical-detail-high.png`
