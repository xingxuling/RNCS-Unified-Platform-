# URRF large-world progressive texture residency evidence

This directory records one deterministic local execution of the next URRF
provider seam after binary GLB import: native RGBA8 KTX2 mip payloads embedded
in binary glTF, explicit progressive-mip residency metadata, cell streaming,
asynchronous VSR image decoding, frame compilation, and CPU reference pixels.

This execution contains 20 scene meshes and three geometry LODs. Each
world-mesh GLB carries one 32×32 base-color KTX2 texture with six deterministic
mip levels (32, 16, 8, 4, 2, 1). Level 0 is marked as a `vram` target and lower
levels as `ram` fallbacks; `resolveLargeWorldTextureResidency` produces a
rooted near/far selection plan tied to screen coverage/distance, with release
to cell-unload hysteresis. These are provider/runtime candidate plans, not
proof of a particular GPU allocator or device residency policy.

## Gate ledger

| Gate | Result | Evidence |
| --- | --- | --- |
| EXPRESS | PASS | KTX2 profile is accepted by `createLargeWorldSpatialGlbBundle` |
| COMPILE | PASS | RAGF KTX2 encoder and large-world 23-test suite |
| LOWER | PASS | `KHR_texture_basisu` image source, KTX2 header and six mip index entries verify |
| EXECUTE | PASS | all bundle assets stream; VSR async KTX2 decoder imports the 32×32 texture |
| CORRECT | PASS | scene/manifest/bundle/stream/import/frame and near/far residency roots verify locally |
| ROBUST | PASS | deterministic repeat and payload-tamper rejection tests pass |
| PERFORMANCE | CANDIDATE | bounded local CPU run only; no target-device/GPU residency benchmark |
| AI_GENERATE | NOT_DEPLOYED | no external generative model/provider invoked |
| EVIDENCE | PASS | machine-readable report and PNG are content-addressed |

## Ownership and gap

RNCS remains canonical world owner, URRF owns representation and residency
selection, and RAGF owns the reusable GLB/KTX2 container encoding. The KTX2
payload is native RGBA8 with no BasisU supercompression; a real compressed
texture transcoder, target-device VRAM uploads, CDN/cache persistence, and
production-scale performance remain explicit follow-up gaps.

`large-world-texture-residency-report.json` is the machine-readable receipt and
`large-world-texture-residency-reference.png` is the visual artifact.
