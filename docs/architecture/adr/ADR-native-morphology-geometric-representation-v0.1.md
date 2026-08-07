# ADR: Native Morphology Geometric Representation v0.1

- Status: accepted for Phase 6.3 implementation, subject to measured gates
- Date: 2026-08-07
- Scope: RNCS Anime Forge native character morphology
- Authority: existing canonical morphology compiler

## Context

Phase 6.2 corrected several ownership problems but still ends in contour primitives. It has no continuous implicit representation, no canonical triangle surface, no real depth buffer, and no measured topology certificate. The supplied human rejection fixture confirms that a visually plausible candidate can still contain disconnected anatomical regions.

The system must preserve the public `compileMorphology(genome, profile)` contract and must not create a competing morphology authority.

## Options considered

### Option A: deterministic implicit field, then canonical mesh

Build analytic signed-distance-like fields for skull, neck, ribcage, pelvis, deltoids, limbs, elbows, forearms, palms, clothing, and hair envelopes. Combine fields with smooth union/intersection and bounded subtraction. Extract a camera-independent triangle mesh on a deterministic CPU grid. Skin the mesh with bone weights and feed it to a depth-aware visibility kernel.

Strengths:

- Existing Phase 6.2 ellipsoid, capsule, wedge, and blend concepts map directly to fields.
- Continuity and disconnected-component checks operate on one geometric source.
- Deterministic CPU execution is available in CI without a GPU.
- Depth, curvature, normals, attachments, and topology have a real representation.

Costs:

- Mesh extraction resolution bounds small features.
- Field blending needs explicit semantic-region ownership.
- Extraction and visibility need performance limits and evidence of those limits.

### Option B: authored parametric mesh plus skinned mesh

Create a canonical template mesh with explicit vertices, faces, UVs, material regions, and bone weights, then deform it with LBS or dual quaternions.

Strengths:

- Predictable topology and explicit feature attachment.
- Efficient runtime skinning after authoring.
- Fine control of hair and garment topology.

Costs:

- It introduces a large authored asset dependency before the current field contract exists.
- Morphology genome changes need a mesh fitting or retopology policy.
- It risks making a second shape authority beside the existing volume compiler.

### Option C: contour-only 2.5D upgrade

Keep polygons and add a `z` value and camera scaling.

Rejected because it cannot prove continuous surfaces, body self-occlusion, depth order, surface attachment, or connected topology. It would reproduce the Phase 6.2 failure under a new name.

## Design it twice

The two viable designs were evaluated against source-of-truth ownership, deterministic buildability, geometric truth measurement, animation deformation, and migration risk. Option A is selected as the Phase 6.3 foundation. Option B remains a future optimization or authored asset provider only if it consumes the same canonical morphology contract and passes the same certificate. It cannot become a parallel authority.

## Decision

Use a deterministic implicit morphology field compiled by `canonical-morphology.mjs`, extracted to a canonical surface mesh, then deformed by a surface skinning runtime. The field and mesh are normalized and independent of camera, output resolution, and style. The visibility kernel consumes the posed mesh and produces depth, normal, surface, and region buffers. Anime grammar runs after visibility.

The Phase 6.2 primitive contour path remains for legacy regression and compatibility only. Phase 6.3 acceptance must use the field-to-mesh-to-visibility path.

## Required contracts

Each field primitive includes:

`field_id`, `attached_bone`, `local_transform`, `shape_parameters`, `field_function`, `blend_group`, `material_region`, `semantic_region`, `identity_weight`, and `deformation_policy`.

Each canonical mesh includes vertices, normals, triangles, region IDs, bone weights, material IDs, surface groups, adjacency, boundary edges, connected components, and `mesh_root`.

Each certificate gate includes `measurement`, `allowed`, `method`, `evidence_root`, and `pass`. Direct boolean-only gates are invalid.

## Consequences

Positive consequences:

- Geometry is measurable before projection and stylization.
- A continuous source can drive face, hair, garment, skinning, and visibility evidence.
- The same compiler output can be replayed in Reality Studio and CI.

Negative consequences:

- Phase 6.3 may produce a foundation package if the static three-view gate is not visually acceptable.
- Low-resolution deterministic extraction will not prove commercial quality.
- Human visual acceptance remains a separate gate.

## Rollback

The Phase 6.3 path is profile-gated. Roll back the new commits or select the legacy Phase 6.2 profile while preserving the old API and tests. Never delete Phase 6.2 evidence to make the new gate appear green.
