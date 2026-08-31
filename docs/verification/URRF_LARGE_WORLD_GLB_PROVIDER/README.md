# URRF large-world RAGF GLB provider evidence

This directory records one deterministic local execution of the binary asset
seam for `world:urrf-large-world-glb-provider`.

## Executed path

`RNCS region/chunk selection → URRF spatial scene → RAGF GlbBuilder/encodeGlb →
embedded PNG GLB payloads → VSR cell streaming → VSR GLB import → frame compile →
cell HLOD → CPU reference pixels`

The manifest contains 19 scene meshes, three explicit LODs, 57 world-mesh GLB
records, and one optional RAGF procedural-3d showcase record (58 binary GLB
records total). Every record is SHA-256 addressed, indexed by streaming cell
when it belongs to the world, and carries the source scene root. The imported
showcase asset has one rigged mesh, four embedded PNG maps, and more than 700
triangles in the cinematic candidate. The reference image is a CPU-rendered evidence
artifact, not a target-device or production renderer claim.

The VSR GLB importer also converts glTF column-major inverse-bind matrices into
its row-major deformation contract. The non-identity conversion is covered by
the VSR glTF test and is what keeps the RAGF showcase from collapsing into a
stretched silhouette during the CPU reference render.

## Gate ledger

| Gate | Result | Evidence |
| --- | --- | --- |
| EXPRESS | PASS | `createLargeWorldSpatialGlbBundle` accepts the rooted VSR scene |
| COMPILE | PASS | `npm test --workspace @taowind/large-world-runtime` (23/23) |
| LOWER | PASS | RAGF `GlbBuilder` + `encodeGlb`, GLB header/JSON and PNG buffer verified |
| EXECUTE | PASS | 58/58 assets streamed; VSR binary import succeeded |
| CORRECT | PASS | manifest/bundle/stream/import/frame roots verify locally |
| ROBUST | PASS | deterministic repeat and payload-tamper rejection tests pass |
| PERFORMANCE | CANDIDATE | bounded local CPU run only; no device/GPU/scale benchmark |
| AI_GENERATE | NOT_DEPLOYED | no generative model or external provider was invoked |
| EVIDENCE | PASS | `large-world-glb-provider-report.json` and PNG are content-addressed |

## Ownership and gap

RNCS remains the canonical world owner, URRF owns representation selection, and
RAGF owns reusable GLB container encoding. The provider is candidate-only and
cannot write authoritative world state. The remaining RCL gap is a reusable
binary-asset/texture IR with compressed-texture and residency semantics; this
change records the lowering/provider seam without silently promoting it into
RCL or production quality.

`large-world-glb-provider-report.json` is the machine-readable receipt and
`large-world-glb-provider-reference.png` is the visual artifact.
