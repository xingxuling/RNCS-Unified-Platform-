# URRF large-world texture residency WebGPU evidence

This directory closes the execution seam one step further:

`URRF mip plan → VSR selected texture → VSR WebGPU executor → upload/VRAM
receipt`

The same four-map PBR candidate is rendered twice on the deterministic VSR
fake device. Near mip0 creates four 32×32 one-level textures; far mip2 creates
four 8×8 one-level textures. The executor receipts therefore expose a lower
resident texture-byte total for the far presentation while preserving five
material bindings and the candidate authority boundary.

## Gate ledger

| Gate | Result | Evidence |
| --- | --- | --- |
| EXPRESS | PASS | URRF and VSR residency contracts are explicit |
| COMPILE | PASS | VSR build plus RAGF/large-world suites |
| LOWER | PASS | four selected mip receipts enter VSR WebGPU resources |
| EXECUTE | PASS | fake-device executor submits near and far frames with texture uploads |
| CORRECT | PASS | WebGPU receipts, frame roots, asset roots, and streaming roots verify |
| ROBUST | PASS | repeated bounded transition and descriptor-size assertions pass |
| PERFORMANCE | CANDIDATE | fake-device accounting only; no real GPU timing or VRAM claim |
| AI_GENERATE | NOT_DEPLOYED | no external generative model/provider invoked |
| EVIDENCE | PASS | machine-readable report is content-addressed |

## Ownership and gap

RNCS remains canonical world owner. URRF owns the residency choice, VSR owns
the WebGPU execution lowering, and RAGF owns GLB/KTX2 encoding. This report is
not proof of a physical GPU allocation, target-device performance, BasisU
transcoding, CDN/cache scheduling, or production-scale/AAA quality.

`large-world-texture-residency-webgpu-report.json` is the machine-readable
receipt. The near/far CPU visual artifacts remain in
`../URRF_LARGE_WORLD_TEXTURE_RESIDENCY_EXECUTION/`.
