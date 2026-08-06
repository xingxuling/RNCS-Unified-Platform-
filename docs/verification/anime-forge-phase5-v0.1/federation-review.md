# RNCS Anime Forge v0.1 Phase 5 Visual Body Replacement Federation Review

## 1. Target Decision

- Repository: `xingxuling/RNCS-Unified-Platform-`
- Baseline fetched from remote: `origin/main-95@085a365d002907b17dd87ded56e9ebb5cb26c409`
- Branch: `codex/rncs-anime-forge-phase5-visual-body-v01`
- Worktree: `C:/Users/User/Documents/RCL/_worktrees/rncs-anime-forge-phase5-visual-body-v01`
- Phase objective: replace the final visual body with a real, high-quality visual generation path while preserving RNCS authority, lineage, local patching, and human review boundaries.
- Current decision: **engineering implementation may proceed; visual replacement acceptance is blocked** until a qualified visual generation runtime, model, license record, and real 1280x720 shot are available.
- Primary acceptance route: **A, local GPU Diffusion/Video worker**. It is the only route selected for a future visual-quality acceptance run. Blender/Godot and remote API are audit alternatives only and are not half-integrated.
- `human_visual_acceptance`: `pending`
- `Phase 5 engineering status`: `incomplete` until the fail-closed visual adapter, contracts, tests, Studio surface, and evidence validator land.
- `Phase 5 visual replacement status`: `blocked`

This is a federation decision record, not a human visual acceptance receipt. No automatic test or score can write `accepted`.

## 2. Real Problem Renaming

Phase 4 closes a real Episode-authoritative media loop, but its final raster remains an experimental procedural visual body: geometric face and costume primitives, flat layered city planes, polygon lighting, and parameterized motion. The next problem is therefore not “more controls” or “another Cut selector.” It is replacing the visual body with a reference-conditioned, temporally validated visual candidate while keeping the production control kernel authoritative.

Required invariant:

`Episode is authoritative. Cut is derived. Clip is reusable. Patch is local. Continuity is global.`

New visual authority boundary:

`Character Genome defines identity constraints. Visual Providers generate candidates. Quality reports provide evidence. Only an authorized selection may enter Episode Master. Human visual acceptance remains separate.`

## 3. Fact Baseline

Facts verified in the new worktree:

- Phase 4 contains Episode Production IR, Editorial Timeline, X-Sheet, RAGF Character Genome bindings, RSR/VSR tracks, Voice/Audio, FFmpeg/ffprobe, Reality Studio, replay and Evidence Ledger.
- Phase 4 evidence includes a real 20-second, 480-frame, 3-Cut MP4 at 960x540 and representative frames under `evidence/anime-forge-phase4-v0.1/representative-frames/`.
- The current Phase 4 visual output is not a modern Anime-quality reference asset. The three representative frames show the same centered geometric body, flat costume regions, hard polygon outlines, planar skyline, and light wedges. Camera scale changes do not establish convincing perspective, contact, material, or acting.
- The Phase 4 status document correctly says commercial Anime quality, GPU/DCC parity, clean-machine acceptance, and human art acceptance remain open. Its branch/hash metadata is stale relative to this task and must be corrected in Phase Status.
- No standalone screenshot attachment was present under the supplied attachment directory. The repository-bound representative frames are the available Phase 4 negative baseline; this absence is recorded rather than inferred away.

### Environment audit, 2026-08-06, local Windows machine

| Area | Observed fact | Consequence |
| --- | --- | --- |
| OS | Windows 11 Home, 64-bit, build `10.0.26200` | Windows execution path is available. |
| CPU | AMD Ryzen AI 7 350, 8 cores / 16 logical processors | CPU orchestration is available; CPU visual diffusion is not assumed practical. |
| RAM | 23.29 GB physical RAM, approximately 1.45 GB free at audit time | Large model loading is unsafe without a clean run. |
| GPU | AMD Radeon 860M, reported adapter memory 512 MB shared, driver `32.0.22024.3004` | No usable high-resolution diffusion/video budget was proven. |
| CUDA / ROCm / DirectML | `nvidia-smi`, `rocminfo`, and `hipconfig` missing; Torch reports `2.10.0+cpu`, CUDA unavailable, zero CUDA devices | Local GPU visual route is blocked. |
| Python / Node | Python `3.11.6`; Node `v24.15.0`; npm `11.12.1` | Contract and orchestration tests can run. |
| Visual libraries | Torch present; Diffusers, ComfyUI, OpenCV absent; Transformers, ONNX Runtime and Pillow present | No complete local visual generation stack exists. |
| Existing model runner | Ollama is present with language/embedding models only; no image/video model was found | Ollama cannot be counted as a visual Provider. |
| Blender / Godot | Commands missing in the audited PATH; repository Godot client is not a visual Anime generator | B is not a qualified visual replacement path. |
| FFmpeg / ffprobe | Both missing in the audited PATH | Real MP4 evidence is blocked on this machine until tools are supplied. |
| Disk | Approximately 290.25 GB free on `C:` | Storage is sufficient for a controlled model download, subject to license and runtime checks. |
| API environment | No matching remote visual API environment variable names were present; no secret values were read | C is not configured and cannot be claimed. |
| GitHub Actions | Existing Anime workflow uses `ubuntu-latest`; no GPU runner declaration or model cache is present | CI can verify contracts and compact evidence, not silently execute GPU generation. |

## 4. Phase 4 Visual Baseline Review

Reviewed baseline frames:

- `evidence/anime-forge-phase4-v0.1/representative-frames/frame-000096-S01.png`
- `evidence/anime-forge-phase4-v0.1/representative-frames/frame-000250-S02.png`
- `evidence/anime-forge-phase4-v0.1/representative-frames/frame-000390-S03.png`

Visual findings:

- First impression: the output reads as a deterministic engineering sample, not as a finished Anime shot. The dominant silhouette is a single centered vector body with large uniform costume planes.
- Character identity: the palette and emblem are rooted, but facial construction, hair mass, cloth volume, and anatomy are too symbolic to establish a modern character design.
- Space: the skyline, character, foreground posts and light wedges share a canvas but not convincing perspective, depth contact, or material response.
- Composition: the three frames are mostly a scale progression toward the same centered pose. There is no strong 3/4 staging, foreground occlusion event, or motivated blocking.
- Acting: mouth and eye state change exists as evidence, but the body does not carry weight, anticipation, follow-through, or a readable attention turn.
- Temporal risk: the procedural renderer can be deterministic, but determinism alone does not prove stable generated identity, clothing, hands, or background detail.

These are the negative baseline criteria for `visual-baseline-comparison.json`, `visual-baseline-comparison.md`, and the contact sheet. The Phase 4 images must remain visible in the final comparison and cannot be replaced by a selectively flattering crop.

## 5. Provider Candidate Comparison

| Route | Anime quality potential | Identity / temporal control | Local facts | License / reproducibility | Decision |
| --- | --- | --- | --- | --- | --- |
| A. Local Diffusion/Video worker | Highest potential if a real GPU, model, reference pack, ControlNet-like conditions, temporal repair and licensed weights are supplied | Requires explicit reference roots, seeds, model revision, temporal validation and patch windows | No Diffusers/ComfyUI, no CUDA/ROCm, CPU-only Torch, 512 MB shared GPU | Model license, weight SHA, model size, sampler and environment must be recorded; offline and deterministic status vary | **Selected as the only future acceptance route; currently blocked** |
| B. Blender/Godot conditional render | Strong condition/camera/depth control, but the audited procedural path would not clear the modern Anime visual hard gate by itself | Good geometry and camera determinism; weak generative facial/costume quality without an additional art provider | Blender/Godot missing in PATH; existing Godot project is not an Anime visual provider | Tool versions can be recorded, but it would be a conditional renderer, not the required visual body replacement | Not selected; no half-integration |
| C. Remote visual API | Potentially high image/video quality and no local GPU requirement | Depends on provider reference/video controls; remote output and timing can vary | No configured visual API environment variables or approved endpoint | Key isolation, request/output roots, cost, retention, license, and durable artifact storage are unresolved | Not selected; no remote call made |

No provider route currently crosses the Phase 4 visual hard gate. The correct outcome is a blocked report plus fail-closed interfaces, not a mock, fixture, static image loop, old raster frame, or test card.

## 6. Federation Gates

The gates below were executed in this order. The result permits the engineering work but does not grant visual acceptance.

| # | Gate | Judgment | Binding decision |
| ---: | --- | --- | --- |
| 1 | Founder Twin | Pass | Preserve the user's visual-quality objective and keep the current worktree isolated. |
| 2 | 柳清莲 Gate | Pass | A generated image is not creative authority; no silent model overwrite. |
| 3 | 洞哥 Grounding | Pass | Every claim must bind to actual hardware, provider receipt, media, root, or explicit blocked reason. |
| 4 | 产品文明 | Pass with blocker | The useful product is a reviewable visual candidate pipeline; the quality shot cannot be accepted without a real Provider. |
| 5 | UX / 设计文明 | Pass | Studio first screen shows playability, Provider, worst issue, visual uplift versus Phase 4, pending human status. |
| 6 | 编剧文明 | Pass | Shot Intent carries attention turn, emotion, action, and spatial purpose; it does not become a model prompt free-for-all. |
| 7 | 动画导演文明 | Pass | 5–8 second quality shot uses 3/4 staging, anticipation, eye/head turn, follow-through, camera motivation, and repairable intervals. |
| 8 | 角色设计文明 | Pass with blocker | Genome and reference pack must anchor face, hair, costume, proportions, palette, and forbidden drift; no accepted pack exists yet. |
| 9 | 角色表演文明 | Pass | Performance conditions include gaze, expression, mouth timing, weight shift and secondary motion; automatic score cannot accept acting. |
| 10 | 美术指导文明 | Pass | Style Bible requires volume, line/material policy, lighting, depth and composition; Phase 4 geometry is the negative baseline. |
| 11 | 摄影文明 | Pass | Camera conditions include 3/4 perspective, foreground/mid/background, occlusion and motivated push/pan/DOF. |
| 12 | 技术美术文明 | Pass | Condition Pack must contain pose/skeleton/depth/normal/edge/masks/camera/layer roots and validate completeness. |
| 13 | 生成模型文明 | Blocked | No local qualified image/video runtime, model, GPU, or license evidence is available. Implement fail-closed adapter only. |
| 14 | 图形与合成文明 | Pass with blocker | Final candidate must be real frames/clip with temporal and spatial reports; procedural Phase 4 frames cannot satisfy it. |
| 15 | 声音文明 | Pass | Existing Voice/Audio authority remains; this visual shot may use an original environment WAV if no dialogue is needed. |
| 16 | 数学与形式方法文明 | Pass | Keep distinct hash namespaces for ledger root, file SHA, evidence bundle, artifact, source package and media. |
| 17 | 工程文明 | Pass | Use a fresh worktree, typed schemas, negative tests, blocked states, reproducible receipts and no model/binary commit. |
| 18 | 代码文明 | Pass-to-implement | Reuse Phase 4 canonical roots and Episode authority; keep visual runtime separated from legacy raster provider. |
| 19 | 测试文明 | Pass-to-implement | Add manifest, reference pack, condition, identity, candidate, temporal, patch, provider failure, A/B and Studio tests. |
| 20 | 安全文明 | Pass | Do not read secrets; validate external commands, paths, licenses, model hashes, input roots and output roots. |
| 21 | 发布文明 | Pass with blocker | Publish source, compact blocked evidence, install/model preparation notes, and explicit pending gates. |
| 22 | Integration Court | Blocked | Final cross-module acceptance awaits a real 1280x720 visual candidate and playable MP4/WAV. |
| 23 | Evidence Ledger | Blocked | Ledger schema can be implemented, but final visual/media roots cannot be honestly bound without provider execution. |

## 7. Impact Modules

- Anime Production Runtime: visual provider manifests, model manifests, Character Reference Pack, Condition Pack, Candidate Visual Branch, temporal/spatial reports, patch receipt, human visual state.
- RAGF and Character Genome: export immutable identity roots into a model-consumable reference pack without allowing generated pixels to rewrite Genome.
- RCL Anime Bridge: compile Episode/Shot Intent and conditions, launch one configured local Diffusion/Video worker, collect execution receipts, fail closed on missing runtime/model/license/output.
- VSR/RSR: supply camera, pose, secondary motion and temporal context as conditions; old raster output remains a negative baseline only.
- Voice/Audio: preserve existing authority and allow a real environment WAV for the quality shot.
- Reality Studio: Visual Quality Workspace with Phase 4/5 A/B, frame stepping, issue intervals, candidate actions, patch and human status.
- Tests, CI and evidence: ordinary CI contract/negative/regression validation; external GPU evidence as separately declared artifact.

## 8. Implementation Plan

1. Add typed Visual Provider, Model Manifest, Character Reference Pack and Condition Pack contracts with separate sealed roots and validators.
2. Add the single selected local Diffusion/Video adapter as a real external-process path. It reads `VISUAL_PROVIDER_EXECUTABLE` and optional `VISUAL_PROVIDER_ARGS_JSON` and never falls back to the legacy vector rasterizer for visual acceptance.
3. Add Candidate Visual Branch states, evidence fields, provider/model/input/output roots, license status, human status, selection receipt, commit preview and rollback.
4. Add temporal consistency and repair report contracts. A repair is a local Patch Branch with before/after frame roots and seam checks.
5. Add blocked-run evidence generation that records the actual environment and exact failure. It must not write fake frames or a fake MP4.
6. Add Reality Studio Visual Quality Workspace and browser regressions for desktop/mobile, including the blocked state.
7. When a qualified external GPU runner is supplied, run the 5–8 second 1280x720 shot, build A/B contact sheets, run the visual gates, and only then update the final visual status after human review.

## 9. Acceptance Standards

The visual replacement gate is complete only when a real 5–8 second, 1280x720, 24 fps shot contains one persistent original character in a 3/4 or perspective pose, readable emotion/attention change, weight and follow-through, hair or cloth after-motion, motivated camera movement, foreground/mid/background depth, occlusion, changing light relationship, no debug UI/text, real MP4/WAV, and complete provider/model/license/reference/condition/temporal/spatial/patch/A-B evidence.

The ordinary CI gate must pass schemas, authority boundaries, candidate isolation, missing/timeout/OOM/model/license negative cases, temporal metric helpers, patch impact, rollback, A/B package completeness, human status immutability, Studio desktop/mobile, and all Phase 3/4 regression tests.

## 10. Risks

- No qualified local model runtime or GPU: current visual gate remains blocked.
- Model weight size and license may make a future download unsuitable for this repository or machine.
- Generated references may look good in one frame but drift across time; temporal reports cannot substitute for human viewing.
- External processes can leak paths or secrets unless command and environment recording is filtered.
- Remote APIs can make output non-reproducible and can impose retention, cost, and rights uncertainty.
- A local patch may expand beyond its requested interval for video models; the expanded interval must be recorded, never hidden.
- Current Phase 4 release metadata has stale baseline/branch values; updating it without preserving the original evidence would create provenance confusion.

## 11. Rollback

- Code: revert the Phase 5 visual-body commit/PR; Phase 3/4 runtime and evidence remain the authority baseline.
- Provider: remove the external command/model binding; candidate state becomes `blocked` or `superseded`, never a silent built-in fallback.
- Candidate: restore the prior Candidate Visual Branch and previous media root.
- Patch: reject the Patch Receipt or restore the pre-patch frame/output roots; unaffected roots must remain unchanged.
- Character: never rewrite Character Identity Root, Genome Root, or Episode Intent Root during generation, repair or rollback.
- Human state: automation may only write `pending`; accepted/rejected/revision-requested requires an explicitly identified human reviewer.

## 12. Unprovable Claims

This phase cannot claim commercial Anime quality, professional animator/director replacement, full-episode stability, automatic art-quality proof, human acceptance, model or asset commercial rights, broadcast clearance, GPU/provider availability, or Provider authority. A passed test receipt is not a human viewing receipt.

## 13. Evidence Namespaces

The final ledger must keep these distinct:

- `ledger_internal_root`
- `ledger_file_sha256`
- `evidence_bundle_root`
- `artifact_sha256`
- `source_package_sha256`
- `media_sha256`

The blocked engineering run will still produce the federation review, environment report, manifest validation, negative receipts, Phase 4 baseline references, and source package hashes. It will not invent `generated_frame_root`, `generated_clip_root`, or `mp4_sha256` for media that did not execute.
