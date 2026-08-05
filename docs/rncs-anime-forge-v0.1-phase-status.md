# RNCS Anime Forge v0.1 Phase Status

- Date: 2026-08-06
- Worktree: `codex/rncs-ue-high-fidelity-v01`
- Status: **Phase 1 evidence complete; Phase 2 contracts active; overall Anime Forge foundation remains in progress.**

## What is runnable

The reference Cut `《神临者言律》/EP01/S01` can be executed through one deterministic local chain:

`Anime RCL -> RCL shadow program/bytecode -> Anime Production IR -> X-Sheet -> RAGF Anime Asset Families -> VSR Anime Rendering Profile -> RSR director-overridable secondary motion -> Voice/Viseme -> Audio stems/master -> PNG frames -> Evidence Ledger -> RNCS Control Plane candidate`

Reality Studio exposes the same chain at `/anime-forge.html`. The CLI lives in `packages/integration/rcl-anime-production-bridge/src/cli.mjs`; the control-plane candidate CLI is `src/control-plane-cli.mjs`.

## Current evidence gates

- Production IR and X-Sheet: implemented and validated; finite animation is explicitly stepped and does not silently become game-style interpolation.
- RCL bridge: Anime source is parsed with source locations, lowered to valid RCL, compiled to core RCL bytecode, and carries a source map.
- RAGF: the compiler writes character and background Anime Asset Families with actual SVG files, family roots, continuity metadata, and provider receipts.
- VSR: `vsr.anime-rendering-profile.v0.1` is executed by the frame renderer and included in frame evidence.
- RSR: `rsr.anime-secondary-motion-profile.v0.1` executes deterministic hair/coat motion and bounded director overrides.
- Voice Forge: the reference provider emits PCM WAV, transcript, phoneme and viseme timelines; a replacement take preserves asset roots and leaves one active dialogue take.
- Audio Forge: dialogue, ambience, foley, SFX, music and master WAVs are written with roots and loudness estimates.
- Control Plane: Anime output is represented as a non-committing candidate with branch, authority requirements, evidence requirements, state root and rollback policy. `commit_permitted` is intentionally false.
- Studio: compile, X-Sheet, Voice, render, mix, verify, replay, snapshot, rollback and control-plane candidate routes are covered by an API test.

## Not yet a production-complete claim

- The built-in voice is synthetic reference audio, not a human Japanese/Chinese performance or a licensed actor take.
- The built-in renderer is a deterministic procedural Anime reference rasterizer, not commercial TV/film quality and not GPU/provider parity.
- RAGF Anime families are reference SVG assets, not a cleared external art-provider delivery.
- Physical cloth/hair simulation, full 3D-assisted Anime production and multi-cut editorial scheduling remain open implementation gates.
- MP4 export is encoder-dependent. On the current machine `ffmpeg`/`ffprobe` are unavailable, so no fake or static MP4 is emitted.
- The current compatibility compiler intentionally lowers the first episode/scene/cut; the IR and contracts are designed for extension, but multi-cut production has not been claimed as complete.

## Latest local run

- Output directory: `tmp/anime-forge-phase2`
- Compiled root: `8666382b0f726b97d28ddd0d7159beb60107f7a1d91bbb9f91c619d6e213c499`
- Voice-bound production root: `63e708247909cf78bda73dff9f92d94e4605cbd1afd9ee81b364a21689ccbe54`
- Frame sequence root: `8bcfdf9c8db0fb4e47b37edcb5b303dd4e9142030d381ca74791d3d0a37ce705`
- Evidence Ledger root: `6f34b25e6c5493ef49c9d315067abcfc01fbc7ced482389e624f6a5035c78378`
- Audio root: `0d26b8f69f35da493772b9d3cfcb0038f2a43a064c13e9f3f408dd9b47e5c7ab`
- Control Plane candidate root: `220ac113c802af0d0f03b2fd055440cf4fd62d99d0d4002eb35c4a1f09aea5f4`
- Source package manifest: `tmp/anime-forge-source-package/source-package-manifest.json`

The source archive is `tmp/RNCS-Anime-Forge-v0.1-source.zip`. Its manifest contains 50 source and contract files; the current package root is recorded in that manifest.

## Verification

```text
npm run test:anime-forge
npm run anime:control-plane
npm test --workspace @taowind/reality-studio-native
```

The focused Anime Forge suite currently covers the IR/X-Sheet, RCL bridge, VSR/RSR adapters, Voice, Audio, control-plane candidate and Studio API chain. The full Reality Studio suite remains a separate regression gate.

## Release boundary

This document records implemented evidence and known boundaries. It is not a declaration that the overall RNCS Anime Forge foundation is complete. Future phases must add the remaining production capabilities and extend this ledger with their own reproducible receipts.
