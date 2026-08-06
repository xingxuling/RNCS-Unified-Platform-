# ADR: Native Visual Render Backend v0.1

- Status: accepted for Phase 6 implementation
- Date: 2026-08-07
- Scope: RNCS Anime Forge v0.1 Phase 6 native visual genesis shot

## Context

Phase 4 already has a deterministic CPU PNG rasterizer and real FFmpeg media closure. Phase 5A/5B define an external visual compatibility layer, but Phase 5B is blocked on a real external model executor and must not become the native acceptance dependency. The current audited machine is Windows/AMD/CPU-first, with no confirmed Godot or Blender executable on PATH and no NVIDIA/CUDA runtime.

Phase 6 needs a backend that consumes RNCS-owned Visual Genome, Body Graph, Performance, Scene Field and Style Law objects, produces real frames, can be replayed from roots, and cannot acquire Episode or Character authority.

## Options

### A. RNCS Custom 2D/2.5D Native Renderer

- Current machine: available through Node.js and the existing raster primitives.
- RNCS IR: direct.
- Determinism: controllable and testable.
- Evidence: frame, depth, mask, line and light outputs can be rooted together.
- Main risk: it could regress into paper-card animation unless body topology, joints, depth, occlusion, contact, style laws and typed performance are enforced.

### B. Godot 4 adapter

- Strong future preview, camera, skeletal, shader, particle and interactive capabilities.
- Not available as a current-machine Phase 6 acceptance executable in the audited environment.
- A Godot renderer would still require RNCS-owned body/style generation and an import/export receipt.

### C. Blender NPR / Grease Pencil / Freestyle adapter

- Strong geometry, camera, lighting, occlusion and offline NPR potential.
- Not available as a current-machine Phase 6 acceptance executable in the audited environment.
- Automation and asset generation would add a second integration surface before the native contract is proven.

### D. Hybrid

- Useful after a stable native contract exists: custom renderer for deterministic preview, Godot or Blender for optional execution.
- Too broad for a first native acceptance slice; three partial backends would weaken evidence.

## Decision

Select **A: RNCS Custom 2D/2.5D Native Renderer** as the only Phase 6 main acceptance backend.

The backend is implemented as a derived executor under `@taowind/native-visual-genesis-runtime`. It compiles:

`Character Genome -> Character Visual Genome -> Character Body Graph -> Performance Frame -> Scene Frame -> Style Projection -> Native Frame`

It must emit real PNG frames and sidecar depth/mask/line/light roots, then use an explicit FFmpeg/ffprobe path for the final MP4. It does not call an external visual generation model. Godot and Blender may receive later adapters only after this contract is stable; adapter state remains candidate/derived and never becomes Episode or identity authority.

## Consequences

### Positive

- Phase 6 can run on the current AMD/CPU host without CUDA.
- The existing RAGF, Character Genome, VSR, RSR, X-Sheet and Evidence Ledger boundaries remain reusable.
- Deterministic roots can include body topology, performance curves, scene/camera, style laws and frame evidence.
- Native visual quality can be assessed directly against the Phase 4 representative frames.

### Negative

- This is an experimental 2D/2.5D renderer, not a replacement for a mature DCC or commercial Anime production renderer.
- CPU render time may be significant at 1280x720; performance is recorded as evidence and not hidden.
- The first body generator uses parameterized procedural forms. Human visual acceptance and commercial quality remain separate gates.

## Rejected alternatives for this phase

- External Diffusion/Video Model as the main route: rejected because it violates the native acceptance boundary and is blocked on this machine.
- Godot or Blender as the sole main route: rejected because local executable availability and a complete RNCS import/authority path are not proven in the current baseline.
- A fallback to the Phase 4 front-facing card renderer: rejected because it would not cross the native body-generation gate.

## Rollback

Remove the native package and Phase 6 entrypoint, restore the Phase 4 renderer as an explicitly older reference path, and retain all Episode/Genome roots. A failed native render must produce a blocked receipt, never a successful placeholder MP4.

## Evidence required

- Native renderer/backend manifest and root.
- Visual Genome, Body Graph, topology, skeleton and rig receipts.
- Performance curves including anticipation, action, overshoot and settle.
- Scene/camera/style roots and frame state roots.
- Real PNG frame sequence plus depth, mask, line and light outputs.
- Real WAV, MP4 and ffprobe report.
- A/B package against Phase 4, visual residual report and scoped repair receipt.
- Performance report with CPU/GPU/RAM, render time and output size.

## Boundary

This ADR selects an execution backend. It does not grant `Native 5-second shot = passed`, `Human visual acceptance = accepted`, or `Commercial Anime quality = approved`. Those fields require actual output and human review.
