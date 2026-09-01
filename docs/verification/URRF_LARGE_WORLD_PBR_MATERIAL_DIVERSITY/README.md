# URRF large-world PBR material diversity evidence

This directory records a deterministic local contact scene made from multiple
large-world GLB candidates. The path is:

`RNCS scene → URRF selection → RAGF four-map PBR GLB candidates → VSR streaming
→ async KTX2 decode → multi-material composition → frame compile → CPU pixels`

The contact scene uses eight LOD0 candidates: one terrain mesh, three structural
prototypes, three resource prototypes, and a watchtower. Each imported asset
has four KTX2 maps (base-color, normal, metallic-roughness/occlusion, emissive)
and five material texture bindings. The 60-record candidate catalog is streamed
before the selected eight assets are composed, so the image is a multi-asset
runtime proof rather than a hand-authored swatch.

## Gate ledger

| Gate | Result | Evidence |
| --- | --- | --- |
| EXPRESS | PASS | `ragf.ktx2-pbr-mipped.v0.1` accepts the large-world scene |
| COMPILE | PASS | RAGF, large-world, and VSR compile/test suites |
| LOWER | PASS | eight binary GLB assets lower to a single VSR contact scene |
| EXECUTE | PASS | 60 catalog assets stream; eight assets async-decode into VSR |
| CORRECT | PASS | scene, manifest, GLB imports, frame, material and texture roots verify |
| ROBUST | PASS | bundle and CPU pixel roots repeat deterministically |
| PERFORMANCE | CANDIDATE | bounded local CPU run; no device/GPU/scale benchmark |
| AI_GENERATE | NOT_DEPLOYED | no external generative model/provider invoked |
| EVIDENCE | PASS | machine-readable manifest/report and PNG are content-addressed |

## Ownership and gap

RNCS remains canonical world owner, URRF owns representation/material/residency
selection, and RAGF owns GLB/KTX2 encoding. The image demonstrates bounded
material and prototype diversity, not subjective art direction or AAA quality.
BasisU/ASTC/BCn compression, target-device GPU residency, CDN/cache delivery,
and production-scale performance remain unproven.

`large-world-pbr-material-diversity-report.json` is the machine-readable receipt
and `large-world-pbr-material-diversity-reference.png` is the visual artifact.

## Chromium WebGPU execution

The same rooted contact scene is also shipped as a browser fixture. Chromium
executed the real VSR WebGPU path with `available=true`, `submitted=true`, and
`deviceLost=false`; eight selected assets uploaded 32 PBR textures (40 material
texture bindings) into eight draw calls. The CPU and browser frame roots match.

| Field | Value |
| --- | --- |
| source reality root | `7a7614b10e51ec8c43a6f45e7bed4e7310884d061d73d7038e904ebd75f1f0c2` |
| frame root | `b16de7da5ef7fcc307ed0ee79cb824aad1c293ce5260ca7283d075c3319004fc` |
| browser receipt root | `d07e78559078130f61a560d5f6089671c834d852c574e0048c1b6f0a9dec0da6` |
| browser PNG SHA-256 | `fef797206b99cde0f4d8702d2000800c793f10135298d616e150b0fb3701ea3f` |

- `large-world-pbr-material-diversity-scene.json`: browser-consumable contact scene.
- `large-world-pbr-material-diversity-webgpu.html`: static Chromium entry point.
- `large-world-pbr-material-diversity-webgpu-browser-receipt.json`: host-specific WebGPU receipt and error ledger.
- `large-world-pbr-material-diversity-webgpu-browser.png`: actual browser screenshot.
- `large-world-pbr-material-diversity-webgpu-report.json`: rooted CPU/browser comparison report.

This closes local browser execution for textured material diversity only. It is
not a target-device performance grade, physical VRAM measurement, distributed
streaming proof, or AAA art-quality claim.
