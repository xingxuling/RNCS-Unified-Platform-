# Phase 6.2 Implementation Plan

## Diagnosis

The Phase 6.1 frame is registered as a RED morphology regression fixture. The
current path has body dimensions in `createBodySurface`, joint coordinates in
`poseForFrame`, and face, hair, joint, and hand decisions in `renderer.mjs`.
That is not a canonical morphology pipeline.

## Authority flow

`Character Genome -> Canonical Morphology Compiler -> Canonical Morphology
Asset -> Kinematic Solver -> Deformation Solver -> Posed Character Geometry ->
Camera Projection -> Style Projection -> Raster Renderer`

The public compiler surface stays small: `compileMorphology(genome,
morphologyProfile)`. Internal proportion, skeleton, volume, surface, face,
scalp, garment, and certificate construction remains private to the module.

## Vertical slices

1. Slice A: derive proportions, laws, and a hierarchical skeleton; keep bone
   lengths pose invariant and make Genome variants produce different legal
   geometry.
2. Slice B: generate anatomical volumes and a camera-independent 2.5D surface;
   prove neck/ribcage, shoulder/elbow/wrist, palm, and silhouette continuity.
3. Slice C: attach face features to a skull-local surface and project them
   through one head transform for front, 3/4, and side views.
4. Slice D: attach scalp roots to surface coordinates and apply secondary
   motion only in local deformation space.
5. Slice E: derive the current coat from body anchors and an offset garment
   surface.
6. Slice F: move the current primitive implementation into a legacy adapter and
   make the main renderer consume projected frame geometry only.
7. Slice G: integrate performance tracks and deterministic evidence.
8. Slice H: rebuild the five-second shot and compare the new pack against the
   RED fixture without treating the comparison as an automated quality score.

## Skill route and review gates

Architecture route: V3 System Architecture, V1 Software Architecture, V8 Art
Architecture, V9 Meta Architecture, Codebase Design, Diagnosing Bugs, Domain
Modeling, Architecture Engineering Bridge, Architecture Review.

Production route: Production Studio, Art Director, Technical Art, Animation
Director, Creative Production Review. The rendered pack must be inspected
after automated gates are green. A green test suite cannot approve a broken
character image.

## Current phase status

- RED fixture: complete.
- Contract: complete.
- Canonical compiler: complete; all morphology certificate gates pass for the reference Genome.
- Geometry property suite: complete locally; 1000 Genomes x 3 poses x 3 camera configurations.
- Validation Pack: complete locally; each view includes canonical, posed, projected, certificate and raster files.
- Five-second frame sequence: complete locally; 120 deterministic frames across three derived Cuts.
- FFmpeg/ffprobe MP4: blocked on this Windows machine because neither tool is installed; CI installs both and remains the release media gate.
- Visual review: candidate-pending-human-review after a real contact-sheet and action-frame inspection.
- Commercial animation quality: not claimed by this phase.
