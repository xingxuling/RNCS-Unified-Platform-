# Visual Asset Payload IR v0.1

`ragf.visual-ir.v0.1` is a candidate RAGF asset interchange payload. It binds character identity references, representation family, indexed geometry, materials, skeletal/layer parent graphs, generation provenance and artifact digests. Its JavaScript implementation is an auxiliary contract implementation; this is not evidence of RCL-native execution or promotion into RCL Core.

## Ownership and existing VSR Visual IR

VSR already owns the presentation/time-projection IR and execution layer. See [VSR README](../../visual-state-runtime/README.md) and [VSR technical baseline](../../visual-state-runtime/docs/VSR_v0.1_技术基线.md). Its scene, time evaluation, spatial drawing, materials and frame receipts remain under the existing VSR contracts. This RAGF payload does not replace that IR or establish a second canonical owner for presentation semantics.

The candidate payload describes asset generation inputs and outputs. URRF representation family names are consumed from `rncs-core-contract`; they are not independently registered here. Material, bone and layer records permit provider extension fields, but this version validates only the fields described below. Their inclusion does not define new canonical shading, skinning or compositing semantics.

A lossless projection from this payload into VSR is currently missing. UVs, PBR channels, transforms, skin weights, morphs, animation/time semantics, camera and layer compositing are not normalized by this payload contract. The existing RAGF/VSR adapter does not constitute a lossless adapter for this new format. Record that integration as an open gap; do not claim VSR rendering, RCL lowering, complete visual quality, or equivalent presentation roots from a valid payload.

## API

`createVisualIR(input)` copies recognized top-level fields, supplies empty optional geometry/material/skeleton/layer/artifact collections, seals the result with `visual_ir_root`, and throws `VISUAL_IR_INVALID` when structural validation fails. Required inputs are `character_id`, a 64-character lowercase SHA-256 `identity_root`, registered `representation_kind`, and `provenance` containing nonempty string `seed`, `generator`, and `version`. This seal is deterministic for the same canonical payload; it does not prove deterministic generation by a model.

`geometry.vertices` contains finite `[x,y,z]` vectors. `geometry.triangles` contains three distinct in-range integer vertex indices and must have nonzero computed area. `geometry.material_ids` assigns one existing material ID to every triangle. `character-mesh` requires nonempty vertices and triangles; other families permit empty geometry. This validation does not establish watertightness, normal orientation, manifold topology or useful appearance.

`materials` contains records with unique nonempty `id`. `skeleton.bones` and `layers` contain unique `id` and explicit `parent_id` (null for roots); parent references must resolve and graphs must be acyclic. This checks hierarchy integrity, not anatomical correctness, binding weights or animation quality.

`artifacts` contains unique `id`, `sha256` and nonnegative safe-integer `byte_length`. `validateVisualIR(ir)` returns `{valid, errors}` and checks both structural relations and `visual_ir_root`. Identity is a bound reference, not proof of character identity in rendered pixels.

`verifyVisualArtifacts(ir, artifacts)` accepts `{id, bytes}` records with UTF-8 string or `Uint8Array` bytes. It rejects missing, undeclared, duplicate, wrong-length and wrong-digest artifacts. The sealed report contains `verification_root`, `valid`, `errors`, `identity_evidence: 'REFERENCE_BINDING_ONLY'`, `perceptual_consistency: 'NOT_EVALUATED'`, `reproducibility: 'CONTENT_INTEGRITY_ONLY'`, and `authority: 'CANDIDATE_ONLY'`. An empty manifest can pass structural verification without proving any generated media exists.

## Schema and evidence boundary

[JSON Schema](../schemas/visual-ir.v0.1.schema.json) describes emitted JSON structure. Runtime validation additionally enforces indexed geometry bounds and area, unique record IDs, parent resolution/cycles, material assignment relationships, canonical roots and actual artifact bytes. JSON Schema alone cannot establish these cross-field and cryptographic properties. Provider extension fields are preserved and sealed but are not interpreted as validated visual semantics.

The focused `tests/visual-ir.test.mjs` suite exercises deterministic sealing, all registered families, root tampering, required identity/provenance, malformed geometry, hierarchy failures and actual byte mismatches. Those are local contract tests, not rendered-image, external-provider, target-hardware or perceptual quality evidence.
