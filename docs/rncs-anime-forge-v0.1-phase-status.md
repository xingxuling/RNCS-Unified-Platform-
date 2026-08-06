# RNCS Anime Forge v0.1 Phase Status

- Date: 2026-08-06
- Branch: `codex/rncs-anime-forge-phase5-visual-body-v01`
- Baseline: `origin/main-95@085a365d002907b17dd87ded56e9ebb5cb26c409`
- Status: **Phase 4 remains the experimental media baseline; Phase 5 visual body replacement engineering is incomplete and the visual gate is blocked.**

## Phase 5 visual body replacement status

`Episode is authoritative. Cut is derived. Clip is reusable. Patch is local. Continuity is global.`

| Field | Status |
| --- | --- |
| Engineering status | Incomplete but runnable at the contract and fail-closed adapter layer |
| Visual pipeline status | Blocked: `MODEL_MISSING` |
| Selected Provider route | `rncs.visual.local-diffusion-video-worker` (local Diffusion/Video external-process route) |
| Provider execution | Blocked: no local visual model, Diffusers/ComfyUI runtime, usable GPU backend or FFmpeg/ffprobe |
| Candidate visual branch | `blocked`; automatic score cannot select or commit |
| Character Reference Asset Pack | Blocked: RAGF roots are present, required raster reference views are not available |
| Temporal/spatial reports | Contract and blocked reports generated; no generated frames were accepted |
| Human visual acceptance | `pending` |
| Phase 5 MP4/WAV | Not generated; no static frame, GIF, JSON or Phase 4 raster is relabeled as MP4 |
| Commercial Anime quality | Not proven |

Phase 5 evidence is under `evidence/anime-forge-phase5-visual-body-v0.1/`. The blocked run records the local environment, selected Provider manifest, missing model/license state, candidate branch, temporal/spatial reports, A/B baseline comparison and a Phase 4/Phase 5 contact sheet. The contact sheet intentionally shows the Phase 5 panel as blocked rather than fabricating a visual result.

Key blocked-run roots:

- Production root: `2d75ecf89aa2e711bf8d70f037e3fd918498e99120706643b5014856025f84d7`
- Episode Intent root: `88dbeccb650b44ece778b54c4958c1743e6dca1f879e2f5350a6d28cafed1b89`
- Candidate Branch root: `74c0cdc3089a4b01c4362464136ce2ea724bcd17e7daeb16ef77161004e2d988`
- Temporal Stability root: `605a465f6165e99c788a18dd767ff6619627d598cae67228b19fc09f8d39b20d`
- Spatial Consistency root: `64f64a6067eed5864e34ec7e30b8ec1f00fa880e8bc09eb482d00da0b844ca52`
- Internal visual ledger root: `bac94ba23def3c26025d5ef4b6f4bd7d58052381a58175b5d612995375a382ed`
- Latest ledger file SHA-256: `7e4533b0f2e719ebf93247b1f68c85349b98f74fd00e2417a80adc6c1f65664a` (the environment report includes instantaneous free memory, so this file hash is expected to vary between audits)

Phase 5 adds Visual Provider/Model manifests, Character Reference Pack and Condition Pack schemas, Candidate Visual Branch states, fail-closed local execution, temporal/spatial/patch evidence, human acceptance immutability, a Reality Studio visual-quality endpoint and desktop/mobile blocked-state regression. It does not alter Episode authority or automatically accept generated pixels.

## Authority contract

`Episode is authoritative. Cut is derived. Clip is reusable. Patch is local. Continuity is global.`

Reality Studio Cut selection is inspection-only and does not mutate `production_root` or `episode_intent_root`. Voice and character edits invalidate stale media and are recompiled through the Episode Production IR.

## Runnable production chain

The 20-second `shenlinzhe-yanlv-micro-episode.rcl` runs through one programme-level chain:

`Anime RCL -> Episode Production IR -> Editorial Timeline -> Character Genome/RAGF lineage -> Provider Manifests -> per-Cut X-Sheets -> RSR secondary motion -> VSR layered composition -> Voice/Viseme -> Audio mix -> PNG sequence -> FFmpeg VideoMuxProvider -> ffprobe -> Evidence Ledger`

The derived Cuts are `S01` (168 frames), `S02` (168 frames), and `S03` (144 frames). They share one character identity, appearance, palette and proportion root. The final sequence has 480 real 960x540 PNG frames at 24 fps, with 480 unique state roots and 480 unique PNG hashes.

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

The Phase 5 contract and blocked-provider matrix passes `24` Anime Production Runtime tests with `23` passes and `1` expected FFmpeg skip, `13/13` RCL bridge tests, `2/2` targeted Studio Anime Forge tests plus the expected real-media skip, and the full `npm run test:anime-phase4` command exits successfully. The complete Reality Studio workspace run reports `237` passes, `0` failures and `1` expected media skip. The desktop/mobile blocked-state browser evidence reports no page errors, no failed requests and no horizontal overflow at `1440x900` and `390x844`.

`npm run verify:anime-phase5-visual-evidence` builds the blocked evidence twice and confirms stable Production, Episode Intent, Candidate Branch, Temporal, Spatial and internal visual Ledger roots. The environment file SHA is intentionally volatile because it retains instantaneous free-memory observation; it is kept separate from stable roots. The final Phase 5 source package contains `205` manifest-listed files plus the embedded manifest and is tagged `blocked-visual-provider`. Package root: `ed1f529cf4d538ae902e258cacd6477903a6049020fd5b8ceca1dfcb68084da6`; ZIP SHA-256: `b9b5bb3b1b6df3da15dc3e5e5db52abeac34ea239bc8ee79bc04438a0adcff94`.

## Rollback

- Source and authoring state: use the existing Anime Forge snapshot/rollback contract.
- Local patches: restore the prior snapshot and rebuild the affected programme media.
- Git delivery: revert the Phase 4 merge commit on `main-95`; Phase 3 contracts remain backward compatible.
- Failed media: retain IR, frames, WAV and reports; do not publish or rename a non-MP4 artifact as MP4.

## Remaining boundaries

- Built-in Anime assets are experimental procedural assets, not externally cleared commercial final art.
- Voice is deterministic synthetic reference performance, not a licensed actor recording.
- Hair, cloth and parallax are bounded procedural tracks, not physical simulation.
- The CPU layered rasterizer does not prove GPU, Godot, Unity, Blender or DCC parity.
- Nonlinear editorial effects, production colour management and interchange remain bounded.
- Clean-machine, broadcaster and human direction/art acceptance remain open.

Phase 4 proves media closure and evidence reproducibility. It does not finish the full Anime Forge quality programme.
