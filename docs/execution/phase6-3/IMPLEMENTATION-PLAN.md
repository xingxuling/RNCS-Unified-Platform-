# Phase 6.3 Implementation Plan

## Current phase state

The worktree starts from the merged Phase 6.2 baseline. Review and ADR are recorded before source implementation. The first source gate is a measured RED oracle over the old contour output.

## Slices

### Slice A: law enforcement

Add relational proportion and joint constraints to the existing canonical compiler. Return requested values, solved values, ratio measurements, adjustment records, and a deterministic constraint root. Reject impossible ranges explicitly.

Exit: default genome is measured inside allowed ranges; an illegal fixture is projected or rejected with evidence; no renderer-owned body dimensions remain.

### Slice B: continuous field

Upgrade the existing volume descriptors into named implicit fields with smooth union, smooth intersection, and bounded subtraction. Add field sampling and break/overlap/collapse diagnostics.

Exit: field schema is complete, deterministic, and used by the canonical compiler.

### Slice C: canonical surface mesh

Extract a bounded camera-independent surface mesh. Add normals, semantic/material regions, bone weights, adjacency, boundary edges, connected components, and mesh-root hashing.

Exit: mesh topology and continuity are measured, not inferred from a contour list.

### Slice D: surface skinning

Apply deterministic CPU skinning to mesh vertices using canonical bone weights. Pose changes bone transforms only and produces a new posed mesh.

Exit: neutral and action poses have stable mesh identity and measured joint continuity.

### Slice E: face attachment

Create face surface patches and `SurfaceAttachment` records. Bind eyes, nose, mouth, and brows to skull surface parameters before pose, visibility, and projection.

Exit: features remain on the face surface under neutral and yaw views; containment and depth order are measured.

### Slice F: scalp, hair, and garment

Create scalp attachments, hair roots, guide curves, mass envelopes, secondary locks, and garment surface panels with clearance and penetration checks.

Exit: root distance, connected hair mass, garment attachment, and penetration gates have evidence.

### Slice G: visibility and projection

Rasterize posed triangles into depth, surface, region, normal, and visibility buffers. Apply clipping, backface handling, and body/hair/face occlusion before anime styling.

Exit: `cos(head_yaw)` is not used as a depth substitute; visibility reports are reproducible.

### Slice H: AnimeVisualGrammar v0.2

Extend style parameters for region-aware line/fill, controlled exaggeration, plane hierarchy, lighting, depth cues, overlap policy, and geometry/visibility prerequisites.

Exit: style consumes geometry and visibility evidence and cannot certify anatomy.

### Slice I: static validation pack and Studio

Build front, three-quarter, and side neutral packs. Add geometric truth status and evidence navigation to Reality Studio. Run desktop/mobile regression.

Exit: all static gates are green or the package is explicitly foundation-only with a failed visual closure.

### Slice J: episode media

Only after A-I are green, build the five-second episode path and verify MP4/WAV/ffprobe/hash/replay evidence. If any static gate fails, record the failure and do not call media a phase acceptance artifact.

## Performance budget

The default field and mesh resolution is bounded and configurable. Property fuzz may use a reduced deterministic resolution while preserving all topology and certificate checks. Build evidence records sample count, extraction time, peak memory, visibility resolution, and tool versions.

## Non-goals

This phase does not prove human approval, commercial anime quality, GPU acceleration, a production asset library, or parity with Godot/Unity.
