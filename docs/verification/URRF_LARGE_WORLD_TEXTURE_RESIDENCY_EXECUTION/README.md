# URRF large-world texture residency execution evidence

This directory records the next execution boundary after PBR mip planning:

`RNCS scene → URRF residency plan → RAGF four-map PBR GLB → VSR async KTX2
decode → selected mip lowering → frame resource accounting → CPU pixels`

The near plan selects mip 0 (32×32) and the far plan selects mip 2 (8×8) for
all four maps. `applySpatialTextureResidency` creates a rooted VSR texture that
contains only the selected resident chain; deferred levels stay out of the
executor input. The authored scene, geometry, and source-reality roots remain
stable while texture/frame/pixel roots change.

## Gate ledger

| Gate | Result | Evidence |
| --- | --- | --- |
| EXPRESS | PASS | URRF progressive-mip plan and VSR execution formats are explicit |
| COMPILE | PASS | VSR typecheck and spatial suite; RAGF/large-world suites |
| LOWER | PASS | each URRF plan lowers to a rooted VSR texture resource |
| EXECUTE | PASS | 60 candidate assets stream; four async KTX2 maps compile in near/far frames |
| CORRECT | PASS | plan, lowering receipt, frame, material, texture, and source roots verify |
| ROBUST | PASS | selected-level bounds, contiguous-chain, tamper, and deterministic checks pass |
| PERFORMANCE | CANDIDATE | bounded local CPU reference run; no target-device/GPU timing claim |
| AI_GENERATE | NOT_DEPLOYED | no external generative model/provider invoked |
| EVIDENCE | PASS | machine-readable report, manifest, near PNG, and far PNG are written |

## Ownership and gap

RNCS remains canonical world owner. URRF owns the representation/residency
decision, VSR owns lowering into presentation resources, and RAGF owns the GLB
and KTX2 encoding. This proves a local selected-mip execution seam, not GPU
hardware residency, BasisU transcoding, CDN/cache scheduling, or AAA quality.

`large-world-texture-residency-execution-report.json` is the machine-readable
receipt. `large-world-texture-residency-execution-near.png` and
`large-world-texture-residency-execution-far.png` are the visual artifacts.
