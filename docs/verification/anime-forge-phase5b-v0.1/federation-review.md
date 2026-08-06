# RNCS Anime Forge v0.1 Phase 5B Federation Review

Status at review close: **blocked: MODEL_EXECUTION_UNAVAILABLE**
Review date: 2026-08-07
Baseline: `origin/main-95` at `4d42442855a371903563f644b0f24ee9a9defc4d`
Branch: `codex/rncs-anime-forge-phase5b-real-execution-v01`
Worktree: `C:\Users\User\Documents\RCL\_worktrees\rncs-anime-forge-phase5b-real-execution-v01`

## Actual repository facts

The baseline contains Phase 5A's visual provider manifest, model/license gate, character reference pack contract, condition pack, candidate branch, temporal validation, Patch/Rollback contract, Reality Studio review surface, and fail-closed `MODEL_MISSING` evidence. The previous Phase 5A evidence is a blocked contract/evidence build; it contains no external visual-model output.

This Phase 5B worktree was created from the verified `origin/main-95` commit. The previous Phase 5A worktree was not reused or modified.

## Execution plan

1. Audit the baseline, worktree, machine, toolchain, model sources, and license sources.
2. Install and independently verify FFmpeg and ffprobe.
3. Select exactly one executable visual route only if the real machine or an explicitly configured remote GPU can satisfy it.
4. Connect or start ComfyUI, query health/nodes/models, load an API workflow, submit a real Smoke Shot, and write a Provider Execution Receipt.
5. Validate real frames, then run the 6-second Quality Shot and a real Patch branch.
6. Keep human character and visual acceptance pending until the user explicitly reviews the package.
7. Only after every Phase 5B completion condition is evidenced may a completion PR be considered. The current block prevents a completion PR.

## Mandatory federation record

The federation was evaluated in the required order. The entries below are engineering decisions and gates, not claims that an absent external runtime passed.

| Order | Civilization / gate | Decision recorded | Status |
| ---: | --- | --- | --- |
| 1 | Founder Twin | The objective is one real external visual execution and reviewable candidate, not another contract demo. | recorded |
| 2 | 柳清莲 Gate | Human visual choice and character-reference approval remain user-owned; no automatic acceptance. | recorded |
| 3 | 洞哥 Grounding | Machine facts, GPU absence, free-memory constraint, and FFmpeg result are grounded in local checks. | recorded |
| 4 | Product civilization | The release value is a trustworthy visual replacement path with reversible candidate review. | recorded |
| 5 | UX / design civilization | The eventual Studio surface must expose provider state, validation failures, A/B review, and commit lock. | recorded |
| 6 | Animation director civilization | Smoke precedes Quality; the shot needs clear start/end, camera intent, readable motion, and continuity. | recorded |
| 7 | Character design civilization | The existing built-in reference raster is structural only; `human_character_acceptance` stays `pending`. | recorded |
| 8 | Character performance civilization | Expression, gaze, weight shift, and secondary motion require real temporal evidence, not a single frame. | recorded |
| 9 | Art direction civilization | Layering, occlusion, lighting, palette, hair, costume, and background drift must be reviewed on actual output. | recorded |
| 10 | Cinematography civilization | 3/4 perspective and a controlled push/pan are shot constraints, not post-hoc descriptions. | recorded |
| 11 | Technical art civilization | Native output, spatial upsample, temporal interpolation, and artifact roots must be separated. | recorded |
| 12 | Generation-model civilization | A model is eligible only with exact checkpoint revision, weight provenance, license text, and hardware fit. | blocked |
| 13 | Graphics / compositing civilization | FFmpeg/ffprobe is available and proven; no external visual frames exist to composite. | blocked |
| 14 | Engineering civilization | No new parallel Anime authority is introduced; Episode remains authoritative and Cut remains derived. | recorded |
| 15 | Code civilization | Existing Phase 5A Provider/Candidate/Patch/Ledger contracts are preserved; no provider code was falsely promoted. | recorded |
| 16 | Test civilization | FFmpeg smoke passed; Provider, Smoke, Quality, Patch, and human-review gates are not run without real output. | blocked |
| 17 | Security civilization | No API key or secret value was read or written; model downloads were not attempted without a compatible route. | recorded |
| 18 | Release civilization | A blocked experiment branch may carry this audit/handoff only; no Phase 5B completion merge is allowed. | blocked |
| 19 | Integration Court | The current environment cannot pass the real-provider court because no eligible executor and model are present. | blocked |
| 20 | Evidence Ledger | The audit and FFmpeg receipts are recorded, while no fake Candidate Root, Patch Root, or MP4 evidence is minted. | blocked |

## Model-route comparison

The source and revision values below were read from the official repositories/model APIs on the audit date. Weight files were not downloaded; therefore no local model-file SHA-256 exists and none is invented.

| Route | Code source and commit | Exact model route | Source revision | Weight size observed remotely | License source and status | Local decision |
| --- | --- | --- | --- | ---: | --- | --- |
| A | [Tencent HunyuanVideo-1.5](https://github.com/Tencent-Hunyuan/HunyuanVideo-1.5), `60783e704160023913bee78f0b47036d393d4dfa` | `tencent/HunyuanVideo-1.5`, `transformer/480p_i2v_step_distilled/diffusion_pytorch_model.safetensors` | `9b49404b3f5df2a8f0b31df27a0c7ab872e7b038` | 33,325,523,336 bytes | [Tencent Hunyuan Community License](https://github.com/Tencent-Hunyuan/HunyuanVideo-1.5/blob/main/LICENSE); territory and use restrictions require legal review. | rejected locally: official requirements call for Linux and NVIDIA CUDA; no suitable GPU. |
| B | [Wan2.2](https://github.com/Wan-Video/Wan2.2), `42bf4cfaa384bc21833865abc2f9e6c0e67233dc` | `Wan-AI/Wan2.2-TI2V-5B`, `main` | `921dbaf3f1674a56f47e83fb80a34bac8a8f203e` | 34,203,123,497 bytes for the model repository | [Wan2.2 model card](https://huggingface.co/Wan-AI/Wan2.2-TI2V-5B), Apache-2.0 plus the card's use restrictions; commercial status remains pending human/legal review. | rejected locally: official instructions require at least 24 GB GPU VRAM for the 720P path; no ComfyUI integration was available locally. |
| C | [LTX-Video](https://github.com/Lightricks/LTX-Video), `4b2d053057623ddd4d0a1d3e9cd28890e9ef487f` | `Lightricks/LTX-Video`, `ltxv-2b-0.9.8-distilled.safetensors`, `main` | `8984fa25007f376c1a299016d0957a37a2f797bb` | 6,340,744,492 bytes for the selected checkpoint | [LTXV Open Weights License 0.X](https://huggingface.co/Lightricks/LTX-Video/blob/main/LTX-Video-Open-Weights-License-0.X.txt); this is not SPDX and commercial status remains pending human/legal review. | rejected locally: 512 MiB shared adapter memory and 3.68 GB free RAM cannot establish a stable video runtime. |
| D | No local source or configured endpoint | Remote ComfyUI / GPU Provider | none | none | Provider/model/license/fee evidence absent | unavailable: no remote endpoint or approved credentials/configuration found. |

**Selected route:** none.
**Reason:** the only route that could be selected from this machine would require an external GPU/Provider configuration that is not present. Downloading a multi-gigabyte checkpoint into an incompatible CPU/shared-memory environment would not create a valid execution path and would risk turning installation into false evidence.

## Budget and operating boundary

- Model download performed: `0 bytes`.
- FFmpeg package download: the trusted installer reported the archive hash before installation; installed binary hashes are in [environment-audit.json](./environment-audit.json).
- Local GPU/Provider cost: `0` because no visual model job was run.
- Runtime budget: no Smoke Shot runtime can be estimated from this machine without a qualified executor. The official Wan2.2 card documents a GPU benchmark, but it is not a measurement of this host.
- Memory budget: 512 MiB reported shared adapter memory and only 3.68 GB free system memory at audit time; this is below the cited candidate routes' documented execution envelope.

## Acceptance and rollback

`human_character_acceptance=pending`, `human_visual_acceptance=pending`, and `commercial_license_status=pending`. The existing raster reference pack is not converted into human approval.

Rollback is limited and explicit: the previous Phase 5A worktree remains untouched; this isolated branch contains only the Phase 5B audit/handoff record; no model weights or secrets were added to Git; no Episode Master or formal `episode-candidate.mp4` was created. The FFmpeg installation is an independent machine tool and can be removed through `winget` if the user later requests it, but it is retained because the verified media gate is useful for the next execution environment.

## Unprovable claims

This run cannot prove a real ComfyUI execution, a valid external visual candidate, 48 real model frames, a 6-second Quality Shot, Patch efficacy, character identity continuity, commercial usability, human visual acceptance, or Phase 5B completion. The FFmpeg smoke MP4 proves only mux/decode capability.

## Gate result

```text
Phase 5B engineering status = blocked
Real Provider execution = blocked
Visual replacement status = pending-human-review
Human visual acceptance = pending
Commercial license status = pending
```
