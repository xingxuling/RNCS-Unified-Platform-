# Phase 5 Reproducible Build

## Contract and blocked evidence

From the fresh Phase 5 worktree:

```text
npm ci --ignore-scripts
npm run build:world
npm run evidence:anime-phase5-visual
npm run verify:anime-phase5-visual-evidence
```

The evidence command is expected to succeed even when visual generation is blocked. It must write a blocked report under `evidence/anime-forge-phase5-visual-body-v0.1/`, including the Provider manifest, model manifest, Character Reference Pack, Condition Pack, candidate branch, execution receipt, temporal/spatial reports, A/B comparison, contact sheet, Evidence Ledger and file SHA-256 ledger. It must leave `media.mp4` and `media.wav` null when no real Provider executes. The verification command builds twice and compares stable roots; instantaneous machine observations remain explicitly volatile file evidence.

## Verification matrix

```text
npm test --workspace @taowind/anime-production-runtime
npm test --workspace @taowind/rcl-anime-production-bridge
npm test --workspace @taowind/reality-studio-native
python apps/reality-studio/tests/browser_anime_forge_phase5_visual_test.py
npm run test:anime-phase4
npm run package:anime-phase5-visual
```

The real FFmpeg Phase 4 test is conditional on `FFMPEG_PATH` and `FFPROBE_PATH`. If those tools are absent, the test is skipped and the absence remains a blocker; a PNG sequence, JSON report or ZIP is never renamed as MP4.

## Future external-provider run

After model, license, references, conditions and worker configuration are installed, rerun the same evidence command with `VISUAL_PROVIDER_EXECUTABLE` and, if needed, `VISUAL_PROVIDER_ARGS_JSON`. The resulting candidate must pass real frame validation before a human reviews the ordinary viewer comparison. Only an explicit authorized selection may create a commit preview or commit receipt.

The final visual run must add real `episode.mp4`, final-mix `episode.wav`, frame manifest, Provider/Model manifests, continuity reports, ffprobe report, Evidence Ledger, SHA-256 namespaces and a source-package hash. Until then, the Phase 5 status remains blocked.
