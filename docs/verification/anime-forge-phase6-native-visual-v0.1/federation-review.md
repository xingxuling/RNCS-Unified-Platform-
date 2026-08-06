# RNCS Anime Forge v0.1 Phase 6 Federation Review

- Review date: 2026-08-07
- Repository: `xingxuling/RNCS-Unified-Platform-`
- Baseline: `origin/main-95@4d42442855a371903563f644b0f24ee9a9defc4d`
- Worktree: `C:\Users\User\Documents\RCL\_worktrees\rncs-anime-forge-phase6-native-visual-genesis-v01`
- Branch: `codex/rncs-anime-forge-phase6-native-visual-genesis-v01`
- Phase 5B commit `f30d9aeca7e808b780c3aa5e44f31f52e7c8b23c` is not an ancestor of `origin/main-95` and remains only on `origin/codex/rncs-anime-forge-phase5b-real-execution-v01`.
- Decision at review start: implementation may begin only within the native route below; this document is a design and evidence boundary, not a visual-quality acceptance.

## Real problem

Phase 4 closed a real programme-level media loop, but it did not yet prove that RNCS can generate a visual body from identity, perform a structured action in space, and project that authoritative state into temporally continuous Anime frames. The remaining problem is therefore not another Cut browser or another provider label. It is the missing chain:

`Character Genome -> Morphogenesis -> Performance -> Scene Field -> Style Laws -> Native Temporal Renderer -> Visual Feedback`

The authority invariant remains:

`Episode is authoritative. Cut is derived. Clip is reusable. Patch is local. Continuity is global.`

Rendered pixels, selected Cuts, and external tools cannot acquire Episode or Character Identity authority.

## Fact baseline

### Repository and branch facts

- The new worktree is clean at the verified `main-95` commit and does not contain the old Phase 5A or Phase 5B worktree changes.
- The repository already contains `character-genome-runtime`, `character-phenotype-compiler`, RAGF, `anime-production-runtime`, VSR, RSR, World Body IR/codegen, Reality Studio clients, and Phase 3/4/5 contracts and evidence.
- Phase 5A is represented on this baseline as an external visual compatibility contract with fail-closed `MODEL_MISSING` evidence, not as a successful visual model run.
- Phase 5B was intentionally blocked by `MODEL_EXECUTION_UNAVAILABLE`: the old audit found no local ComfyUI runtime/model, no approved remote provider, and no suitable external model execution path. Its FFmpeg smoke output proved media-tool availability only.

### Phase 4 evidence facts

The repository-bound Phase 4 evidence is a useful media and visual residual baseline:

| Fact | Observed evidence |
| --- | --- |
| Programme | 20 seconds, 3 derived Cuts, 480 frames, 24 fps, 960x540 |
| Media | real H.264/AAC MP4 and non-silent WAV; ffprobe passed |
| Determinism | 480 unique state roots and PNG hashes; replay/build roots passed |
| Existing visual backend | `deterministic-native-2d-layered` using RAGF/VSR/RSR reference paths |
| Asset boundary | `experimental built-in Anime assets, not commercial source art` |
| Motion boundary | `bounded procedural motion, not physical cloth or hair` |
| Human boundary | human direction, clean-machine and broadcaster acceptance remain open |

The three representative frames were inspected from `evidence/anime-forge-phase4-v0.1/representative-frames/`. They show a readable original character and layered background, but the body is largely a front-facing polygonal construction. The face is simplified, the torso and sleeves carry limited volumetric cues, the camera changes shot size more than viewpoint, and the evidence does not establish a 3/4 body turn, rooted contact, articulated secondary motion, or a visible light/occlusion relationship driven by body geometry. Those are residuals to improve, not reasons to discard Phase 4's valid media contracts.

### Host facts carried forward from the Phase 5B audit

- Windows 11 Home build `26200`.
- AMD Ryzen AI 7 350, 8 cores / 16 logical processors.
- AMD Radeon 860M shared adapter memory reported as 512 MiB; this is not dedicated VRAM.
- No NVIDIA/CUDA runtime; PyTorch was CPU-only.
- Node `24.15.0`, npm `11.12.1`, Python `3.11.6`, Git `2.55.0.windows.2`.
- FFmpeg/ffprobe 9.0 were installed and independently smoke-tested, but are not assumed to be on the current process PATH. The Phase 6 runner must resolve an explicit executable or fail closed.
- Godot and Blender were absent from PATH in the prior audit. Their adapters remain optional and are not the Phase 6 acceptance dependency.
- Machine-local free memory, disk, absolute paths, and elapsed time are execution facts only and must not seed deterministic authority roots.

## Existing visual stack audit

| Area | Reusable fact | Current limitation / Phase 6 action |
| --- | --- | --- |
| Character Genome Runtime | Identity, semantic morph graph, constraints, continuity and rooted contracts already exist | Add a visual projection contract without changing genome authority |
| RAGF Anime Generator | Deterministic palette, proportions, face features, SVG reference sheets, layered rig metadata and lineage already exist | Move from reference sheets/layers to a parameterized body graph and renderable regions |
| Character Phenotype Compiler | Existing geometry, projection, rig, collision and VSR/RSR profile integration is reusable | Bind it to the native visual body contract rather than making a second identity system |
| Anime Production Runtime | Episode IR, composition, X-Sheet, PNG rasterizer, evidence and replay already exist | Add native frame state, body/performance/scene/style roots and renderer validation |
| Camera / composition | Programme-level composition and camera state are already resolved per X-Sheet frame | Add projection, anchors, contact, occlusion and camera-program evidence |
| X-Sheet / Motion Track | Frame alignment for camera, composition and reference secondary motion is already tested | Add explicit performance curves and secondary-motion chain states |
| VSR | Anime rendering profile and camera resolution are available | Use it as projection/render-profile input, not visual identity authority |
| RSR | Deterministic director-overridable hair/coat reference motion exists | Upgrade to typed performance follow-through receipt and preserve RSR as a derived motion input |
| World Body IR | Body/geometry authority and codegen concepts are present elsewhere in RNCS | Reuse roots and validation vocabulary; do not invent a parallel world body authority |
| SVG/PNG rasterizer | Produces real deterministic PNGs and can be retained as the Phase 6 custom backend foundation | It must render multiple body regions, depth, occlusion, line and light from body state, not translate one character card |
| Face / hair / costume | RAGF has semantic features and named layers; current renderer has simple visible parts | Add anchors, rigs, occlusion order, material/line laws and stable deformation regions |
| Skeleton / deformation | RAGF emits a skeleton/animation representation and phenotype compiler has geometry/rig paths | Native kernel must compile a complete body graph with constraints and deterministic pose sampling |
| Lighting / depth | Phase 4 has background, atmosphere, foreground and lighting layer receipts | Add scene depth, contact receiver, occlusion masks, unified light and camera-space evidence |
| Godot / Blender adapters | Godot client and broader render research exist in the repository | No current-machine acceptance dependency; only an explicit adapter boundary is allowed |
| Reality Studio | Phase 4 desktop/mobile Studio evidence and quality panels exist | Add native visual workspace with progressive disclosure and fail-closed status |
| Phase 5A/5B | External candidate, patch, provider, model/license and blocked-state contracts are reusable | Reclassify as compatibility/teacher/candidate layer; never make external visual execution necessary for native acceptance |

### Classification

- **General capability to retain:** Episode authority, Genome roots, RAGF lineage, X-Sheet alignment, VSR camera profile, RSR director overrides, PNG/FFmpeg/ffprobe, Studio evidence and existing negative tests.
- **Phase 4 demonstration-specific:** front-facing polygonal character geometry, fixed named SVG layers, partial stepped animation, and procedural scalar motion that is not a full body performance state.
- **Render primitives to migrate:** path/shape rasterization, layer compositing, camera transform, opacity, depth ordering, masks, palette fills and evidence roots.
- **Paper-card path to retire as acceptance body:** whole-sheet translation, single front-facing silhouette as the body, debug/text cards, and motion that cannot identify a joint, curve, or deformation region.
- **Native-kernel scope:** visual genome, body graph/topology, skeleton and constraints, facial/hair/costume rigs, performance curves, scene field, style laws, native temporal frame state, residual mapping and repair receipts.
- **External-adapter scope:** optional model execution, reference conditioning, provider/model/license receipts, candidate branches, external temporal/spatial validation and compatibility comparison.

## Phase 5 reclassification

Phase 5A/5B remain valuable as a fail-closed external compatibility layer. They do not prove native visual genesis and are not merged into this branch. Their contracts must remain able to receive future external candidates without allowing external pixels to mutate Episode Intent, Character Genome, Performance authority, or accepted Evidence roots.

The Phase 5B `MODEL_EXECUTION_UNAVAILABLE` state is not a reason to block this Phase 6 native route. It is recorded as a current external-provider boundary and remains visible in the final status.

## Native route candidates

| Route | Strength | Risk | Phase 6 decision |
| --- | --- | --- | --- |
| A. RNCS Custom 2D/2.5D | Runs on current Node/CPU, consumes RNCS IR directly, deterministic, easy to root and test, no CUDA/DCC dependency | Requires real work on body volume, projection, lighting, occlusion and temporal performance; must not regress into card translation | **Selected as main acceptance backend** |
| B. Godot 4 adapter | Strong future preview, camera, skeleton, shader and particle options | Not installed/audited as a current acceptance executor; default renderer does not supply Anime body/style law | Adapter boundary only; not a Phase 6 completion dependency |
| C. Blender NPR/Grease Pencil adapter | Mature geometry/camera/lighting/occlusion offline capabilities | Not installed/audited locally; automation and asset generation are a separate integration cost | Adapter boundary only; not a Phase 6 completion dependency |
| D. Hybrid | Future preview/offline quality split | Three half-finished backends would dilute evidence and authority | Deferred until A has a stable contract |

### Final route decision

Phase 6 accepts **A: RNCS Custom 2D/2.5D Native Visual Renderer**. The renderer will generate a parameterized body from Visual Genome, sample a typed Performance Runtime, resolve a Scene Structure Field and compile Style Laws before writing frames. It may reuse existing low-level raster operations and later expose adapters, but no external visual model, Godot project, Blender file or static SVG reference is required for the native shot.

## Federation record

The following gates are recorded in the required order. `PASS-TO-IMPLEMENT` permits bounded implementation; it is not a claim that the native shot has passed.

| Order | Civilization / gate | Decision | Status |
| ---: | --- | --- | --- |
| 1 | Founder Twin | Prove native identity-to-frame execution, not another panel or provider name | PASS-TO-IMPLEMENT |
| 2 | 柳清莲 Gate | The shot must be legible to a person; no technical test card or hidden quality claim | PASS-TO-IMPLEMENT |
| 3 | 洞哥 Grounding | Current CPU/AMD host is sufficient for a bounded deterministic custom renderer; DCC/model absence is recorded | PASS-TO-IMPLEMENT |
| 4 | 产品文明 | First value is a reproducible playable native shot with honest failure state | PASS-TO-IMPLEMENT |
| 5 | UX / 设计文明 | Studio first screen shows body/backend/render/failure/uplift before technical detail | PASS-TO-IMPLEMENT |
| 6 | 编剧文明 | One shot has clear attention change and start/end intent; Episode remains authoritative | PASS-TO-IMPLEMENT |
| 7 | 动画导演文明 | 3/4 staging, gaze-first turn, weight, anticipation, overshoot, settle and camera motivation are required | PASS-TO-IMPLEMENT |
| 8 | 角色设计文明 | Genome changes must alter body structure while identity invariants remain stable | PASS-TO-IMPLEMENT |
| 9 | 人体结构文明 | Head, neck, shoulders, chest, pelvis and articulated arms must be explicit body nodes | PASS-TO-IMPLEMENT |
| 10 | 角色表演文明 | Face, eyes, brow, jaw, head, shoulder and weight states must be visible and time-bound | PASS-TO-IMPLEMENT |
| 11 | 动画原理文明 | Preparation, rise, main action, deceleration, overshoot and settle must enter curves/tracks | PASS-TO-IMPLEMENT |
| 12 | 美术指导文明 | Palette, silhouette, line, cel bands, material and depth laws must compile to projection | PASS-TO-IMPLEMENT |
| 13 | 摄影文明 | Camera program, perspective, foreground/midground/background and one meaningful occlusion are required | PASS-TO-IMPLEMENT |
| 14 | 视觉语言文明 | Style changes may change projection but not identity/topology/performance authority | PASS-TO-IMPLEMENT |
| 15 | 计算机图形学文明 | Body-space projection, depth, masks, light and deterministic raster output are explicit | PASS-TO-IMPLEMENT |
| 16 | 几何与拓扑文明 | Body topology and deformation dependencies must remain closed across frames | PASS-TO-IMPLEMENT |
| 17 | 物理与动力学文明 | Hair/costume follow-through and contact/weight relations are bounded, recorded and reproducible | PASS-TO-IMPLEMENT |
| 18 | 技术美术文明 | Native render graph separates body, line, cel, depth, mask, light and evidence outputs | PASS-TO-IMPLEMENT |
| 19 | Godot/Blender/渲染后端文明 | One current-machine backend is selected; future adapters cannot own RNCS state | PASS-TO-IMPLEMENT |
| 20 | 数学与形式方法文明 | Roots, invariants, constraints, lifecycle and rollback are machine-readable | PASS-TO-IMPLEMENT |
| 21 | 工程文明 | Extend existing packages and keep generated media outside source unless compact evidence is required | PASS-TO-IMPLEMENT |
| 22 | 代码文明 | Schema and runtime contracts precede orchestration; failures close rather than fabricate | PASS-TO-IMPLEMENT |
| 23 | 测试文明 | Phase 3/4/5A tests remain; new body, performance, scene, renderer and repair gates are mandatory | PASS-TO-IMPLEMENT |
| 24 | 性能文明 | CPU/offline render is acceptable; record frame time, total time and memory boundaries | PASS-TO-IMPLEMENT |
| 25 | 安全文明 | Paths, external processes, evidence roots and optional adapters are constrained and secret-free | PASS-TO-IMPLEMENT |
| 26 | 发布文明 | Source package, reproducibility, SHA-256, status boundaries and CI artifacts are required | PASS-TO-IMPLEMENT |
| 27 | Integration Court | Episode -> Genome -> Body -> Performance -> Scene -> Style -> Frames is the approved dependency order | PASS-TO-IMPLEMENT |
| 28 | Evidence Ledger | Every root and artifact class must be bound without confusing ledger roots and media hashes | PASS-TO-IMPLEMENT |

## Impacted modules

- `packages/world/character-genome-runtime`: visual genome projection and identity invariants.
- `packages/world/reality-asset-genesis-fabric`: parameterized Anime body inputs, lineage and provider receipts.
- `packages/world/character-phenotype-compiler`: reusable geometry/rig/body compilation boundary.
- `packages/world/anime-production-runtime`: native render plan, frame state, sequence validation and evidence integration.
- `packages/world/visual-state-runtime`: camera/style projection profile inputs.
- `packages/world/reality-simulation-runtime`: typed performance/secondary motion inputs.
- `packages/world/world-body-ir` and `packages/world/world-body-codegen`: body/topology vocabulary where compatible.
- `apps/reality-studio` or the existing Studio surface: native visual workspace and A/B/repair display.
- `scripts`, `tests`, `docs`, `evidence`: shot build, reports, source package and release gates.

## Implementation phases

1. Define machine-readable native visual contracts and schema validation.
2. Compile Visual Genome to Body Graph, topology, skeleton and rigs.
3. Compile Performance Intent to pose/transition/curve/secondary-motion receipts.
4. Resolve Scene Structure Field, Camera Program and Style Law Set.
5. Implement the selected RNCS Custom 2D/2.5D renderer with depth/mask/line/cel/light outputs.
6. Add residual detection, scoped repair candidate, reject/restore and receipts.
7. Build the 5-second native shot, render 120 frames at 1280x720/24fps, mux real audio and probe MP4.
8. Produce Phase 4/6 A/B evidence, Studio regressions, full test report and truthful status.

## Acceptance standards

- Native chain runs without an external visual generation model.
- One original character has an explicit body graph, skeleton, joints, face, hair, costume and material/line bindings.
- Genome variation changes body geometry; the same Genome remains identifiable across poses.
- The shot has 120 frames, 1280x720, 24fps, one continuous camera, 3/4 view, FG/MG/BG, perspective, light, occlusion and contact relation.
- Performance includes gaze-first attention change, head/shoulder/weight follow-through, hair or costume follow-through, anticipation, overshoot and settle in the X-Sheet or Motion Track.
- Style Law changes projection without changing identity or body authority.
- Every frame is nonblank, nonduplicate as appropriate, topology-valid and reconstructible from authoritative state.
- Real WAV and real MP4 are produced and ffprobe validates duration, frame count, resolution, fps and audio stream.
- Repair experiment records residual, root cause, candidate branch, local rebuild, before/after, validation, reject/restore and scope.
- Evidence distinguishes `ledger_internal_root`, `ledger_file_sha256`, `evidence_bundle_root`, `artifact_sha256`, `source_package_sha256` and `media_sha256`.

Schema/code/test/MP4 success alone cannot prove human visual acceptance or commercial Anime quality. The highest gate remains whether the native chain visibly generated a body, space, weight, style and temporal performance rather than merely composing a card.

## Risks

| Risk | Mitigation |
| --- | --- |
| Custom renderer becomes another paper cutout system | Require body-space joints, perspective, depth, masks, contact and deformation evidence in tests and representative frames |
| CPU render time or memory exceeds local budget | Keep one 5-second shot, cache authoritative compiled body, measure per-frame and total cost, fail closed on resource errors |
| Genome and body graph split into parallel identity systems | Keep Character Genome as identity authority and derive all body roots from it |
| External adapter silently becomes required | Native shot build has no external-provider dependency; adapter failures are explicit candidate failures |
| Renderer output mutates authority | Frame state is derived and read-only with respect to Episode/Genome roots; repairs are local branches |
| Style edits change identity | Test style-law substitution against invariant roots and body topology |
| Repair rewrites unrelated frames | Use scoped curve/region rebuild and compare unaffected frame roots |
| A technically valid MP4 is mistaken for visual quality | Publish Phase 4/6 A/B, residual report and human-review status separately |

## Rollback

- Git rollback: delete or revert this isolated Phase 6 branch; the Phase 4 baseline and old Phase 5 worktrees remain untouched.
- Runtime rollback: disable the native shot entrypoint and fall back to the existing Phase 4 renderer/evidence without changing Episode or Genome roots.
- Backend rollback: remove the native adapter binding and retain the contract as incomplete; never substitute an external model or old card renderer silently.
- Repair rollback: reject the candidate branch, restore the previous Body/Performance/Style/Scene roots and record the rejection receipt.
- Artifact rollback: remove generated frame/media/build outputs and rebuild from source contracts plus declared tools.

## Unprovable claims at review start

The following are explicitly not proven yet: native body generation, native 3/4 perspective quality, meaningful weight, physical hair/cloth, commercial Anime quality, human visual acceptance, Godot/Blender parity, GPU performance, broadcaster acceptance, and any Phase 6 MP4. They can only be updated from actual generated frames, reports, tests and human inspection.

## Review close status

```text
Native visual architecture status = incomplete
Visual Genome status = incomplete
Morphogenesis status = incomplete
Performance status = incomplete
Scene / camera status = incomplete
Style law status = incomplete
Native renderer status = incomplete
Native 5-second shot status = failed (not yet built; must remain failed until a real native shot exists)
Visual uplift versus Phase 4 = pending-human-review
Human visual acceptance = pending
Commercial Anime quality = not-proven
```

This review authorizes implementation. It does not announce Phase 6 completion.
