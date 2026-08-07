# Status

## Phase 6.6 candidate — Native Anime Drawing Infrastructure

Current stacked branch adds a backend-neutral drawing stack on top of the Phase 6.5 Character Drawing Compiler:

```text
Character Genome
→ Canonical Morphology
→ Semantic Anatomy
→ CharacterDrawingCompiler
→ AnimeDrawingIR (cubic Bezier)
→ DrawingMeshIR / 3×3 quadratic cage
→ bounded 2D deformation
→ SVG/librsvg first backend
→ future Skia / Godot / Blender adapters
```

Candidate capabilities:

- Cubic-Bezier drawing IR with explicit layer/z semantics.
- SVG serializer and `librsvg` CPU backend contract.
- DrawingMeshIR generated from closed drawing paths.
- Deterministic 3×3 cage weights for each mesh vertex.
- Bounded cage deformation with triangle-inversion rejection.
- Performance-driven candidate controls for hair lag, garment lag, breathing and sleeve follow-through.
- Deformed mesh can be compiled back into DrawingIR without granting the renderer identity or anatomy authority.
- Lower body remains explicitly absent because Canonical Skeleton v0.1 does not represent it.

Verification boundary:

- implementation status: `candidate`
- CI status: `blocked-by-billing`
- drawing mesh deformation status: `implemented-unverified-on-clean-runner`
- human visual acceptance: `pending`
- creative production review: `pending-human-review`
- commercial anime quality: `not-proven`

GitHub Actions is currently blocked before runner start by an account-level billing/spending-limit condition. No Phase 6.6 completion or visual-quality PASS may be claimed until a real runner executes the tests/build and the resulting artifact is reviewed.

## Phase 6.2

- Canonical Morphology Compiler: implemented, genome-driven and certificate-gated
- Morphology Law Set: implemented with hard constraints, stylization ranges and identity invariants
- Hierarchical FK skeleton: implemented; pose changes joint transforms, not bone lengths
- Anatomical volume layer: implemented for skull, neck, ribcage, pelvis, deltoid, limbs, elbows and palms
- Canonical 2.5D surface: implemented before camera and style projection
- Skull-local face surface: implemented with shared feature anchors
- Scalp / hair field: implemented with root attachment and bounded secondary motion
- Garment offset surface: implemented for the coat and connected sleeves
- Renderer adapter: implemented; main renderer consumes projected geometry and style only
- Geometry property suite: 1000 genomes x 3 poses x 3 camera configurations
- Validation Pack: implemented with canonical, posed, projected, certificate and raster evidence
- Five-second shot: implemented as 120 frames across three derived Cuts
- MP4: real FFmpeg/ffprobe path implemented; local tool absence remains fail-closed
- Human visual acceptance: pending; automated GREEN is not a creative approval
- Commercial Anime quality: not proven

## Legacy compatibility

- Body Surface 2.0: retained as a compatibility projection of the canonical asset
- Face Rig 2.0: implemented, shared local anchors and projection verified
- Hair Topology 2.0: implemented, scalp attachment and lag track verified
- Joint Deformation 2.0: implemented, volume and local repair receipt verified
- Anatomy Validation Pack: implemented, ten views from one genome
- Native shot: implemented, 120 frames at 1280x720 and 24 fps
- MP4: real FFmpeg/ffprobe path implemented; tool absence remains fail-closed
- Human visual acceptance: always separate and pending until a human receipt exists
- Commercial Anime quality: not proven
