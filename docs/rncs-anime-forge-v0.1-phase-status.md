# RNCS Anime Forge v0.1 Phase Status

- Date: 2026-08-06
- Branch: `codex/rncs-anime-forge-phase5-visual-body-v02`
- Baseline: `origin/main-95@52fe4463a59a5fda1f75a50e117ca697d7777ed0`
- Status: **Phase 5 v02 improves the real visual-provider and media boundary, but the current machine still fails the visual replacement gate at `MODEL_MISSING`.**

## Phase 5 visual body replacement status

`Episode is authoritative. Cut is derived. Clip is reusable. Patch is local. Continuity is global.`

| Field | Status |
| --- | --- |
| Engineering status | Incomplete: the external route, frame gate, media closure and local Patch contract are runnable; qualified Provider execution is absent |
| Visual pipeline status | Failed / blocked at `MODEL_MISSING` on the audited machine |
| Selected Provider route | `rncs.visual.local-diffusion-video-worker` (local Diffusion/Video external-process route) |
| Provider execution | Blocked before process launch: no configured real visual model or license; FFmpeg/ffprobe are also absent |
| Candidate visual branch | `blocked`; automatic score cannot select or commit |
| Character Reference Asset Pack | Five real PNG views are generated from the built-in raster reference path; human character acceptance remains `pending` |
| Condition Pack | Eight structured raster-conditioning inputs are present and the sealed pack validates `complete`; external execution is still blocked by the model gate |
| Temporal/spatial reports | Contract, empty-output failure and Patch reports generated; no external frames were accepted |
| Human visual acceptance | `pending` |
| Phase 5 MP4/WAV | No MP4; a real 6-second component WAV is retained, but it is not called final program media |
| Commercial Anime quality | Not proven |

Phase 5 evidence is under `evidence/anime-forge-phase5-visual-body-v0.1/`. The v02 run uses the independent 6-second, 1280x720, 24 fps quality-shot source, records the actual environment, model/provider/reference/condition contracts, real PNG reference pack, component WAV, missing-model failure, candidate branch, temporal/spatial/Patch reports, A/B baseline comparison and a Phase 4/Phase 5 contact sheet. The contact sheet keeps the Phase 5 candidate panel blocked; it does not relabel the reference renders as generated replacement video.

Key blocked-run roots:

- Production root: `41eddb4897eef04571e7de9d2821a9cb5f97a436311f00e01a017478f6fc0a39`
- Episode Intent root: `d962fa2c7644d759243e467aa61d83f024c671952b7c6ba20df26d006e816e7c`
- Shot Intent root: `1874b26ec312373187954023ccf456deb646ea52d56a6cab014f3c21f48373b4`
- Candidate Branch root: `35d2798c733c8a16e48d93a26d737b96c1d7ddebba4ba634f9fa5ad8abb5a6ea`
- Temporal Stability root: `19c1bda7abcd4317da29e471199dce4dfc1fb9b4f81afbeb0fb6ea8656350543`
- Spatial Consistency root: `5ab30a840fa3a4cbc1d85a315645a8c3307b63a511129f1731fbcf6d026ac216`
- Patch root: `415800a18efd503f2a4669739f27790996053b333ce69fcf6b17f7b27c9b3358`
- Internal visual ledger root: `d3ba31cf47d6793193f4674ab5d5fd67b08a1a96ffcfaaabcb8cfa2ead9d4f70`
- Latest ledger file SHA-256: `b81feaa9f7b42c2790c75ad7dc5a77a30350e9d2b79d54cd99960242689a6de1` (the environment report includes instantaneous free memory, so this file hash is expected to vary between audits)

Phase 5 v02 adds environment-bound model manifests, real raster reference-pack generation, structured Shot Intent conditions, PNG content/duplicate/flicker checks, a real external-worker frame contract, FFmpeg/ffprobe candidate closure, A/B candidate contact-sheet support, Patch validation/rollback receipts, human acceptance immutability and a Reality Studio candidate-review entry point. It does not alter Episode authority or automatically accept generated pixels.

## Authority contract

`Episode is authoritative. Cut is derived. Clip is reusable. Patch is local. Continuity is global.`

Reality Studio Cut selection is inspection-only and does not mutate `production_root` or `episode_intent_root`. Voice and character edits invalidate stale media and are recompiled through the Episode Production IR.

## Runnable production chain

The 20-second `shenlinzhe-yanlv-micro-episode.rcl` runs through one programme-level chain:

`Anime RCL -> Episode Production IR -> Editorial Timeline -> Character Genome/RAGF lineage -> Provider Manifests -> per-Cut X-Sheets -> RSR secondary motion -> VSR layered composition -> Voice/Viseme -> Audio mix -> PNG sequence -> FFmpeg VideoMuxProvider -> ffprobe -> Evidence Ledger`

The derived Cuts are `S01` (168 frames), `S02` (168 frames), and `S03` (144 frames). They share one character identity, appearance, palette and proportion root. The final sequence has 480 real 960x540 PNG frames at 24 fps, with 480 unique state roots and 480 unique PNG hashes.

The Phase 5 quality-shot source is `packages/integration/rcl-anime-production-bridge/examples/shenlinzhe-yanlv-phase5-quality-shot.rcl`: one 6-second Cut, 144 frames, 1280x720 at 24 fps, three-quarter camera, dialogue, foreground/mid/background conditions and hair/coat/breathing/foreground motion tracks. It is independent of the 20-second Phase 4 programme and is not itself a successful visual replacement.

## Delivered modules

- Provider Manifest schema and runtime validation for inputs, outputs, resolution, frame rate, determinism, Seed support, continuity, motion, resources, timeout, cost, failures and evidence.
- RAGF built-in Anime asset families with identity and appearance seed, stable palette, proportions, facial features, hair, costume, expression/pose state, lineage, version and quality roots.
- Episode-level Composition/Camera contract with stable layer order, opacity, masks/crops, camera movement, transitions, colour/exposure anchors and Cut seam validation.
- Frame-aligned hair, coat, breathing, foreground parallax and camera easing in X-Sheets and Motion Tracks.
- Voice-authoritative phoneme/viseme mouth timing, non-silent programme audio, stems and final WAV.
- Real FFmpeg H.264/AAC MP4 mux and real ffprobe validation. Missing tools, timeout and invalid output fail closed.
- Reality Studio Phase 4 quality workspace with playback, Provider use, lineage, continuity, seams, sync, secondary motion, MP4 status, failure reason and Evidence Ledger entry.
- CLI `media` command, double-build comparison, negative tests, browser regressions and deterministic source packaging.

## Reproducible evidence

Evidence is generated by `npm run evidence:anime-phase4` in `evidence/anime-forge-phase4-v0.1`.

- Production root: `0e85a8a60bca9a61e8c99260861a6fd8fdfc98c43b55a257bea31ba461abca79`
- X-Sheets root: `47e9f7c9ab6fb47d9cc59e56f4e9a107c071300b87aaee16c9eddecb3edcf876`
- Frame sequence root: `972c98b3705ac6867c4682a968bb537a8bc2785f651bdaa2e43e35dc950b042e`
- Audio root: `c6ce6786e2f54a184fadb8fe725ccb6cac926126b6367f598d1e8d485778bd10`
- Evidence Ledger root: `fd802746592470d8f8d6e374e25c351849d8e0b3b51ba3e4105fc8dea1baf9c0`
- Deterministic comparison root: `f60ab5ac4c43f25f00c8b12eab499fd5291bafd73cf8ac050dc26a7466d87a87`
- Evidence summary root: `044d5490e95ac0178a2fd09ddb68c0a85ceda5cdb8aad5426e20c5e7af1d0096`
- MP4 SHA-256: `a63a1a1aa37e4565b8bbf8c7a6e5bb523b4204776c2c9e6cf564393515cb8e81`
- WAV SHA-256: `866c51f082fb6baf81f1ba2348a5e118183dff912d6e6040256b828bd3996147`

The MP4 probes as H.264/yuv420p 960x540, 24 fps, 480 frames and 20 seconds, with a 20-second AAC mono audio stream. Both evidence builds match across every declared deterministic root. FFmpeg output is separately scoped to the recorded FFmpeg version.

## Verification

```text
npm run test:anime-phase4
npm run evidence:anime-phase4
npm run browser:anime-phase4
npm run package:anime-forge
```

The browser evidence covers 1440x900 desktop and 390x844 mobile layouts, real video metadata, nonblank preview pixels, no horizontal overflow and no Production Root change when selecting a Cut.

The focused Phase 4 matrix passes `677/677` checks with `0` failures and `0` skips. Test report root: `4feea98453c05bac876dd0f1ce2dfae448bd8e044e5347da112ff8f4e2870dda`.

## Phase 5 verification

The Phase 5 contract matrix covers model/environment binding, real reference and condition files, candidate authority, temporal PNG content, external-worker output, Patch rollback and A/B completeness: runtime `26 pass / 1 expected skip`, Bridge `16/16 pass`, and Reality Studio `2 pass / 1 expected real-media skip`. The current machine still skips the real FFmpeg test because `ffmpeg` and `ffprobe` are absent; visual-provider execution remains an explicit `MODEL_MISSING` failure. Phase 3/4 tests remain required and are not lowered. Browser evidence passes on desktop and mobile as a separate UI gate, not visual-quality acceptance.

`npm run verify:anime-phase5-visual-evidence` builds the 6-second blocked evidence twice and confirms stable Production, Episode Intent, Candidate Branch, Temporal, Spatial, Patch and internal visual Ledger roots. The environment file SHA is intentionally volatile because it retains instantaneous free-memory observation; it is kept separate from stable roots. The Phase 5 source package is regenerated after the final source/evidence changes and remains tagged `blocked-visual-provider` until a real Provider candidate and human review exist.

The source/evidence package is reproducible with `npm run package:anime-phase5-visual`; its terminal package root and ZIP SHA-256 are recorded in the delivery receipt rather than embedded in the package itself.

## Rollback

- Source and authoring state: use the existing Anime Forge snapshot/rollback contract.
- Local patches: restore the prior snapshot and rebuild the affected programme media.
- Git delivery: revert the Phase 5 merge commit on `main-95` if the external-provider contract must be withdrawn; Phase 3/4 contracts remain backward compatible.
- Failed media: retain IR, frames, WAV and reports; do not publish or rename a non-MP4 artifact as MP4.

## Remaining boundaries

- Built-in Anime assets are experimental procedural assets, not externally cleared commercial final art.
- Voice is deterministic synthetic reference performance, not a licensed actor recording.
- Hair, cloth and parallax are bounded procedural tracks, not physical simulation.
- The CPU layered rasterizer does not prove GPU, Godot, Unity, Blender or DCC parity.
- Nonlinear editorial effects, production colour management and interchange remain bounded.
- Clean-machine, broadcaster and human direction/art acceptance remain open.

Phase 4 proves media closure and evidence reproducibility. It does not finish the full Anime Forge quality programme.
