# RNCS Anime Forge v0.1 Phase 4 Federation Review

- Review date: 2026-08-06
- Repository: `xingxuling/RNCS-Unified-Platform-`
- Baseline: `main-95@ef81e8fa311a029db5540c5af90ab1f4a283a141`
- Worktree: isolated `rncs-anime-forge-phase4-v01`
- Branch: `codex/rncs-anime-forge-phase4-v01`
- Decision: implementation may begin only after every gate below has an explicit verdict.

## Problem Definition

Phase 4 is not a new Cut demo. It is the first bounded Episode-level media closure for Anime Forge:

`Episode Intent -> derived Cuts -> reusable Clips -> local Patches -> global Continuity -> real frames + WAV -> real FFmpeg mux -> verified MP4 -> Evidence Ledger`

The authority invariant is:

`Episode is authoritative. Cut is derived. Clip is reusable. Patch is local. Continuity is global.`

Cut selection in Reality Studio may change the inspection target, but it must not rewrite the authoritative Production root.

## Fact Baseline

### Confirmed repository facts

- PR #55 is present in the baseline and Phase 3 provides multi-Cut Production IR, Editorial Timeline, per-Cut X-Sheets, deterministic PNG rendering, programme audio placement, replay and Studio Cut browsing.
- The Phase 3 reference episode contains 2 Cuts and 168 frames. It is retained as regression evidence and is not the Phase 4 acceptance episode.
- RAGF already contains `generateAnimeCharacterFamily`, `generateAnimeBackgroundFamily`, Character Genome contracts, identity signatures, constraint solving and lineage primitives.
- The current Anime character family emits deterministic SVG reference sheets. The frame renderer emits actual PNG media, but the compiler does not yet bind the full Character Genome, appearance and quality evidence into the Episode.
- VSR resolves explicit camera tracks. RSR resolves deterministic hair and coat motion with director overrides. The X-Sheet does not yet carry a complete resolved motion/composition state.
- Voice Forge emits deterministic non-silent WAV, phoneme and viseme timelines. Audio Forge places Cut-local voices on the global editorial timeline and renders dialogue, ambience, foley, SFX, music and master WAV stems.
- There is no VideoMuxProvider implementation or Phase 4 media validation workflow in the baseline.
- Local baseline validation after dependency installation and world build: Anime editorial `18/18 PASS`; Phase 3 Studio path `1/1 PASS`.

### Confirmed host facts

- Node.js, npm, Git and GitHub CLI are available.
- FFmpeg and ffprobe are not currently on `PATH`.
- Blender and Godot are not currently on `PATH`.
- A local mux attempt must therefore fail closed until an explicit FFmpeg binary is provisioned.
- GitHub Actions can provide FFmpeg on Ubuntu and will be used as an independent media gate and artifact producer.

### Facts not yet proven

- No 20-40 second, 3-Cut Anime Forge MP4 is proven by the baseline.
- No target-machine MP4 decode, frame count, A/V duration or audio-track report is proven by the baseline.
- No commercial Anime art, licensed actor performance, physical cloth/hair, GPU renderer or DCC parity is proven.

## Federation Gates

The gates are executed in the required order. `PASS-TO-IMPLEMENT` means the bounded Phase 4 plan may proceed; it is not a product-quality acceptance claim.

### 1. Founder Twin

- Intent: close a real, replayable media loop without transferring creative authority from Episode Intent to a Provider or selected Cut.
- Product boundary: one 20-second experimental Micro-Episode is evidence for the architecture, not the final scope of Anime Forge.
- Authority: Providers produce candidate media and receipts; RNCS contracts own acceptance and durable evidence.
- Verdict: `PASS-TO-IMPLEMENT`.

### 2. 柳清莲 Gate

- The output must contain a legible continuing character, performance change, dialogue and audiovisual rhythm rather than a technical test card.
- The UI must state failure plainly and must not label a frame directory, GIF or ZIP as MP4.
- Synthetic voice and experimental art quality must remain visible boundaries.
- Verdict: `PASS-TO-IMPLEMENT` with honesty and audience-legibility constraints.

### 3. 洞哥 Grounding

- Reuse the existing deterministic CPU rasterizer, Character Genome, RSR/VSR, Voice Forge and Audio Forge.
- Do not depend on unavailable Godot or Blender for the acceptance path.
- Implement FFmpeg discovery, timeout, process evidence and failure classification before claiming media closure.
- Verdict: `PASS-TO-IMPLEMENT` on the built-in provider plus FFmpeg path.

### 4. 产品文明

- Primary user outcome: open Reality Studio and immediately know whether the Episode is playable, what failed, whether final media exists and what requires human judgement.
- Secondary outcome: inspect Provider use, lineage, continuity, sync and motion without making technical detail the first screen.
- Verdict: `PASS-TO-IMPLEMENT`.

### 5. UX / 设计文明

- First viewport: Episode state, playable state, final-media state, failure summary and next human gate.
- Progressive disclosure: Provider, lineage, Cut seams, A/V sync, motion and Ledger live in detail tabs or sections.
- Desktop and 390px mobile widths must avoid page-level horizontal overflow; wide evidence tables may scroll inside their own region.
- Verdict: `PASS-TO-IMPLEMENT`.

### 6. 动画导演文明

- Acceptance episode: 3 derived Cuts, 20 seconds total, 24 fps, one continuous actor, intentional shot-size/camera changes and readable dramatic progression.
- Cut selection is an inspection concern. Episode pacing, continuity and final output remain programme-level.
- Transitions remain explicit and bounded. A hard cut is valid; unsupported nonlinear transitions must still fail closed.
- Verdict: `PASS-TO-IMPLEMENT`.

### 7. 角色表演文明

- The same identity root, palette, body proportion, face signature, hairstyle and costume family must persist through all Cuts.
- Expression, gaze, blink, pose and viseme-driven mouth state may vary as local performance state.
- At least one dialogue must create non-silent audio and visible mouth-state changes tied to the final audio timeline.
- Verdict: `PASS-TO-IMPLEMENT`.

### 8. 技术美术文明

- RAGF output must bind seed, palette, proportions, face features, hair, costume, expression/pose capabilities, version root, lineage and quality report.
- Final frames must contain semantically meaningful character, background and foreground/effect layers; flat colour cards and test labels are forbidden as acceptance media.
- Experimental asset-quality metrics must be reproducible and must not claim commercial source-art parity.
- Verdict: `PASS-TO-IMPLEMENT`.

### 9. 图形与合成文明

- Add an Episode Composition/Camera contract covering programme resolution/fps, layer order, opacity, crop/mask, camera transform, transition policy, seam checks and exposure/colour anchors.
- Frame evidence must identify resolved layers and camera/composition state.
- ffprobe must validate codec-readable MP4, dimensions, frame rate, video frame count/duration and audio stream.
- Verdict: `PASS-TO-IMPLEMENT`.

### 10. 声音文明

- Voice Forge remains the sole dialogue/viseme authority.
- Audio Forge remains the stem, mix and master WAV authority.
- The media gate compares master WAV duration with timeline and probed MP4 duration and records bounded tolerances.
- Synthetic timbre is acceptable for this experimental gate but cannot be reported as actor-quality performance.
- Verdict: `PASS-TO-IMPLEMENT`.

### 11. 工程文明

- Extend existing packages rather than creating a parallel Anime stack.
- New media orchestration belongs under Anime Production Runtime; RAGF owns asset generation; Studio consumes the same reports.
- Generated full frame sequences and tool binaries remain ignored; compact representative evidence and reports are committed.
- Verdict: `PASS-TO-IMPLEMENT`.

### 12. 代码文明

- Structured JSON schemas and typed runtime contracts precede orchestration code.
- External process invocation uses argument arrays, validated executable paths, explicit timeouts and captured exit evidence; no user-controlled shell command composition.
- Deterministic roots exclude timestamps, host paths and elapsed time.
- Verdict: `PASS-TO-IMPLEMENT`.

### 13. 测试文明

- Preserve every Phase 3 test.
- Add Provider schema, Character Genome continuity, X-Sheet/motion alignment, Cut seam, viseme, frame integrity, audio mix, FFmpeg failure, real MP4/ffprobe, timeout/fallback, double-build and Studio browser tests.
- A unit stub may test failure classification, but only real FFmpeg output satisfies the media acceptance gate.
- Verdict: `PASS-TO-IMPLEMENT`.

### 14. 安全文明

- Media tools receive repository-produced paths only; output paths must remain under the requested build directory.
- Provider failures, timeouts, missing executables, malformed probe output and incomplete frame/audio input fail closed.
- No Provider gains commit, execution-policy or identity-authority rights from successful media generation.
- Verdict: `PASS-TO-IMPLEMENT`.

### 15. 发布文明

- Delivery requires source, tests, compact evidence, reproducible instructions, SHA-256 inventory, GitHub Actions artifact and a green PR.
- A local build and an independent Linux CI build must each record tool versions and roots.
- Release notes must separate editing-kernel, media-pipeline, real-provider, experimental-asset and commercial-quality claims.
- Verdict: `PASS-TO-IMPLEMENT`.

### 16. Integration Court

- Approved dependency order:

  `Episode RCL -> Production IR -> Character Genome/RAGF -> VSR/RSR -> Voice -> X-Sheet -> Frames -> Audio -> FFmpeg -> ffprobe -> Quality Reports -> Evidence Ledger -> Studio`

- Reject any implementation that lets a selected Cut replace the Episode root, lets RAGF rewrite identity, lets a mux receipt validate missing inputs, or lets Studio report playable before probe validation.
- Verdict: `PASS-TO-IMPLEMENT`.

### 17. Evidence Ledger

- Every accepted gate must bind input roots, output roots, Provider receipt roots, tool versions, validation status and explicit boundaries.
- The final Ledger must cover the Production, provider manifest, asset lineage, X-Sheets, frame sequence, master WAV, continuity reports, sync report, ffprobe report, MP4 and SHA-256 manifest.
- A missing required root leaves the media gate incomplete.
- Verdict: `PASS-TO-IMPLEMENT`.

## Impacted Modules

- `packages/world/reality-asset-genesis-fabric`: built-in Anime asset generator, Provider manifest and asset-quality/lineage evidence.
- `packages/world/character-genome-runtime`: identity, appearance and cross-Cut continuity integration.
- `packages/world/anime-production-runtime`: Episode authority, composition/camera, motion alignment, continuity, frame integrity, VideoMuxProvider and media reports.
- `packages/integration/rcl-anime-production-bridge`: programme-level compiler bindings and 3-Cut Micro-Episode source.
- `packages/world/visual-state-runtime`: resolved programme camera/composition evidence where needed.
- `packages/world/reality-simulation-runtime`: explicit secondary-motion track evidence where needed.
- `packages/world/voice-performance-runtime` and `packages/world/audio-scene-runtime`: final dialogue timeline, mix and sync evidence without changing authority.
- `apps/reality-studio`: Episode quality/provider panel and final-media state.
- `scripts`, `.github/workflows`, `docs`, `evidence`: reproducible build, independent CI artifact and release evidence.

## Acceptance Gates

1. Production validation proves Episode authority and at least 3 derived Cuts.
2. Duration is 20-40 seconds at one programme fps and resolution.
3. One actor keeps the same identity, palette, proportions, hair and costume roots across all Cuts.
4. The X-Sheet resolves pose, gaze, blink, viseme, secondary motion, camera and composition state at frame level.
5. The frame sequence is complete, ordered, decodable and contains meaningful visual variation across all Cuts.
6. Master WAV is non-silent, contains dialogue plus at least one other stem and matches the Episode timeline within tolerance.
7. A real FFmpeg process consumes the actual PNG sequence and master WAV and writes `episode.mp4`.
8. ffprobe verifies video and audio streams, fps, resolution, duration and frame count.
9. Two deterministic builds match for declared deterministic roots.
10. Reality Studio passes API, desktop and mobile regressions.
11. GitHub Actions publishes the required media/evidence artifact and all effective CI checks pass.

## Risks And Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| FFmpeg absent locally | Local MP4 blocked | Fail closed, provision an explicit local binary, and independently run Ubuntu CI. |
| 480 frames are slow in the CPU rasterizer | Evidence build timeout | Keep the acceptance episode at 20 seconds and 960x540; record render time but exclude it from deterministic roots. |
| Procedural art is mistaken for commercial quality | False maturity claim | Label it `experimental-built-in-anime`, publish quality metrics and retain the commercial-quality gap. |
| Cut selection mutates Production root | Authority inversion | Make Studio selection session-local and test root stability. |
| Audio and frame timelines drift | Unplayable media | Compute sync report from timeline, WAV header and ffprobe, with explicit tolerance. |
| Provider hangs or writes partial output | Corrupt evidence | Timeout, terminate, classify failure and validate output before Ledger acceptance. |
| Full evidence is too large for Git | Repository bloat | Commit compact reports and representative frames; upload complete media via Actions artifact. |

## Rollback

- Git rollback boundary: one isolated branch and worktree based on `ef81e8f`; no Phase 3 worktree is modified.
- Runtime rollback boundary: existing Phase 3 entrypoints and examples remain; Phase 4 adds a separate Micro-Episode and media command.
- Provider rollback boundary: built-in reference Provider remains available; an unavailable FFmpeg Provider returns a blocked report without mutating accepted evidence.
- Studio rollback boundary: media-panel state is derived from reports; removing the Phase 4 route leaves Phase 3 authoring sessions intact.
- Artifact rollback boundary: generated frames, WAV and MP4 can be deleted and rebuilt from source plus the declared toolchain; committed compact evidence remains independently reviewable.

## Expected Evidence

- `episode.mp4`
- `episode.wav`
- `frames-manifest.json`
- `anime-provider-manifest.json`
- `character-continuity-report.json`
- `cut-continuity-report.json`
- `audio-video-sync-report.json`
- `ffprobe-report.json`
- `evidence-ledger.json`
- `SHA256SUMS.json` and `SHA256SUMS.txt`
- `reproducible-build.json`
- representative frames from all three Cuts
- test report and browser evidence
- GitHub Actions artifact URL/name and workflow run identity

## Unprovable Claims After This Phase

Even after every gate passes, this phase will not prove commercial Anime quality, professional actor performance, licensed production assets, physical cloth/hair, GPU/DCC interchange, broadcaster delivery, clean-machine Windows acceptance or parity with a professional animation studio.

## Implementation Authorization

All 17 gates have reached `PASS-TO-IMPLEMENT` for the bounded Phase 4 objective. Code implementation may now begin under the acceptance and evidence constraints above.
