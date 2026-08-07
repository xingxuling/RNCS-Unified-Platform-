# Status

## Phase 6.6 candidate — Native Anime Drawing Infrastructure

Current stacked branch extends the Phase 6.5 Character Drawing Compiler into a backend-neutral, full-body native drawing candidate:

```text
Character Genome
→ Canonical / Semantic Morphology
→ Lower-Body Morphology Extension (candidate)
→ Canonical Surface Mesh
→ FieldGuidedSurfaceWeights
→ FK / multi-bone LBS / Visibility
→ HeadSurfaceDrawingGuide
→ FaceSurfaceDrawingGuide
→ HairSurfaceDrawingGuide
→ MeshSilhouetteDrawingGuide (torso + neck + bilateral arms/hands/legs/feet, multipart occlusion)
→ FullBodyCharacterDrawing / AnimeDrawingIR
→ DrawingMeshIR / 3×3 quadratic cage
→ bounded no-inversion 2D deformation
→ DrawingPresentationTransform
→ SVG/librsvg first backend
→ future Skia / Godot / Blender adapters
```

Candidate capabilities:

- Cubic-Bezier drawing IR with explicit layer/z semantics.
- SVG serializer and `librsvg` CPU backend contract.
- DrawingMeshIR generated from closed drawing paths with deterministic 3×3 cage weights and bounded no-inversion deformation.
- Existing `body.leg_length` Genome input drives a candidate canonical lower-body proportion solution and bilateral `pelvis → hip → thigh → knee → shin → ankle → foot` chains.
- Hip / Thigh / Knee / Shin / Foot implicit fields rebuild the Canonical Surface Mesh; LowerBodyMorphologyCertificate binds bones, fields, mesh connectivity, skin-weight evidence and self-intersection.
- Full-body-only performance adds bounded weight shift, knee relaxation and ankle compensation through the existing FK path; upper-body assets keep previous behavior.
- FieldGuidedSurfaceWeights preserves Canonical Mesh authority while producing a separately rooted, normalized, maximum-four-influence weighted mesh for the existing LBS runtime.
- MeshSilhouetteDrawingGuide consumes the weighted posed mesh plus Visibility/SurfaceId buffers. Torso, neck, bilateral arms, hands, legs and feet now derive large-form drawing contours from the actually visible deformed surface rather than only projected skeleton points.
- Mesh silhouette extraction is semantic-region-first with bone-weight fallback and preserves multiple significant visible parts through occlusion instead of forcing disconnected visible segments into one polygon.
- HeadSurfaceDrawingGuide extracts the visible weighted skull silhouette and applies only a bounded Anime jaw/chin taper.
- FaceSurfaceDrawingGuide places/hides eyes, brows, nose and mouth from skull SurfaceAttachment feature samples and real depth/visibility rather than front/3Q/profile screen-ratio guesses.
- HairSurfaceDrawingGuide projects scalp attachments and hair guide curves through the posed skull. Hair secondary motion can modify non-root guide points while scalp roots remain invariant.
- DrawingPresentationTransform performs framing after validated DrawingIR and cannot alter identity, canonical morphology or drawing authority roots.
- Direct Head / Face / Hair / Mesh evidence scripts prove that these surface-derived organs actually change final DrawingIR paths; DirectVisualBridge binds all four evidence roots into the main Evidence Ledger.
- Phase 6.6 build path is wired for 120 frames / 5 seconds / 1280×720 through weighted full-body surfaces → surface-driven DrawingIR → cage deformation → presentation → SVG/librsvg → FFmpeg.

Verification boundary:

- implementation status: `candidate`
- CI status: `blocked-by-billing`
- GitHub runner status: `not-started-by-provider`
- full-body morphology: `implemented-unverified-on-clean-runner`
- field-guided multi-bone weighting: `implemented-unverified-on-clean-runner`
- head surface drawing: `implemented-unverified-on-clean-runner`
- face surface drawing: `implemented-unverified-on-clean-runner`
- scalp hair surface drawing: `implemented-unverified-on-clean-runner`
- weighted torso/neck/limb/hand/foot mesh silhouette drawing: `implemented-unverified-on-clean-runner`
- DrawingMesh/Cage deformation: `implemented-unverified-on-clean-runner`
- DrawingPresentation: `implemented-unverified-on-clean-runner`
- current-head media artifact: `not-produced`
- human visual acceptance: `pending`
- creative production review: `pending-human-review`
- commercial anime quality: `not-proven`

GitHub Actions is currently blocked before runner start by an account-level billing/spending-limit condition. No Phase 6.6 completion or visual-quality PASS may be claimed until a real runner executes the focused tests/full regression/build, all four direct visual evidence chains bind successfully, and the resulting artifact is reviewed by a human.

## Phase 6.2

- Canonical Morphology Compiler: implemented, genome-driven and certificate-gated
- Morphology Law Set: implemented with hard constraints, stylization ranges and identity invariants
- Hierarchical FK skeleton: implemented; pose changes joint transforms, not bone lengths
- Anatomical volume layer: implemented for skull, neck, ribcage, pelvis, deltoid, limbs, elbows and palms
- Canonical 2.5D surface: implemented before camera and style projection
- Skull-local face surface: implemented with shared feature anchors
- Scalp / hair field: implemented with root attachment and lag track verified
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
