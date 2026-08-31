# URRF large-world four-map PBR texture residency evidence

This directory records a deterministic local execution of four-map PBR
materialization on the large-world GLB provider. The path is:

`RNCS scene → URRF selection → RAGF GLB/KTX2 provider → cell streaming →
async VSR KTX2 decode → base-color/normal/ORM/emissive bindings → frame compile
→ CPU reference pixels`

Each world-mesh candidate carries a 32×32 base-color, normal,
metallic-roughness/occlusion, and emissive KTX2 map. Every map has six levels
(32, 16, 8, 4, 2, 1), and the rooted residency plan can select a near mip0 or
far mip2 target while retaining lower-level prefetch fallbacks. The texture
payload is native RGBA8 KTX2: base-color/emissive are sRGB and
normal/metallic-roughness are linear. No BasisU supercompression or device VRAM
upload is claimed.

## Gate ledger

| Gate | Result | Evidence |
| --- | --- | --- |
| EXPRESS | PASS | `ragf.ktx2-pbr-mipped.v0.1` is accepted by the GLB provider |
| COMPILE | PASS | RAGF KTX2 tests and large-world PBR unit suite |
| LOWER | PASS | four `KHR_texture_basisu` images and PBR material bindings verify |
| EXECUTE | PASS | all candidate assets stream; VSR async decoding imports four mipped maps |
| CORRECT | PASS | scene/manifest/bundle/stream/import/frame/residency roots verify |
| ROBUST | PASS | deterministic repeat, material binding, and payload-tamper tests pass |
| PERFORMANCE | CANDIDATE | bounded local CPU run only; no target-device/GPU benchmark |
| AI_GENERATE | NOT_DEPLOYED | no external generative model/provider invoked |
| EVIDENCE | PASS | machine-readable manifest/report and PNG are content-addressed |

## Ownership and gap

RNCS remains canonical world owner, URRF owns representation/material/residency
selection, and RAGF owns GLB/KTX2 container encoding. The remaining gaps are a
real BasisU/ASTC/BCn compressor and transcoder, target-device VRAM residency,
CDN/cache persistence, and production-scale/AAA visual validation.

`large-world-pbr-texture-residency-report.json` is the machine-readable receipt
and `large-world-pbr-texture-residency-reference.png` is the visual artifact.
