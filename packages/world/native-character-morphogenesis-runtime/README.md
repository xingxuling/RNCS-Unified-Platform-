# Native Character Morphogenesis Runtime

Phase 6.2 deterministic CPU runtime for the RNCS Anime Forge Canonical Morphology
Kernel, with Phase 6.1 legacy surgery compatibility retained behind an explicit
adapter.

The main path is intentionally one-way:

`Character Genome -> Canonical Morphology Compiler -> Canonical Morphology Asset -> Kinematic Solver -> Deformation Solver -> Posed Character Geometry -> Camera Projection -> Style Projection -> Raster Renderer`

The renderer receives projected geometry and style only. Body dimensions, feature
anchors, scalp attachment and joint envelopes are not authored in the renderer.

This is an experimental 2D/2.5D implementation. It is not a claim of commercial
animation quality or full 3D skinning parity.

The package exposes `buildPhase62Evidence()` and `validatePhase62Evidence()` for the
ten-view Validation Pack, the 120-frame three-Cut shot, deterministic WAV, real
FFmpeg/ffprobe MP4 closure, continuity reports, SHA-256 manifest and Evidence
Ledger. A missing media tool is a hard failure and never becomes a synthetic MP4.

`renderAnatomyFrame()` remains available only through `LegacyPrimitiveRenderer` so
Phase 6 and 6.1 regression tests can continue to run without making the old path
the Phase 6.2 authority.
