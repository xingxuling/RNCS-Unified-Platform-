# RNCS Anime Forge v0.1 Phase 4 Release Notes

Date: 2026-08-06

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
