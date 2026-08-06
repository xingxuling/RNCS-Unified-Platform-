# RNCS Anime Forge v0.1 Phase 4 Baseline and Phase 5 Engineering Notes

Date: 2026-08-06

## Phase 5 engineering status

Phase 5 Visual Body Replacement is **blocked, not complete**. The new branch is based on `origin/main-95@085a365d002907b17dd87ded56e9ebb5cb26c409` and selects one real execution boundary, `rncs.visual.local-diffusion-video-worker`, as the future local Diffusion/Video route. Its external-process adapter records model, license, input roots, seed, parameters, runtime, GPU, timing, output frames and failure classification, and fails closed when the runtime, model, reference pack, condition pack or output is unavailable.

The current machine audit found no usable visual model, Diffusers/ComfyUI runtime, CUDA/ROCm backend, Blender/Godot visual Provider, remote visual API configuration, FFmpeg or ffprobe. Therefore this phase produces no Phase 5 MP4/WAV and makes no visual-quality acceptance claim. The candidate is `blocked` with `MODEL_MISSING`, human visual acceptance is `pending`, and automatic scores cannot select or commit it. Phase 4 media remains the negative visual baseline only.

Delivered Phase 5 engineering artifacts include Visual Provider/Model Manifest schemas, Character Reference Pack and Condition Pack contracts, Candidate Visual Branch state transitions, temporal/spatial/patch evidence, distinct ledger hash namespaces, a blocked-run evidence bundle and the Reality Studio visual-quality workspace/API with desktop/mobile regression coverage.

Evidence: `evidence/anime-forge-phase5-visual-body-v0.1/evidence-summary.json`, `visual-evidence-ledger.json`, `visual-baseline-comparison.md` and `phase4-phase5-contact-sheet.png`.

## Delivered

- Episode-authoritative Provider, Composition and Camera contracts.
- RAGF Character Genome continuity, stable appearance roots and experimental built-in Anime asset families.
- Three derived Cuts across a 20-second, 480-frame Micro-Episode.
- Frame-aligned camera easing, hair, coat, breathing and foreground parallax tracks.
- Layered background, atmosphere, character, foreground, effects, lighting and correction composition.
- Voice-authoritative phoneme/viseme mouth timing and a real mixed programme WAV.
- Real FFmpeg H.264/AAC MP4 mux with ffprobe duration, frame, resolution, frame-rate and audio validation.
- Reality Studio programme-quality workspace and read-only media/Evidence Ledger endpoints.
- Provider timeout/fallback, missing FFmpeg, continuity, seam, sync, deterministic rebuild and desktop/mobile regression tests.

## Evidence

`evidence/anime-forge-phase4-v0.1/episode.mp4` is a real 20-second 960x540 MP4 containing all three Cuts and a 20-second AAC audio stream. Its SHA-256 is `a63a1a1aa37e4565b8bbf8c7a6e5bb523b4204776c2c9e6cf564393515cb8e81`.

The two evidence builds match on all 12 declared deterministic roots. The Evidence Ledger root is `fd802746592470d8f8d6e374e25c351849d8e0b3b51ba3e4105fc8dea1baf9c0`; the compact evidence summary root is `044d5490e95ac0178a2fd09ddb68c0a85ceda5cdb8aad5426e20c5e7af1d0096`.

## Compatibility

Phase 3 multi-Cut IR, editorial timeline, legacy `production.cut`, Cut render/replay and existing CLI actions remain available. Cut selection now changes only the inspection cursor and no longer rewrites the Production IR.

## Boundaries

This is an experimental media foundation. It does not claim commercial Anime art quality, professional actor performance, physical secondary motion, GPU/DCC parity, clean-machine acceptance or broadcaster approval.

## Next entry

The next phase starts with human direction and art review against the current Evidence Ledger, followed by optional external image/animation, voice and DCC Providers under the same manifest and Episode-authority contracts.
