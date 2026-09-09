# RNCS Engine Stack Current Archaeology

日期：2026-09-10

状态：`CANDIDATE_ARCHITECTURE_AUDIT`

本记录只沉淀当前源码、schema、测试入口和本地执行结果；不把历史 README、生成物或未执行的外部后端提升为当前能力。

## 审计基线

- RNCS worktree：`codex/rncs-engine-stack-archaeology-v01`，基于 `main-95` 的 `09f11a88e56c93f3b295c767ff71f62f7e4f890f`。
- GitHub `origin/main-95` 当前指针与该 commit 相同。
- 审计开始时工作树干净；本轮新增了 Reality Build 浏览器 runtime 包装修复、回归测试、本地浏览器验收证据，以及 Studio→World Body→Aether runtime 和 Large World→Reality Build 的候选编译/投影链。
- worktree 使用 sparse checkout。部分已被 Git 跟踪的源文件没有物化到磁盘，因此这类失败只能记为 `BLOCKED_CHECKOUT_COVERAGE`，不能冒充语义测试失败。

## 已确认的现实能力

| 层 | 当前真实入口 | 当前证据边界 |
|---|---|---|
| Authoring | Reality Studio Unified Project v0.9、Spatial Workspace v1.4、行为/时间轴/UI/输入/RSR 场景编辑 | Studio 的当前源码存在真实 session、空间编辑、Network Compiler 和导出路径；历史状态文件称 237/237，但本 sparse worktree 的 223 个测试中有 8 个在 import 阶段被跳过的模块阻断。 |
| Physical | RSR v0.9 固定点三维空间模拟、碰撞、约束、角色、重放 | 当前物理、空间、网络 reconciliation、具身和差分相关本地包测试已通过；车辆、地形高度场、自动凸分解、工业接触流形、并行 Job 仍明确未完成。 |
| Visual | VSR v0.8 CPU reference、glTF/GLB/PBR、动画图、蒙皮/morph、WebGPU 编码/真实 Chromium 边界 | 本地 VSR/RSR 专项套件已通过；真实 Chromium 与 fake device 不是目标硬件帧率或跨设备生产证明。 |
| Assets | RAGF 资产创生、资产连续性、GLB/材质/动画候选和 Studio 资产数据库 | 本地候选生产与导入链可运行；外部文生 3D Provider、专业 DCC 回写、电影/AAA 质量和生产资产服务仍未闭合。 |
| Network | Studio network authoring/compiler v1.6，Network Runtime v0.2 的编译世界、预测、回滚、丢包/重排测试 | 当前是本地确定性/故障注入证据，不是真实跨节点部署、攻击面、安全密钥或生产 SLA 证据。 |
| Large World | Large World Runtime v0.1.0-alpha.7 的 WorldSeed→Region→Chunk、有限工作集、URRF/VSR、复制、持久化和恢复 | package 自身测试已取得 36/36 PASS；`createSpatialScene()` 现在可通过显式 generic presentation candidate 进入 Reality Build runtime evidence，但仍不是默认 Studio/Build 产品链。 |
| World Body | World Body IR/codegen v0.1：Declaration→IR→RSR/VSR/temporal/network/render-graph/RCL 候选产物 | IR 36/36、codegen 12/12；9 个生成产物和 manifest 为候选且禁止 commit。现有 evidence 明确把真实 GPU、外部物理、真实分布式网络、生产资产 Provider、目标硬件和完整生产差分记为 `UNVERIFIED`。 |
| Build | Reality Build v0.2：Unified Project→validate/preflight→Behavior+RSR evidence→asset bake→targets→receipt | Web、Windows portable/native EXE、Android project/debug APK、headless/replay 有真实本地路径；release APK/AAB、嵌入式原生渲染、完整 3D RSR/GPU 和设备矩阵仍开放。 |

## 关键执行链分裂

当前源码存在三条可运行但没有统一入口的链：

```text
Reality Studio Unified Project
  → Behavior / Spatial RSR / VSR / Network Compilation
  → Reality Build runtime evidence / target packaging

World Declaration
  → World Body IR
  → generated RSR/VSR/temporal/network/render-graph/RCL candidates

WorldSeed / Chunk runtime
  → URRF portfolio and streaming
  → VSR scene / glTF / GLB provider candidates
  → explicit Reality Build presentation candidate / runtime evidence
```

第一条链的真实 Studio 导出与 Build 运行时仍没有直接调用 `world-body-codegen`；本轮新增的 bridge 是候选 ingress，不是这条生产链的默认 consumer。第二条链的 `world-body-codegen` 仍只接受 World Declaration，尚没有默认 Reality Build consumer。第三条链保持 RNCS world truth 与 URRF/VSR representation 的边界；本轮新增的 Build candidate 只把已有 VSR scene 接入 Build evidence，不把 Large World representation 提升为 canonical world truth 或默认产品资产。

源码级事实：

1. `apps/reality-studio/src/scene-studio.mjs` 的 `exportArtifacts()` 导出行为、资产、空间、GPU、时间轴、Network Compilation 等文件，但不调用 World Body codegen。
2. `apps/reality-build/src/runtime-evidence.mjs` 从 Unified Project 创建 `UnifiedManufacturingSession`，直接重放 Behavior/Spatial trace 并生成 Build evidence；它不消费 World Body IR 或 codegen manifest。
3. `packages/world/world-body-codegen/src/index.mjs` 只接受 `taowind.world-declaration.v0.1`，生成 RSR config、VSR bindings、temporal/network、render graph、event routes、RCL 和 proof template；新 bridge 在 integration 层提供了候选 Unified Project adapter，但 codegen core 没有被 Studio/Build 语义污染。
4. Studio 的 Network Compiler 已经拥有 `project_root`、`spatial_workspace_root`、`source_world_root`、`active_scene_root`、`authoring_root`、`world_config_root` 和 asset binding roots，但这些根没有被映射到 World Body roots。
5. `rncs.modules.json` 登记了 Studio/Build 与 World Body 包，却没有让 Studio/Build 依赖 World Body；本轮已把既有 URRF 与 Large World Runtime 纳入 registry 和 workspace test 编排，并增加了一个显式 Build presentation candidate consumer，但 registry、默认依赖图与目标资产执行链仍未共同闭合。这是能力可发现性与共享执行链缺口，不应靠重复胶水解决。

语义覆盖也不是一一对应：Studio Unified Project 还拥有 behavior、input、sequencer、UI、spatial3d 和 network facets；Studio 的 network fixture 实际覆盖 6 bodies、3 characters、2 asset bindings、2 player slots。World Body IR v0.1 当前有 authority、physical、visual、temporal、assets、observers、events 七类状态 root，另有 BodyMap 与 Render Graph set root；codegen 只对这些声明生成 specialization。它没有直接承载 Studio 的 character controller、joint/material/listener、behavior/UI/input/audio、network transport profile 或 Large World streaming。因而下一步不能把这些字段静默丢进 World Body，也不能把它们硬塞入 World Body core；必须保留 facet owner，并用显式 sidecar/root binding 证明覆盖和缺口。

## 已发现的可复用运行时 donor

`packages/integration/aether-rncs-bridge` 已经提供一条真实的运行时投影 seam，不应再为此新建平行 Reality Cell 或资产生命周期实现：

1. `projectKernelStateToRealityCell(...)` 接受 `EntityKernel` 或已封存的 `rncs.entity-state-batch.v0.1`，经过 RSR authority body/fixture materialization、Network Observer Relevance、固定点 LWC sector/local 坐标，进入 VSR scene/frame/pixel projection。
2. 它保留 `kernel_state_root`、`kernel_batch_root`、`binding_root`、`rsr_state_root`、`rsr_body_root`、`cell_state_root`、`vsr_scene_root`、`vsr_frame_root`、`vsr_pixel_root`，并在有资产时继续保留 `asset_streaming_root`、`asset_binding_root` 和 transition root。
3. 本地实际执行结果：bridge 测试 `29/29 PASS`；Reality Cell、异步 payload lease/eviction、GLB/glTF scene binding、重复资产实例、Cell transition/cache demos 均产生 sealed evidence。
4. 本机 Chrome/Playwright WebGPU smoke 已通过：kernel binding、Reality Cell、GLB/glTF asset scene、near→far→near transition 共 `4/4 PASS`；均验证 `submitted=true`、`deviceLost=false`、Node frame root 与浏览器 receipt frame root 相等、无 page/shader/request error，并生成 PNG。第一次运行因 sparse checkout 未物化 Studio 的已跟踪依赖而失败；补齐物化范围后通过，不能把第一次失败归因于 VSR 语义。

这条 donor 的边界同样明确：源码检索只发现 Reality One Gateway 与 Studio 浏览器 smoke 消费它；本轮新增的 Studio→World Body→Aether projection、Reality Build request candidate consumer 和 Large World generic presentation consumer 都是显式 candidate-only adapter，仍没有默认生产 authoring/build consumer。因此它已经成为可复用的共享 runtime seam，但还不是统一的 authoring-to-runtime compiler。`rncs.modules.json` 对它的依赖列表也比其真实 `package.json` import 图窄，存在 registry discoverability/build-order 缺口。

## 当前 Studio / Build 真实执行审计

在补齐 sparse checkout 中已跟踪但未物化的依赖后，本地重新执行了两个产品入口：

- Reality Studio：`246 tests / 244 pass / 1 fail / 1 skip`。空间、网络世界编译、资产数据库、RAGF 接受、行为、UI/input、TileMap/navigation、GPU frame 和 browser-facing server tests 均通过。唯一失败是 `geometric-truth-workspace.test.mjs` 把当前缺失的 Phase 6.3 evidence 文件（`phase6-3-status.json`、`strict-morphology-certificate.json`、`phase6-3-after-measurements.json` 等）按 `pass/green` 断言；源码的 workspace builder 正确返回 `blocked/missing`，不能用静态改断言把它提升为已完成媒体能力。
- Reality Build：初始审计为 `133 tests / 124 pass / 1 fail / 8 skip`。构建图、Asset Database、确定性构建根、Android debug APK、Runtime Evidence、Replay/Headless、外部 VSR scene→RSR body binding 和 legacy fallback 均通过；Windows native/Go 相关目标按工具链状态 skip。两个浏览器包装缺口在本轮修复后重新验证为 `133 tests / 125 pass / 0 fail / 8 skip`；World Body candidate consumer 后为 `135 tests / 127 pass / 0 fail / 8 skip`，本轮加入 Large World generic presentation candidate 后完整 Build 套件为 `137 tests / 129 pass / 0 fail / 8 skip`。Studio 的唯一失败仍是上面的 Phase 6.3 evidence 缺失，不因本轮修复改变。

该 Build 缺口是新的近端共享发布瓶颈：同一个 3D runtime packager 同时服务 Web Release、Web single、Windows portable 和 Android embedded HTML。Reality Studio 直接加载的 `vsr-spatial-browser.js` 是 IIFE/`var` 入口，已通过 Chromium smoke，不能替代 Reality Build 生成物的 classic-script 验证。修复后，VSR 3D 改为复用该既有 IIFE；RSR 则把现有 spec、convex narrow phase 与 spatial embodiment dist 组合成无 ESM export 的 classic script，并隔离窄相位内部 helper，避免重复实现物理语义。

## 本轮受控修复与真实执行证据

这不是新增引擎子系统，而是把已有运行时接到它声明的浏览器发布入口：

1. `apps/reality-build/src/runtime-template.mjs` 的 VSR 3D 入口改为读取版本库中的 `packages/world/visual-state-runtime/apps/spatial-v04/vsr-spatial-browser.js`，只增加 `parseColor` 与 `window.__RNCS3D__` 适配，不再对 ESM dist 做不完整的 export 正则变换。
2. 同文件的 RSR 入口补入已有 `convex-narrow-phase.js`，在局部作用域内导出 `collideConvex`，并剥离仅属于 ESM 模块边界的 `export *`；不改变 RSR world、碰撞、state root 或 authority contract。
3. `apps/reality-build/tests/runtime.test.mjs` 新增 classic-script 解析负例门：禁止残留顶层 `import/export`，并要求真实 VSR bundle、RSR 窄相位和执行器存在。
4. 回归结果：runtime template `17/17 PASS`；Reality Build 全套 `133 PASS / 0 FAIL / 8 SKIP`。
5. 真实构建 `output/engine-stack-3d-packaging-v03` 的 `status=built`、`verification.valid=true`，Web Release、Web Single、Windows Portable 三个目标均有 target receipt；本次 receipt root 为 `74bae5bdaa712e9cf6e039ad97fc46508472aef6dada57c5df5e832a6b9098ef`。
6. `apps/reality-build/evidence/BROWSER_ACCEPTANCE_v0.2.json` 为 `pass=true`：Web Release、Web Single、Windows Portable 各完成 309 ticks 的行为胜利路径；三者均 `rsr_loaded=true`、RSR snapshot `verified=true`、VSR 3D frame `verified=true`、5 个 draw packets、无 page error，Canvas 2D projective fallback 实际绘制并产生截图。
7. 本机该次 Build 验收报告 `navigator_gpu=false`，因此 WebGPU executor、目标硬件帧率和设备矩阵仍是 `UNVERIFIED`；这次证据只能提升“真实浏览器 classic script + RSR + VSR 3D compile/verify + Canvas fallback”这一窄门。

## 本轮共享编译脊柱候选 adapter

在不复制 RSR、VSR、Network Runtime、Reality Cell 或资产流送语义的前提下，新增了 `packages/integration/world-body-studio-bridge`：

```text
Studio Unified Project
  + active Spatial World
  + active Scene / asset roots
  + optional verified Network Compilation
  → explicit Studio sidecar + taowind.world-declaration.v0.1
  → existing World Body IR/codegen
  → existing 9-artifact candidate bundle
```

实现边界：

1. `model-3d → mesh` 是封闭资产 kind 的显式 lowering；原始 kind、asset root、GLB file root 和 mapping reason 进入 sidecar，不能把 `model-3d` 静默伪装成 World Body 原生 kind。
2. Studio 的 Spatial body 位置、旋转、速度、质量、sphere/box/capsule fixture 和 body tags 进入既有 World Declaration；`massQ` 以 `round(massQ / 1000)` 降为 grams，转换规则进入 sidecar。
3. Studio 2D scene transform 不被转换成 3D authority transform；原始 node transform 只作为 source metadata 保留。没有 scene node 的 RSR body 生成 synthetic visual node，并显式计数。
4. Studio character controller、joint/material/listener、render graph、UI/input 和其他非 World Body facet 不塞进 IR core；保留 source facet summary 和缺口列表，等待各自 owner 的后续 adapter。
5. 可选 Network Compilation 必须先验证 `compilation_root`、`evidence_root` 以及 project/workspace/world/scene root 一致性；缺失 network compilation 会生成 candidate，但必须在 gap 中标记。
6. bundle、manifest、declaration 和底层 codegen artifacts 都保持 `candidate-artifact-generation-only-no-commit`，没有 commit、promotion 或 release authority。

本地真实执行：

- `npm test --workspace @taowind/world-body-studio-bridge`：`13/13 PASS`，包含 bundle tamper、declaration tamper、network-root tamper、unsupported asset kind、missing active world、no-network-compilation、Aether lossy-block/runtime/receipt 负例，以及 verified asset-instance/network-observer runtime。
- `npm run test:generated-runtime --workspace @taowind/world-body-studio-bridge`：独立子进程把临时生成的 9 个 artifact 写入隔离目录，并执行既有 `world-body.generated.test.mjs`；`1/1 PASS`，实际闭合生成 RSR config、VSR bindings、rollback snapshot、network envelope 和 tamper rejection。
- `npm run demo --workspace @taowind/world-body-studio-bridge`：fixture 的 `6` 个 spatial bodies 进入 `6` 个 World Body entities，`2` 个 scene/body bindings，`4` 个 synthetic visuals，`1` 个 asset lowering，生成 `9` 个既有 codegen artifacts；candidate `worldBodyRoot=90adf7100e1c2e2514a8e8ba94e9c0475a5a84b72d1e2138e11322c0eb9c374a`，`semanticDeclarationRoot=a12fbbffa4b9ca5421530b944a8c2cd3312b4c8413952ef863dca58290630c2f`。
- Network Compilation root `af43344d519e3e09c46efe09318f66685489d8732f0b50ccd8db482dd2a21531`、Studio project root、workspace root、source world root、scene root 均在 sidecar 中保留并校验。
- 回归：World Body IR `36/36 PASS`，World Body codegen `12/12 PASS`，World Body formal theory `8/8 PASS`，Studio network compiler `6/6 PASS`，Network Runtime `27/27 PASS`，Aether bridge `29/29 PASS`，VSR `122/122 + 99/99 + 6/6 + 4/4 + 21/21 + 11/11 PASS`，RSR build suites 全部通过。

该 adapter 关闭了“Studio authoring 能否进入既有 World Body compiler”的候选入口，并新增了显式有损与显式无损条件分开的 Aether Cell runtime projection；Reality Build 通过独立的 request candidate seam 已能消费 World Body 与 generic Large World presentation candidate，但默认生产链仍未接入。共享 Kernel spatial donor 本轮已把动态质量通过 `spatial.body.mass_q → SpatialBodySpec.massQ`、完整 fixture 集合通过 `spatial.fixtures.items → SpatialBodySpec.fixtures[]`、角色控制器通过 `spatial.character` 闭合；在调用者提供真实可校验 GLB runtime 且显式开启 `bindNetworkObserver` 时，视觉资产实例和 Network Observer Relevance 也经既有 donor 执行并验证。未配置的资产/网络 facet、完整网络 transport/session 和默认目标资产流送仍未闭合，因此 `RCL_GAP_RNCS_SHARED_WORLD_COMPILATION_SPINE` 仍未关闭，只是拆成可验证的 ingress、runtime projection、Build consumer 和 donor contract 子缺口。没有新增 K400 PASS。

## 本轮 World Body → Aether runtime projection

为验证下游 donor，而不是再造 RSR/Reality Cell/VSR，`world-body-studio-bridge` 现在提供显式的 `compileStudioWorldBodyAetherProjection()` 与 `projectStudioWorldBodyCandidateToRealityCell()`：

```text
candidate World Body IR
  → sealed rncs.entity-state-batch.v0.1 candidate projection
  → existing Aether kernel → RSR → Reality Cell → VSR projection
```

这条 projection 的重要边界：

1. 默认遇到不可逆语义损失就 `STUDIO_WB_AETHER_LOSSY_PROJECTION_BLOCKED`；只有调用者明确传入 `allowLossyProjection: true` 才会执行实验性 candidate projection。
2. World Body 的 `worldBodyRoot`、semantic declaration root、source reality root、projection root、Kernel batch root 和 Aether runtime roots 分开保存；Aether 结果不获得 World Body authority，也没有 commit/release 权限。
3. Kernel spatial materializer 保留旧的单 fixture `spatial.fixture`，并新增 `spatial.fixtures.items` collection lower；World Body adapter 现在把完整 fixture 集合（包括 fixture id、局部位置、sensor、material、body zone、tags、collision filter）送入既有 `SpatialBodySpec.fixtures[]`，所以不再记录 `first-fixture-only` 或 secondary-fixture loss。动态质量通过可选 `spatial.body.mass_q` 进入既有 `SpatialBodySpec.massQ`，Studio character facets 通过 `spatial.character` 进入既有 RSR character contract，并在 RSR snapshot 中验证。调用者显式提供并通过 SHA-256 校验的 GLB/Gltf asset runtime 后，World Body visual asset bindings 会进入既有 Reality Cell asset streamer/GLB importer；显式开启 network observer binding 后，Network Compilation player slots 会进入既有 Observer Relevance。完整 transport/session 和没有对应 runtime 的 facet 仍保持 loss/sidecar，不伪装成已接入。
4. `verifyStudioWorldBodyAetherProjection()` 将 receipt root 与实际 runtime roots 绑定，篡改 runtime receipt 或 root 会失败。

本地真实执行：

- bridge 测试：`13/13 PASS`，其中默认有损阻断、显式有损 projection runtime、receipt tamper、重复 GLB asset instance 和 Network Observer Relevance binding 均有正负例。
- `npm run demo:aether-runtime --workspace @taowind/world-body-studio-bridge`：`PASS_CANDIDATE_RUNTIME`；6 个实体进入已有 RSR snapshot 和 `cell:studio-world`，同一个经过 SHA-256 校验的 GLB 被绑定为两个 World Body asset instances，两个 Network Compilation player slots 进入 Observer Relevance，Reality Cell state verification 为 true，并生成 kernel/batch/binding/RSR/cell/VSR/asset streaming roots。
- 本次 candidate projection root 为 `dbd4c623ff5944af9c665d94b715c27881b576f72425c926a717364d1a36f1f9`，receipt root 为 `a97b14bb1b2926ac86d308aa00fa94153b1d594dc5e65ffaf9a05dfbcfb0f37b`；显式 runtime 的 loss codes 为空。未配置 runtime 的 inspection 仍保留 `RCL_GAP_WB_AETHER_VISUAL_ASSET_BINDING`、`RCL_GAP_WB_AETHER_NETWORK_BINDING`，动态质量和 3 个 Studio character facets 已由 shared Kernel donor 传递并在 runtime snapshot 中验证。

这证明的是“已有 runtime seam 能消费一份候选 projection，并在显式提供真实资产 payload 与 observer binding 时关闭对应 loss”，不是 World Body 已经完整驱动物理、资产、网络或生产渲染。下一阶段必须优先补齐完整 network transport/session、joint/音频/UI 等仍由其他 facet owner 持有的 contract，或让更高层 consumer 在没有语义丢失时再允许 projection；不能把 `allowLossyProjection` 推进为默认产品路径。

## 本轮 World Body → Reality Build candidate consumer

Reality Build 已有 `compileBoundPresentationScene(project, snapshot, fallbackScene, fallbackFramePlan)` 接缝：它能把外部 VSR presentation scene 的 body bindings 应用到 authoritative RSR snapshot，并把 source root、binding count 和 frame root 写进 runtime evidence。考古发现不能把这个 scene 直接塞回 Unified Project：VSR camera/scene 使用非整数参数，而 Studio canonical 会以 `STUDIO_FLOAT_FORBIDDEN` 拒绝这种混合工件。

因此新增 `apps/reality-build/src/world-body-candidate.mjs`，把 candidate presentation 作为 Build request 的显式 `presentation_candidate` 输入：

```text
Studio World Body candidate + existing Studio spatial VSR scene
  → Build-owned presentation_root / presentation_source_root
  → Build request_root + build identity
  → existing compileBoundPresentationScene
  → runtime evidence / target receipt
```

边界保持明确：

1. `createWorldBodyRealityBuildPresentationCandidate()` 不修改 Unified Project，也不把浮点 VSR scene 写回 Studio canonical；它只生成 candidate-only scene/binding artifact。
2. candidate 的 `world_body_root`、`semantic_declaration_root`、VSR `scene_root`、`presentation_root` 和 `presentation_source_root` 分开保存；Build request root 与 identity 会绑定 `presentation_root`。
3. body node 缺失默认 `REALITY_BUILD_WORLD_BODY_PRESENTATION_UNMAPPED` 阻断；不能靠 legacy fallback 把未绑定 body 当作已消费。
4. `buildRuntimeEvidence()` 与 `buildProject()` 只有在 request 明确携带 `presentation_candidate` 时才消费它；默认 Build 路径仍保持原有 Studio fallback。

本地真实执行：

- `apps/reality-build/tests/world-body-candidate.test.mjs`：`2/2 PASS`，覆盖完整 `buildProject → runtime-evidence → verifyBuild` 和缺失 body node 负例。
- candidate `presentationRoot=e3cfe526626a55c42714e43f2711d6308a442e10df323529f2b6a22870ce2fcf`，`presentationSourceRoot=8abf6e07cd4efe4dbc6696c51ac2c8f977c66abc576879e15a9d9b824d21815c`，6 个 body bindings 全部映射。
- 完整 Build candidate run：`verification.valid=true`，Build receipt root `933715340cc51703a2d5b006360a7528d313298d8b834391ad107b1102eeb9b6`，runtime evidence root `6fb2c73682a32cd72c89b15a34a96305f7a22fb5e8844d0c0eab5b99ef146f16`；evidence 中 `presentation_scene_source_root` 与 candidate source root 相等，presentation frame root 与 spatial frame root 均为 `cc9e93802263aacd07fc478a6c5eec8224237a5955c3908672a9badd35e3f8b3`。

这只关闭了 World Body 到 Build 的显式 candidate consumer 接缝；它没有把 candidate 自动晋升为默认 build authority，也没有关闭 Aether projection 的资产/网络 loss、完整 network transport/session、WebGPU 或真实设备矩阵。

## 本轮 Large World → Reality Build generic presentation consumer

考古确认 Large World Runtime 已经拥有完整的 `createSpatialScene()` VSR lowering 和 `verifyLargeWorldSpatialScene()`，缺口不在再造地形或 streaming，而在 Reality Build request validator 只认识 World Body 专用 candidate 信封。新增的 `reality-build.spatial-presentation-candidate.v0.1` 复用现有 `compileBoundPresentationScene()`：

```text
WorldSeed → Region → Chunk → URRF selection → existing VSR scene
  → generic candidate root envelope
  → Reality Build runtime evidence → target receipt
```

这条路径不把 Large World terrain 映射成 RSR physical bodies，也不修改 Unified Project。无 bindings 的 scene 仍然可以被 Build 编译成 CPU-reference spatial frame；如果以后提供 body bindings，仍沿用同一个已有绑定函数，并由 authoritative RSR snapshot 承担位置来源。

本地真实执行：

- `node --test apps/reality-build/tests/large-world-presentation-candidate.test.mjs`：`2/2 PASS`；覆盖 4 个 active streaming cells、17 个 VSR nodes、candidate scene tamper rejection 和跨 project root rejection。
- `npm test --workspace @taowind/reality-build-fabric`：`137 tests / 129 pass / 0 fail / 8 skip`。
- 固定 fixture 的 candidate roots：`presentationRoot=a49ec2c65663f85d854e5f8e18e2234757f5126591c0763913e2cd4ad2afda78`、`presentationSourceRoot=61fc0af2040fce5ab44fa077639c8e955958c494342f02ba3f8286f0fd4c6183`、`candidateSceneContentRoot=a86127f411c7e98d33d96657c9b1fa30fd95e1955ddfca9ecf3574a08e345eb8`；Large World 原生 `scene.scene_root=6d2189c4ae01259be0f7c3cb7e06a713a96e9c53669aeb7d73535dd2aaabc673` 仍保留在 scene payload 内。
- Build run：`build_id=build:3167a203d9d5086cb083fb34`、`build_key=3167a203d9d5086cb083fb349afec82466488a8580ba541901756ed69122d3aa`、`runtimeEvidenceRoot=2976c26d04540e59d4243276211cc2dcccbdb64097725458df8d81b9ea44fbff`、`presentationFrameRoot=55be3408c050024cb5bd1a90105fc0254a17551d10695a8b77def313a18b7405`，`verifyBuild.valid=true`。Build receipt root 未作为固定证据保存，因为请求 root 包含临时 project/output 路径。

边界：这是 Build evidence consumer 的 candidate proof，不是 Large World 已经进入 Web/Android 目标包的资产流送、真实网络 transport、目标 GPU 或设备矩阵证明；`rncs://` scene asset references 尚未由该 seam 自动烘焙进 target package。

## 结构判断

### 限制性瓶颈

当前存在两个有先后关系的瓶颈：`RCL_GAP_RNCS_RELEASE_3D_BROWSER_SCRIPT_PACKAGING` 已完成一个本地候选修复并通过三个 Build target 的真实浏览器回归，但 Android embedded 独立浏览器运行和 WebGPU/目标设备仍未验证；结构性瓶颈仍是 `RCL_GAP_RNCS_SHARED_WORLD_COMPILATION_SPINE`，其 Studio ingress、Aether runtime projection、shared mass/character/asset-instance/compound-fixture donor、Network Observer Relevance binding 和 World Body/Large World Build candidate consumer 已有证据，但完整 network transport/session、目标资产流送、默认 Studio/World Body/Large World/Build 生产链仍未共同进入同一 runtime seam。

这不是“再写一个引擎子系统”的缺口，而是已有子系统不能共同承载同一个世界工件的缺口。应把 Aether bridge 作为下游 runtime donor；若直接在 Studio、Build、Large World 各自添加转换，或重新实现 Reality Cell/资产生命周期，会产生重复语义、root 混淆和无法回滚的并行系统。

### 必须保持的不变量

1. World Body IR/codegen 继续是世界身体语义与候选 specialization 的 owner，不把 Studio UI 或 Build target 语义塞进 IR core。
2. Studio Unified Project 是 authoring owner；Studio/Build 现有手写/直接 RSR/VSR 路径继续是 fallback，不能被候选 codegen 静默替换。
3. `project_root`、`spatial_workspace_root`、`source_world_root`、`worldBodyRoot`、`stateRoot`、`frameRoot` 和 `compilation_root` 必须各自保留，不能用一个 hash 代替全部语义。
4. adapter 只能生成 candidate bundle、差分结果和 evidence；不得获得 RNCS/RFE commit、release promotion 或外部设备授权。
5. 未执行的浏览器 GPU、外部物理、真实网络、生产资产 Provider 和目标硬件继续标记 `UNVERIFIED`。

## 下一最小高杠杆候选

第一优先的 Build 3D classic-script packaging 已完成局部候选修复和真实浏览器回归；Studio→World Body→Aether 已完成候选 ingress、显式 asset-instance/observer binding runtime projection 和 shared mass/character/compound-fixture donor，Build 也能通过显式 request candidate 绑定同一 World Body source root；Large World VSR scene 现在也能通过 generic candidate 进入 Build evidence。下一阶段应优先解决 candidate scene asset references 到 target asset catalog/streaming 的共同 contract，不能复制 Reality Cell/streaming/render glue，只做：

```text
Unified Project + selected spatial world + scene/asset roots
  → candidate scene/asset manifest with explicit source roots
  → existing Build Asset Database / RAGF content-addressed payloads
  → target runtime asset catalog and bounded streaming evidence
```

第一轮 ingress 已以 `examples/studio-authored-network-world-v03/project.mjs` 为 fixture 验证：确定性 World Declaration/codegen、Studio roots 与 World Body roots 的显式绑定、Network compilation root 保持、模型 kind lowering、2D transform 不越权、篡改/缺失资产/非法 authority 负例闭合；第二轮验证有损 candidate bundle 能进入 Aether Cell 并保持各级 runtime roots；第三轮验证 Build request candidate 能将同一 source root 写入 runtime evidence 并通过 Build 自校验；第四轮把动态质量经 shared `mass_q` donor 传入 RSR；第五轮把 3 个 Studio character facets 经 shared `spatial.character` donor 传入 RSR；第六轮把完整 fixture 集合经 `spatial.fixtures.items` 传入 RSR/VSR；第七轮把 Large World VSR scene 经 generic Build candidate 接缝执行。下一轮应优先把 scene asset references、RAGF/Asset Database payload roots 与 target catalog/streaming evidence 连接起来，同时保留 network transport/session 和真实设备边界；任何晋升为默认产品路径的动作仍需独立 authority/设备证据。

## K400 / 证据裁决

本轮完成资产考古、既有 runtime donor 的真实执行和边界定位，不宣布 K400 任一新单元 PASS。下一候选必须分别提供 `EXPRESS / COMPILE / LOWER / EXECUTE / CORRECT / ROBUST / PERFORMANCE / AI_GENERATE / EVIDENCE` 的可重放回执；源码生成、schema 通过、package test 通过或本机 Chrome smoke 不能替代目标硬件、外部物理、真实分布式网络和生产差分门。

当前总体裁决：`PROCEED_AS_CANDIDATE`；World Body 仍是 `F4.5 Partial Production Parity` 方向上的候选基础，Studio/Build/Large World 统一消费链尚未实现。
