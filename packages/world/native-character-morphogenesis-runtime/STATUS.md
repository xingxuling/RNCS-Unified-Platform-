# Status

## Phase 6.6 candidate — Native Anime Drawing Infrastructure

Current stacked branch extends the Phase 6.5 Character Drawing Compiler into a backend-neutral, full-body native drawing candidate:

```text
Character Genome
→ Canonical / Semantic Morphology
→ Lower-Body Morphology Extension (candidate)
→ FullBodyCharacterDrawing
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
- Performance-driven controls for hair lag, garment lag, breathing and sleeve follow-through.
- Deformed mesh can be compiled back into DrawingIR without granting the renderer identity or anatomy authority.
- Existing `body.leg_length` genome input now drives a candidate canonical lower-body proportion solution.
- Candidate bilateral skeleton: `pelvis → hip → thigh → knee → shin → ankle → foot`.
- Candidate implicit lower-body fields: Hip / Thigh / Knee / Shin / Foot, then canonical mesh extraction and CPU skinning.
- LowerBodyMorphologyCertificate measures bone-chain presence, field-chain presence, mesh connectivity, bilateral canonical symmetry, leg proportion, foot surface evidence and self-intersection.
- FullBodyCharacterDrawing rejects upper-body-only assets instead of letting the renderer invent legs.
- Full-body DrawingIR emits canonical leg and foot silhouettes and can pass through the same DrawingMesh/Cage layer.
- Full-body-only performance state adds bounded weight shift, knee relaxation and ankle compensation through the existing FK path; upper-body assets retain their previous performance state.
- Phase 6.6 build script is wired for 120 frames / 5 seconds / 1280×720 through full-body morphology → DrawingIR → cage deformation → SVG/librsvg → FFmpeg.

Verification boundary:

- implementation status: `candidate`
- CI status: `blocked-by-billing`
- GitHub runner status: `not-started-by-provider`
- full-body morphology status: `implemented-unverified-on-clean-runner`
- drawing mesh deformation status: `implemented-unverified-on-clean-runner`
- current-head media artifact: `not-produced`
- human visual acceptance: `pending`
- creative production review: `pending-human-review`
- commercial anime quality: `not-proven`

GitHub Actions is currently blocked before runner start by an account-level billing/spending-limit condition. No Phase 6.6 completion, lower-body PASS or visual-quality PASS may be claimed until a real runner executes the focused tests/full regression/build and the resulting artifact is reviewed.

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
