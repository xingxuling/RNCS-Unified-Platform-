# RNCS Engine Stack Current Archaeology

日期：2026-09-10

状态：`CANDIDATE_ARCHITECTURE_AUDIT`

本记录只沉淀当前源码、schema、测试入口和本地执行结果；不把历史 README、生成物或未执行的外部后端提升为当前能力。

## 审计基线

- RNCS worktree：`codex/rncs-engine-stack-archaeology-v01`，基于 `main-95` 的 `09f11a88e56c93f3b295c767ff71f62f7e4f890f`。
- GitHub `origin/main-95` 当前指针与该 commit 相同。
- 审计开始时工作树干净；本轮新增了 Reality Build 浏览器 runtime 包装修复、回归测试、本地浏览器验收证据，以及 Studio→World Body→Aether runtime 和 Large World→Reality Build 的候选编译/投影链；本轮后半段把 Large World provider record → VSR GLB import → explicit mesh binding → WebGPU receipt 接通到 web-release candidate host。
- worktree 使用 sparse checkout。部分已被 Git 跟踪的源文件没有物化到磁盘，因此这类失败只能记为 `BLOCKED_CHECKOUT_COVERAGE`，不能冒充语义测试失败。

## 已确认的现实能力

| 层 | 当前真实入口 | 当前证据边界 |
|---|---|---|
| Authoring | Reality Studio Unified Project v0.9、Spatial Workspace v1.4、行为/时间轴/UI/输入/RSR 场景编辑 | Studio 的当前源码存在真实 session、空间编辑、Network Compiler 和导出路径；历史状态文件称 237/237，但本 sparse worktree 的 223 个测试中有 8 个在 import 阶段被跳过的模块阻断。 |
| Physical | RSR v0.9 固定点三维空间模拟、碰撞、约束、角色、重放 | 当前物理、空间、网络 reconciliation、具身和差分相关本地包测试已通过；车辆、地形高度场、自动凸分解、工业接触流形、并行 Job 仍明确未完成。 |
| Visual | VSR v0.8 CPU reference、glTF/GLB/PBR、动画图、蒙皮/morph、WebGPU 编码/真实 Chromium 边界 | 本地 VSR/RSR 专项套件已通过；真实 Chromium 与 fake device 不是目标硬件帧率或跨设备生产证明。 |
| Assets | RAGF 资产创生、资产连续性、GLB/材质/动画候选和 Studio 资产数据库 | 本地候选生产与导入链可运行；外部文生 3D Provider、专业 DCC 回写、电影/AAA 质量和生产资产服务仍未闭合。 |
| Network | Studio network authoring/compiler v1.6，Network Runtime v0.2 的编译世界、预测、回滚、丢包/重排、HTTP authority、checkpoint 与 Node-only durable-store candidate | 当前已有本地生成 headless、独立 Node 恢复、注入式临时文件/原子 rename 恢复与 HTTP 负例证据，不是真实断电、跨节点部署、WAN/TLS、攻击面、安全密钥或生产 SLA 证据。 |
| Large World | Large World Runtime v0.1.0-alpha.7 的 WorldSeed→Region→Chunk、有限工作集、URRF/VSR、复制、持久化和恢复 | package 自身测试已取得 36/36 PASS；`createSpatialScene()` 现在可通过显式 generic presentation candidate 进入 Reality Build runtime evidence，复用 VSR asset streaming、GLB import 和 explicit mesh binding，在本机 Chromium 产生 WebGPU draw receipt；仍不是默认 Studio/Build 产品链。 |
| World Body | World Body IR/codegen v0.1：Declaration→IR→RSR/VSR/temporal/network/render-graph/RCL 候选产物 | IR 36/36、codegen 12/12；9 个生成产物和 manifest 为候选且禁止 commit。现有 evidence 明确把真实 GPU、外部物理、真实分布式网络、生产资产 Provider、目标硬件和完整生产差分记为 `UNVERIFIED`。 |
| Build | Reality Build v0.2：Unified Project→validate/preflight→Behavior+RSR evidence→asset bake→targets→receipt | Web、Windows portable/native EXE、Android project/debug APK、Android WebView CacheStorage candidate、headless/replay 有真实本地路径；release APK/AAB、嵌入式原生渲染、完整 3D RSR/GPU 和设备矩阵仍开放。 |

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

第一条链的真实 Studio 导出与 Build 运行时仍没有直接调用 `world-body-codegen`；本轮新增的 bridge 是候选 ingress，不是这条生产链的默认 consumer。第二条链的 `world-body-codegen` 仍只接受 World Declaration，尚没有默认 Reality Build consumer。第三条链保持 RNCS world truth 与 URRF/VSR representation 的边界；本轮新增的 Build candidate 只把已有 VSR scene、provider payload 和显式 binding plan 接入 Build evidence/浏览器 candidate host，不把 Large World representation 提升为 canonical world truth 或默认产品资产。

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

这条 donor 的边界同样明确：源码检索只发现 Reality One Gateway 与 Studio 浏览器 smoke 消费它；本轮新增的 Studio→World Body→Aether projection、Reality Build request candidate consumer 和 Large World generic presentation/import consumer 都是显式 candidate-only adapter，仍没有默认生产 authoring/build consumer。因此它已经成为可复用的共享 runtime seam，但还不是统一的 authoring-to-runtime compiler。`rncs.modules.json` 对它的依赖列表也比其真实 `package.json` import 图窄，存在 registry discoverability/build-order 缺口。

## 当前 Studio / Build 真实执行审计

在补齐 sparse checkout 中已跟踪但未物化的依赖后，本地重新执行了两个产品入口：

- Reality Studio：`246 tests / 244 pass / 1 fail / 1 skip`。空间、网络世界编译、资产数据库、RAGF 接受、行为、UI/input、TileMap/navigation、GPU frame 和 browser-facing server tests 均通过。唯一失败是 `geometric-truth-workspace.test.mjs` 把当前缺失的 Phase 6.3 evidence 文件（`phase6-3-status.json`、`strict-morphology-certificate.json`、`phase6-3-after-measurements.json` 等）按 `pass/green` 断言；源码的 workspace builder 正确返回 `blocked/missing`，不能用静态改断言把它提升为已完成媒体能力。
- Reality Build：初始审计为 `133 tests / 124 pass / 1 fail / 8 skip`。构建图、Asset Database、确定性构建根、Android debug APK、Runtime Evidence、Replay/Headless、外部 VSR scene→RSR body binding 和 legacy fallback 均通过；Windows native/Go 相关目标按工具链状态 skip。两个浏览器包装缺口在本轮修复后重新验证为 `133 tests / 125 pass / 0 fail / 8 skip`；World Body candidate consumer 后为 `135 tests / 127 pass / 0 fail / 8 skip`，Large World generic presentation candidate 后为 `137 tests / 129 pass / 0 fail / 8 skip`，加入 VSR streaming/browser-host regression 后为 `138 tests / 130 pass / 0 fail / 8 skip`；补充 Android Gradle closure、Windows `.bat` command adapter 和 `apksigner.bat` 回归后为 `140 tests / 132 pass / 0 fail / 8 skip`，本轮又用带空格标题真实构建并修复 `.bat/.cmd` 的 `cmd.exe` space-safe 参数传递，最终为 `141 tests / 133 pass / 0 fail / 8 skip`；本机 `buildProject(target=android-apk)` 真实产出并验签 debug APK。Studio 的唯一失败仍是上面的 Phase 6.3 evidence 缺失，不因本轮修复改变。

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

考古确认 Large World Runtime 已经拥有完整的 `createSpatialScene()` VSR lowering、`verifyLargeWorldSpatialScene()`、带 cell 归属的 asset catalog 和 GLB provider bundle，缺口不在再造地形或重复 streaming，而在 Reality Build request validator 只认识 World Body 专用 candidate 信封，且 generic scene consumer 尚未调用既有 VSR asset resolution/import/binding。新增的 `reality-build.spatial-presentation-candidate.v0.1` 复用现有 `compileBoundPresentationScene()`、`resolveSpatialAssetStreaming()`、`VSRSpatialAssetStreamer` 与 VSR glTF asset runtime：

```text
WorldSeed → Region → Chunk → URRF selection → existing VSR scene
  → generic candidate root envelope + explicit asset binding plan
  → Reality Build runtime evidence → content-addressed target payloads
  → VSR GLB import receipt → mesh replacement → WebGPU receipt
```

这条路径不把 Large World terrain 映射成 RSR physical bodies，也不修改 Unified Project。无 body bindings 的 scene 仍然可以被 Build 编译成 CPU-reference spatial frame；有 provider bundle 时，`createSpatialAssetBindingPlan()` 只接受可在现有 VSR scene 中找到的 `source_mesh_id`/node 集合，并把 record 的 LOD/cell 归属显式写入 candidate manifest。浏览器 host 选择 ready 的最低 LOD，通过既有 streamer 取字节、校验 GLB import receipt，再调用共享 `composeImportedSpatialScene(..., mode='replace-mesh')`；scene 仍由 VSR 拥有，RSR 只承担既有 authoritative body projection。

本地真实执行：

- `node --test apps/reality-build/tests/large-world-presentation-candidate.test.mjs`：`2/2 PASS`；覆盖 4 个 active streaming cells、17 个 VSR nodes、4 个 candidate asset records 的 streaming resolution（requested=4、missing=0）、candidate scene tamper rejection 和跨 project root rejection。
- `npm test --workspace @taowind/reality-build-fabric`：`141 tests / 133 pass / 0 fail / 8 skip`；另有 VSR spatial asset `7/7 PASS`、Aether bridge `29/29 PASS`。
- Chromium `web-release` smoke：`PASS`；VSR/RSR 均加载、运行时无页面异常，控制台只记录两个 WebGPU `powerPreference` 警告和一个 favicon 404；`spatial3d.verified=true`，4 个 active cells、17 个 streamed nodes、11 个 visible draws、402 triangles、`culledDraws=0`；scene catalog `requested=4`、`missing=0`。候选 GLB payload catalog `36` 条，其中 active-cell request `33` 条、`ready=33`、`missing=0`、`failed=0`、实际字节校验加载 `144632` bytes，VSR payload receipt root 为 `f63d5f84bb98aef244daa7104d0ab78dac8bf647e8184062420df6476fdbaa89`；11 条 explicit asset bindings、`importFailed=0`、binding root 为 `1494adb2c6a8783bcd450e1c0fbab8ba5a57cb7ad9d4cc588822d7bcca0ecf92`；transition root 为 `0317301809c9bda3292596bed9f0c17f767ef0737ec7c6d9dfa117b28c61cb83`，本次初始工作集 `released=0`、`evicted=0`。WebGPU receipt 为 `vsr.spatial-webgpu-receipt.v0.4`、`drawCalls=11`、`triangles=402`、`submitted=true`、`deviceLost=false`，并捕获了 `#spatial-game` 3D 画布截图；人工视觉验收仍独立保留。
- 固定 fixture 的 candidate roots：`presentationRoot=97001e67da694d19e3dcb768125715f1c4b0f879478dde1abe110bbe6d6ba0cf`、`presentationSourceRoot=1d0430dde0db78e781898c16420c9fc7f66fec98ab7fc3fd5ef93e4e0cb2b06c`、`candidateSceneContentRoot=a86127f411c7e98d33d96657c9b1fa30fd95e1955ddfca9ecf3574a08e345eb8`；Large World 原生 `scene.scene_root=6d2189c4ae01259be0f7c3cb7e06a713a96e9c53669aeb7d73535dd2aaabc673` 仍保留在 scene payload 内。
- Build run（`web-release` + `web-single`）：`build_id=build:3a0b2d6074fb6e689a03af95`、`build_key=3a0b2d6074fb6e689a03af9583a80b7fac607bb760556ee97bdb87085a1aa2bd`、`runtimeEvidenceRoot=449a5ee44ace7d75971baf9aa56eec32a24558a71f529564900c41a13bc63cc1`、`presentationFrameRoot=fd45b4bf0eecd0b82436abe8ea7ecea3c13f05b76d4c4ca608bef5ff954031a6`、`presentationAssetStreamingRoot=535401c5186c7499b4e230b0e0c8c694ebdf955dd06c3729847bdbf8b5e04136`，`verifyBuild.valid=true`。Build receipt root 为 `a5a732a0c320c456d64470bd9e2ae60fa8cbcde067c037e8f0094fea71da69cc`；请求 root 含临时 project/output 路径，固定证据只记录此运行值。

边界：这是 Build evidence consumer 与 candidate browser host 的 proof；它已经执行并封存 scene asset references 的 VSR streaming resolution、11 条显式 mesh binding、GLB import receipt 和当前 Chromium WebGPU submission。它仍不是 canonical world mutation、Android 物理/目标设备 GPU 矩阵、实时网络 transport/session、生产资产服务或人工视觉验收证明；3 个没有 cell 归属的 provider payload 被正确延迟，不被伪造为 active request。

## 本轮 Large World candidate payload → target package loader

继续考古确认后，没有在 Reality Build 重写 GLB 编码器或 Reality Cell 生命周期；直接复用 `createLargeWorldSpatialGlbBundle()` 的 provider record/payload、`VSRSpatialAssetStreamer` 的依赖/并发/SHA 校验和现有 target packaging：

```text
Large World GLB provider bundle
  → explicit presentation.asset_bundle candidate envelope
  → content-addressed web-release files / embedded base64 payloads
  → existing VSRSpatialAssetStreamer acquire(activeCellIds)
  → payload receipt
  → existing VSR glTF/GLB import receipt
  → explicit replace-mesh binding plan
  → browser frame/WebGPU receipt
```

本轮新增的 generic bundle envelope 保留 provider `format/version/bundle_root/manifest` 以及每个 asset record，不把 chunk-level `asset:chunk` 记录静默改名成 mesh/LOD。Build 生成 `spatial-asset-payload-manifest.json`，固定 fixture 为 `payload_count=36`、`byte_length=154432`、`payloadRoot=cad88da9ca1a6554cc6b150a78b8bf72eed8cfbacc06e0179811a6d50b913f56`；candidate asset bundle root 为 `26ce2c395e07ecd7eaeb7887d714ae61207e113702f559002773403e321b77eb`，provider bundle root 为 `af695b4ae66347464c7653cdc55331cf1c1fcbaf0ccfcea41613d4b3dd8c13e3`。

这轮关闭的是“候选 payload 能否进入 Build target、由真实浏览器 streamer 读取/校验，并按显式 plan 导入/绑定到 VSR scene”的窄候选接缝，不是“资产已经成为 canonical world truth”。provider record 与 scene asset catalog 的双根仍保留；3 条无 cell 归属的 payload 继续 deferred。随后本机又完成了从生成 Android 工程到 debug APK、`apksigner` 验签，以及 `Rcl_Aether_API35_ATD` Emulator 中的 WebView/Canvas fallback 冷启动候选证据；下一条真实缺口转为物理/目标设备 GPU 独立执行、cache eviction/增量工作集、网络 transport/session 和真实设备/性能证据。

## 本轮 Large World candidate asset binding → browser WebGPU receipt

这一轮没有再建新的资产生命周期或渲染器，而是把上一轮确认存在的 VSR glTF importer、Aether 共享 composition seam 和 Build payload loader 组合成一个显式 candidate path：

```text
provider asset record
  → source_mesh_id / node_ids / lod / cell_ids binding plan
  → ready payload bytes + SHA verification
  → VSR GLB importer receipt
  → shared VSR composeImportedSpatialScene(replace-mesh)
  → compileSpatialFrame(streaming=forced active cells)
  → VSRSpatialWebGPUExecutor receipt
```

实际改动：

1. `packages/world/visual-state-runtime/packages/gltf-asset` 新增共享 `composeImportedSpatialScene()` 与 `computeSpatialAssetBindingRoot()`；Aether Reality Cell 删除重复的材质/纹理 remap，改为调用这一 donor。`replace-mesh` 只替换已有 VSR node 的 mesh/material 引用，不把 imported scene 变成 RSR authority。
2. Reality Build candidate 只从 provider metadata 的 `source_mesh_id`/`lod` 生成 binding plan，明确拒绝不存在的 source mesh、node 不匹配、重复 asset 或隐式 showcase asset；target payload manifest 和 runtime evidence 都保留 `asset_bindings`。
3. 浏览器 adapter 复用 `VSRSpatialAssetStreamer`、GLB import receipt 和共享 composition；生成的 Large World GLB 没有 camera 时，Build browser adapter 显式启用 importer 的 `defaultCamera` fallback，不能把缺 camera 的 provider payload 伪装成完整 authoring scene。
4. VSR 的正式 streaming resolver 原本已存在；本轮只修复 Build browser adapter 漏传 `forcedCellIds` 的发布层缺口，使 frame compiler 与 asset streamer 使用同一活动工作集。未改变 VSR core 的 streaming semantics。

本地真实执行：

- VSR glTF asset suite：`22/22 PASS`；Aether integration suite：`29/29 PASS`；Reality Build focused runtime/candidate：`20/20 + 2/2 PASS`；完整 Reality Build suite：`141 tests / 133 pass / 0 fail / 8 skip`；Windows BAT space-safe argument regression `PASS`。
- Chromium web-release：pageErrors=`0`，4 cells/17 streamed nodes，11 visible draws/402 triangles/0 culled draws；36 条 payload catalog 中 33 条真实进入 `/assets/spatial/*.glb` performance resource 表并被 streamer 计为 ready，11 条 binding，import failure=`0`。
- 同一页面的真实 WebGPU receipt：`vsr.spatial-webgpu-receipt.v0.4`、`drawCalls=11`、`triangles=402`、`submitted=true`、`deviceLost=false`；`#spatial-game` 截图显示导入后的空间几何。此证据是本机 Chromium host 证据，不是目标硬件性能或 Android 证据。
- `android-project` candidate target：回归测试现在实际生成 Android Studio 工程，并检查 `app/src/main/assets/index.html` 仍携带 `VSRGltfAsset`、11 条显式 `asset_bindings`、base64 payload、无外部 script `src`，且 `android-build-manifest.apk_built=false`。把该 assets 目录通过本地 HTTP 代理加载到 Chromium 后，仍得到 33/33 ready、11 bindings、11 draw calls、402 triangles、`submitted=true`、`deviceLost=false`；随后使用同一生成工程、Gradle 9.5.1 与 Android SDK 35 真实生成了 324425-byte debug APK，Windows `apksigner` 报告 v2 verified/one signer。APK 在 `Rcl_Aether_API35_ATD` Emulator 中冷启动两次，CDP 看到 `file:///android_asset/index.html` complete、RSR/3D `verified=true`、33/33 ready、11 bindings、Canvas2D fallback；WebGPU adapter unavailable，物理/目标设备运行仍未证明。

这轮已关闭 `RCL_GAP_RNCS_TARGET_PAYLOAD_IMPORT_BINDING` 的 web-release candidate 子缺口，并增加了 Android-project 静态嵌入、代理宿主检查、host APK 构建/签名回执和 Emulator WebView candidate；没有关闭其物理/目标 GPU、原生/跨设备/生产子缺口，也没有新增 K400 PASS。

## 本轮 Android target build seam

真实 APK 构建前的工具链考古发现了两个发布层缺陷：生成的 Gradle 模板把 `debug` 与 `release` 闭包压在同一行，Gradle 会把 `release` 误解析到 `debug`；Windows SDK 的 `apksigner` 和外部 Gradle 又需要 `.bat/.cmd` 调用适配，且带空格的 APK 路径要求 `cmd.exe` 使用 verbatim argument 传递。修复后，统一命令适配层服务预检、Gradle 和 `apksigner`，并增加生成文本、SDK tool discovery 与空格路径回归。

本机真实结果：生成的 Large World Android 工程经 Gradle 9.5.1、Android SDK 35、JDK 25.0.1 通过 `assembleDebug`，APK 为 `324425` bytes，SHA-256 为 `AE417FDA1AA7F4282CB394164A81D108B0B9EBE25B633DB25C0BDEBD67880DD2`；`apksigner` 报告 v2 `true`、one signer。另以 `Large World GPU Candidate`（标题含空格）真实生成 `android-apk`，`verification.valid=true`，确认 space-safe `.bat` invocation。Reality Build 的 `android-apk` target 也以 `verification.valid=true` 产出并在 manifest 中记录 `signature_verification.status=verified`。该 APK 在 `Rcl_Aether_API35_ATD` Emulator 以 `-gpu host` 安装、启动，CDP 观察到 WebView 页面 complete、RSR/3D roots verified、33/33 payload、11 bindings、Canvas2D fallback；WebGPU adapter unavailable。`Medium_Phone_API_36.1` AVD 另行尝试时由 emulator 报 `No initial system image for this configuration`，不能作为 GPU 负例归因于应用。以上都是 Emulator/工具链 candidate，不是物理/目标设备 GPU、安装分发或持续生产运行证明。

## 本轮 VSR asset residency transition 接缝

资产驻留考古确认：`VSRSpatialAssetStreamer` 原本已经拥有依赖解析、lease、release、evict 和 budget resolver；缺口不是再建一个缓存，而是 Cell/Build 在切换工作集时没有共享、可验证的生命周期收据。复用 Aether `createRealityCellAssetSceneRuntime` 的“先 acquire 下一场景，再释放上一租约，最后按下一解析结果驱逐”语义，在 VSR 增加通用 `reconcile(previousReceipt,nextReceipt)` 和 `vsr.spatial-asset-transition.v0.1` receipt。

```text
previous streaming receipt
  → acquire next working set
  → release previous lease closure
  → evict next resolution candidates with no lease
  → rebuild nested streaming receipt and transition root
```

本轮真实验证：VSR spatial asset suite `7/7 PASS`，其中用 7-byte/4-byte budget 复现并关闭了“解析报告 evicted、但旧 lease 仍使 resident 无法驱逐”的缺口；Aether integration `29/29 PASS`，Cell scene transition 已改用同一 VSR seam；Reality Build browser host 在初始 candidate load 后也生成并暴露 `transitionRoot`。Chromium live run 的 transition `released=0`、`evicted=0` 是因为本次固定四-cell工作集没有发生超预算切换，不应被叙述成已验证 Build 动态 eviction；动态 cell/camera transition、持久 cache、性能曲线和目标硬件仍未执行。

这次只吸收通用资产生命周期语义，没有把 VSR receipt 提升为 RSR authority，也没有把 provider payload 变成 canonical world state。`apps/reality-studio/web` 与 spatial-v04 浏览器 bundle 已同步生成；当前 console 只有两个 WebGPU `powerPreference` 警告和一个 favicon 404，运行时无页面异常。

## 本轮 Reality Build dynamic spatial working-set observer

本轮继续复用既有 Large World/VSR 语义，没有新建一套宿主级 streaming/cache。考古确认 `LargeWorldRuntime.observe()` 已有 entered/exited/evicted working-set 计算，VSR 已有 `resolveSpatialStreaming()`、`VSRSpatialAssetStreamer.acquire/reconcile()` 和 GLB importer；Reality Build 的缺口是浏览器宿主把 scene cells 固定全开、且在 residency 变化后直接复用已经替换过 mesh 的 scene。修复集中在 `apps/reality-build/src/runtime-template.mjs`：

```text
observer position + explicit forced cells
  → existing VSR streaming resolution
  → acquire next active-cell assets / release previous receipt / evict
  → rebuild VSR scene from immutable base scene
  → compile and render the same active-cell frame
```

宿主现在暴露 `setSpatial3DObserver()` 与 `setSpatial3DCamera()`，同时保留 observer/camera 的独立性。`spatial3dFrameScene()` 只构造当前 frame 的 streaming view，不改写 canonical VSR scene、RSR state 或 Large World truth；因此 camera 不移动时，frame 的 active cell 列表仍与资产工作集一致。`createRuntime()` 复位时也重新启动同一资产加载链，避免 reset 后出现“payload ready 但 mesh 尚未绑定”的假通过。

本地真实执行结果已写入 `apps/reality-build/evidence/LARGE_WORLD_DYNAMIC_SPATIAL_TRANSITION_CANDIDATE_v0.1.json`：

- 生成游戏源码语法 `PASS`；Reality Build `141 tests / 133 pass / 0 fail / 8 skip`。
- 真实 Chromium 复位后初始工作集为 4 cells、36 ready payloads、12 bindings、12 draws、390 triangles、`verified=true`。
- observer 强制切换到单一 cell 后为 6 bindings、18 ready payloads，释放 36、驱逐 18，frame 为 1 active cell/6 draws/162 triangles，`verified=true`。
- 再切换到另一 cell 后重新加载 8576 bytes，恢复 3 bindings/3 draws/44 triangles，`verified=true`；三阶段均无 missing/failed/import failure。
- 控制台只有两个 Windows WebGPU `powerPreference` 警告和一个 favicon 404；没有 runtime/page exception。

边界：这关闭的是 web-release candidate 的 reset→工作集转场→驱逐→回入→rebind 接缝，不是 Large World 新 chunk 生成、持久 cache 性能曲线、物理/目标设备 GPU、跨节点网络 transport/session 或生产资产服务证明。目标设备和性能证据仍保持 `UNVERIFIED`。

## 本轮 Android embedded target transition

Android 审计先用 web-release 外部 URI 直接覆盖 `android-project` assets，真实 WebView 运行得到 `assetPayloadFailedCount=36/18/9`；这不是 Android runtime 缺陷，而是 target packaging 违反了 `embeddedHtml()` 的 payload 约束。随后按既有 `large-world-presentation-candidate.test.mjs` 重新生成 Android 工程，检查 `index.html` 为 `1133236` bytes 且包含 base64 payload，再用 Gradle 9.5.1、Android SDK 35 生成 `325945` bytes debug APK；Windows `apksigner` v2 verified、one signer。该负例与修复后的正例共同证明了“web-release URI 不能冒充 embedded Android payload”的边界。

真实 `Rcl_Aether_API35_ATD` WebView/CDP 结果已写入 `apps/reality-build/evidence/LARGE_WORLD_ANDROID_EMBEDDED_DYNAMIC_CANDIDATE_v0.1.json`：

- 初始 reset 解析 4 cells，33 个 embedded payload ready、11 条 GLB mesh binding，加载 `144632` bytes，frame 为 4 active cells/11 draws/402 triangles，`mode=webgpu`、`verified=true`。
- observer 移到 `[10000,0,10000]` 后解析为空工作集，4 cells exited，33 个 payload released/evicted，frame 为 0 active cells/0 draws，`verified=true`。
- observer 回入并显式请求 `cell:chunk:world:large-build-candidate:-1:-1` 后恢复 12 个 payload、4 条 binding、加载 `53036` bytes，frame 为 1 active cell/4 draws/116 triangles，`verified=true`。
- 三阶段 `importFailed=0`、asset/spatial error 为空；这是 Android Emulator/WebView target seam candidate，不是 physical device、release APK/AAB、持续生产运行或人工视觉验收证据。

## 本轮 Reality Studio network compilation → Reality Build headless candidate

本轮先做了负向构建审计：同一个 `examples/studio-authored-network-world-v03/project.mjs` fixture 的 `project.network` 和 `compilation_root` 已存在，但 Reality Build 当时仍返回 `buildValid=true`，目标目录没有 `network-world-compilation.json`，生成的 `server.mjs` 也没有 `RealityNetworkRuntime`。因此缺口不是重新实现 network compiler 或 session，而是 Build 没有消费既有 compilation seam。

复用关系现在是：

```text
Reality Studio project.network
  → compileNetworkWorld() / verifyNetworkWorldCompilation()
  → Reality Build network-compilation graph node
  → build identity + core artifact + receipt + integrity root
  → generated headless server
  → RealityNetworkRuntime.createSessionFromCompilation()
  → loopback join/submit/advance OR HttpAuthorityClient → authority joinCompiledSlot / submitInputPacket / ack-snapshot/delta
```

实际改动保持了既有 owner：

1. `apps/reality-build/src/network-build.mjs` 只负责调用 Studio compiler、fail-closed 验证和向 Build 转交 compilation；没有复制 Studio network schema，也没有改写 `world_config` 或 authority roots。
2. `builder.mjs` 在存在 `project.network` 时生成 `network-compilation` 节点，把 `compilation_root` 纳入 Build identity、`network-world-compilation.json`、core file hash、receipt、integrity 和 `verifyBuild()`；没有 network facet 的旧项目不会生成意外 artifact。
3. `targets.mjs` 只给 `headless-server` 接入既有 Network Runtime。目标同时声明旧 loopback-local-candidate 的六个端点和新的 HTTP authority-client candidate 六个端点；后者接收既有 packet，不复制协议或把 server 内部 prediction 冒充外部 client。`HttpAuthorityClient` 是可复用的 client-side adapter，内部仍由 `ClientPredictionRuntime` 负责预测/ack/delta 收敛。Web/Android embedded presentation targets 没有被静默改造成网络客户端。

本地真实结果：Network Runtime 当时为 `27/27 PASS`，checkpoint/HTTP 负例后为 `29/29 PASS`，接入 durable-store 后为 `30/30 PASS`；Reality Build 全套为 `142 tests / 134 pass / 0 fail / 8 skip`；新增集成测试真实启动生成的 `server.mjs`，通过旧 loopback 端点加入 `slot:blue`、`slot:red`，再通过 `HttpAuthorityClient` 让独立 `ClientPredictionRuntime` 获取 delegation/snapshot、提交 `network.input.v0.2`、推进 server tick 并消费 ack/snapshot，最终在 health 和 client metrics 中验证 source roots 与 `synchronized`，并通过 forged subject、direct state write、future tick 三类 HTTP 负例。篡改或删除 root artifact 会使 `verifyBuild()` 失败。证据文件为 `apps/reality-build/evidence/REALITY_BUILD_NETWORK_HEADLESS_CANDIDATE_v0.1.json`。

这关闭的是“既有 Studio network compilation 能否进入 Reality Build headless candidate，并分别走到既有 local loopback 与 HTTP authority-client candidate”的候选接缝；仍未关闭 WAN/真实跨节点 transport、TLS/密钥与攻击面、真实多设备客户端、网络压测/SLA、生产部署和发布 authority。没有新增 K400 PASS。

## 本轮 Network session checkpoint → 新 Runtime 恢复候选

继续考古发现，网络运行时已有 RSR `SpatialEmbodimentWorld.fromSnapshot()`、Snapshot/Delta、收据和 RBF recovery candidate，但没有把 Session 的玩家绑定、AAF delegation、未消费输入、幂等序列和 authority history 一起封存/恢复的入口；现有 `disconnect/reconnect` 只在同一进程的 Map 中工作。随后审计确认 `LargeWorldDurableStore` 是唯一具备临时文件同步、原子 temp→rename、目录 sync、主文件优先恢复和 fault injection 的完整 donor；Developer Execution 只有 rename，RFE journal 只有 hash 链。为避免 Network 依赖 Large World，本轮将原子 JSON 存储抽为 `@taowind/rncs-durable-store`，由 Large World 和 Network 各自保留 bundle/checkpoint 验证、语义 receipt 与 authority 边界。

```text
ServerAuthoritativeWorld
  → network.session-checkpoint.v0.1
     (RSR snapshot + players/AAF delegations + pending inputs + seen sequences
      + receipts + bounded authority history + source roots)
  → verify checkpoint root and RSR snapshot
  → new RealityNetworkRuntime / independent Node process
  → continue the same authoritative tick and State Root chain
```

实际改动：

1. `ServerAuthoritativeWorld.createCheckpoint()` 封存完整会话候选状态；`verifyNetworkSessionCheckpoint()` 校验格式、版本、候选/非权威边界、checkpoint root、tick/State Root 对齐和必要数组。
2. `ServerAuthoritativeWorld.fromCheckpoint()` 只在 RSR snapshot 通过 `SpatialEmbodimentWorld.fromSnapshot()`、玩家 body/character 唯一绑定和 AAF delegation 完整存在时恢复；不把 checkpoint hash 当成外部身份或 commit 权限。
3. `RealityNetworkRuntime.createSessionFromCheckpoint()` 新建 Loopback/authority context；编译网络世界只保存 source roots，恢复时必须重新提供并重新验证原始 Studio compilation。`joinCompiledSlotAuthority()` 对同一已验证 slot 支持显式 resume，避免把进程恢复误判成新玩家加入。
4. 生成 headless server 的独立 `HttpAuthorityClient` 负例验证了 forged subject、直接 position 写入和过远 future tick 都在 HTTP seam 被拒绝；这复用既有 `network.input.v0.2` 和 `ServerAuthoritativeWorld`，没有另建认证或状态协议。
5. Node-only `NetworkSessionCheckpointStore` 复用共享 `AtomicJsonStore` 的 temp file sync、atomic rename、directory sync、primary-first recovery 和 `after-temp-sync`/`after-rename` fault injection；Network adapter 再生成 `rncs.network-checkpoint-store-receipt.v0.1`，明确 `canonicalStateMutated=false`、`candidateOnly=true`、`authoritative=false`、`commitStatus=NOT_COMMITTED`。

本地真实结果：

- 共享 Durable Store：`1/1 PASS`；实测写入先 sync 临时文件，再 atomic rename，并在目录 sync 不可用时保留诚实的布尔结果；`after-temp-sync` 后主文件优先恢复，删除主文件后有效 temp 被提升，`after-rename` 后主文件仍可恢复，tampered JSON 被判为 `CORRUPT`。
- Large World Runtime：`36/36 PASS`；原有 `LargeWorldDurableStore` 已改由共享 provider 执行原子文件机制，domain verifier、bundle receipt、replication ledger 和 authority boundary 仍由 Large World 拥有。
- Network Runtime：`30 tests / 30 pass / 0 fail`；其中 checkpoint 经过 JSON 序列化，由独立 Node 进程恢复，保留一个未消费输入并在 tick 1 得到相同 State Root；编译世界还验证了 source roots 必须重新提供，已占用 slot 只能显式 resume；另有 Network checkpoint store 的 primary/temp/corrupt/fault recovery 回归；篡改世界快照会被 root 校验和恢复入口共同拒绝。
- Reality Build network integration：`1/1 PASS`；生成的 headless server 通过 `HttpAuthorityClient` 完成 authority join/ack convergence，并对三类外部 HTTP 负例完成 `SUBJECT_FORGED`、`CLIENT_STATE_WRITE_FORBIDDEN`、`INPUT_TOO_FAR_FUTURE` 拒绝验证。
- 固定 checkpoint candidate 运行：`checkpointRoot=931bd7c728342139ac8170844faa0ab4b63f93c470ba970f53a2633e21b4409b`、起始 `stateRoot=fnv1a64:e3edc69676577918`、恢复后 tick `1` / `stateRoot=fnv1a64:928490f57cb77e90`、JSON `23664` bytes。

边界：这是本地 Node 文件系统上的 candidate；已经执行 temp sync、atomic rename、directory sync、primary-first recovery 和两处 fault injection，但不是实际断电/文件系统损坏、跨节点 durable quorum、WAN/TLS、跨节点 lease/leader、密钥轮换、真实多设备重连、负载/SLA 或生产 failover 证明。共享 provider 也不拥有 domain schema、canonical state 或 commit authority；checkpoint 仍是 `candidateOnly=true`、`authoritative=false`、`commitStatus=NOT_COMMITTED`。没有新增 K400 PASS。

## 本轮 Reality Build headless checkpoint → 新进程 HTTP 恢复候选

durable-store 接入后继续沿真实 Build 产物考古：生成的 `headless-server/server.mjs` 原本只在启动时用 `createSessionFromCompilation()` 创建内存会话；它没有把 checkpoint store 接到 server 生命周期。新增路径只在 network-enabled headless target 中出现，并要求调用者显式设置绝对路径环境变量 `RNCS_NETWORK_CHECKPOINT_PATH`：

```text
POST /network/authority/checkpoint
  → createCheckpoint(networkAuthoritySessionId)
  → NetworkSessionCheckpointStore.save()
  → rncs.network-checkpoint-store-receipt.v0.1

新 Node server 进程
  → POST /network/authority/recover
  → primary-first / temporary promotion recovery
  → createSessionFromCheckpoint({ checkpoint, compilation })
  → /network/authority/join 显式 resumed=true
```

这次只复用既有 Network Runtime、checkpoint schema、source-root rebind、`HttpAuthorityClient` 和新共享 store；没有在 Build target 复制状态协议，也没有把 HTTP caller 变成 canonical state owner。server manifest 现在显式记录 `node-local-file-candidate`、`RNCS_NETWORK_CHECKPOINT_PATH` 和两个 endpoint，未配置路径时 endpoint fail closed。

真实验证：`apps/reality-build/tests/network-build.test.mjs` 在同一测试中启动第一个独立 Node server，加入 authority slot、提交并推进输入、保存 checkpoint；结束进程后用相同构建和相同 checkpoint path 启动第二个独立 Node server，调用 recover，随后通过 HTTP authority join 得到 `resumed=true`，恢复后的 snapshot/health State Root 与保存的 checkpoint 一致。Reality Build 全套保持 `142 tests / 134 pass / 0 fail / 8 skip`。

边界：这是生成 headless target 的本地双进程 candidate，不是 WebSocket/UDP/QUIC、TLS、WAN、跨节点 lease/leader、真实断电、共享 durable quorum、多设备重连或生产 failover。checkpoint endpoint 只在显式本地路径下开放，receipt 仍保持 `candidateOnly=true`、`authoritative=false`、`commitStatus=NOT_COMMITTED`；没有新增 K400 PASS。

## 本轮 URRF transport semantic seam → Network loopback carrier candidate

本轮资产考古纠正了“RNCS 没有统一 transport contract”的旧判断：`packages/kernel/rncs-core-contract/src/reality-transport.mjs` 已拥有 profile、packet、QoS、loss mode、authority admission、discovery、association、roaming 和 Organ Link 契约；`packages/world/reality-representation-fabric/src/transport-runtime.mjs` 已拥有对应的 candidate-only `RealityTransportFabric`。因此没有新建 WebSocket/UDP/QUIC 平行协议，也没有复制历史 DuoWorld Relay。

真正的执行缺口是 Network Runtime 的 `LoopbackTransport` 只做裸消息排队和故障模拟，未消费既有 semantic seam。本轮把最小共享绑定接入 Loopback：

```text
Network Runtime message
  → deterministic RDN/local candidate profile
  → URRF transport packet + profile/packet root
  → existing Loopback loss/latency/reorder/duplicate delivery
  → authoritative ServerAuthoritativeWorld remains the only world writer
```

`input` 映射为 `CONTROL`，`ack` 映射为 `ACK`，`rejection` 映射为 `NACK`，`delta/snapshot` 映射为 `STATE_DELTA`；传输包带有 `candidate_only=true`、`authoritative=false`、`commit_status=NOT_COMMITTED`，并明确 `worldMutation=false`。运行时 payload 的浮点值保留在实际 Loopback message 中；只有用于 URRF root 的候选编码把浮点数转成十进制字符串，避免放宽 Core Contract 的哈希规则。

本地真实结果：`@taowind/reality-network-runtime` 为 `31 tests / 31 pass / 0 fail`，新增测试验证 Loopback message 的 `CONTROL` packet、source/target node、packet root、fabric root 与 candidate/authority flags；`@taowind/reality-representation-fabric` 的 transport suite 也验证 packet read accessor 和既有 authority-gated packet。Network health 现在同时暴露 Loopback delivery stats 与 URRF transport `profile_root/fabric_root/packet_count`。候选证据封存在 `packages/network/reality-network-runtime/reports/NETWORK_TRANSPORT_FABRIC_LOOPBACK_CANDIDATE_v0.1.json`。

边界：这关闭的是既有 semantic transport contract 到 Network Runtime loopback candidate 的 execution seam；它不是物理 WebSocket、UDP、QUIC、WebRTC、TLS、WAN、NAT、第二网络、多设备重连、跨节点 lease/leader、生产 relay 或 SLA 证明。历史 DuoWorld donor 仍受 private-preview/许可证、密钥、部署和异网证据边界约束；详细审计见 `docs/architecture/engine-stack/EXTERNAL-TRANSPORT-DONOR-AUDIT-2026-09.md`。没有新增 K400 PASS。

## 本轮 Reality Cell content-addressed cache → shared Node provider

继续考古发现，Aether/Reality Cell 已经有可运行的内容寻址磁盘缓存，但它原先把 SHA-256 校验、manifest root、临时文件写入、冷启动 rehydrate 和确定性 LRU 全部内嵌在 integration bridge；VSR `VSRSpatialAssetStreamer` 只拥有内存 residency/lease，Reality Build Web/Android 仍直接消费 embedded/URI payload。这里的限制不是再写一个 cache，而是把已有机制抽成可复用的 provider，同时不把 Node 文件系统误报成跨平台 runtime。

本轮新增 `packages/control/rncs-asset-cache`，并让 `createRealityCellAssetCache(...)` 作为兼容包装：

```text
VSR streamer loader seam
  → Reality Cell compatibility format
  → shared @taowind/rncs-asset-cache Node provider
  → SHA-256 payload verification + root-checked manifest
  → deterministic byte-budget LRU
```

实现保持语义 owner 不变：VSR 仍拥有内存资产状态与 lease，Reality Cell 仍拥有依赖闭包、prefetch、eviction receipt 和 Cell binding；共享 provider 只拥有可丢弃的二进制 cache bytes、manifest recovery 和 diagnostics，不拥有 canonical world state、资产选择、authority、promotion 或 commit。manifest 复用 `@taowind/rncs-durable-store` 的 verified temp→rename/recovery；二进制 payload 采用独立的 synced temp→rename，并在读回时重新校验 byte length 与 SHA-256。

本地真实结果：`npm test --workspace @taowind/rncs-asset-cache` 为 `3/3 PASS`；`npm test --workspace @taowind/aether-rncs-bridge` 保持 `29/29 PASS`，覆盖旧 Reality Cell 格式兼容、冷启动 rehydrate、tampered payload、确定性 LRU、prefetch/lease 分离、GLB/glTF binding 与 transition。候选证据写入 `packages/control/rncs-asset-cache/reports/ASSET_CACHE_PROVIDER_CANDIDATE_v0.1.json`。

边界：本轮只关闭“既有 Reality Cell cache donor → shared Node cache provider”的 implementation seam；没有关闭浏览器 Cache Storage/IndexedDB、Android app-private persistence、跨进程/远程 cache coherence、部署级 invalidation、BasisU/KTX2、Draco/Meshopt、format-aware prefetch、HLOD/PCG、目标设备性能或生产资产服务。该缺口记录为 `RCL_GAP_RNCS_RUNTIME_ASSET_CACHE_PROVIDER`，没有新增 K400 PASS。

## 本轮 Reality Build browser CacheStorage provider → scene revision invalidation candidate

Node provider 抽取后继续考古确认：浏览器宿主已经拥有真实 CacheStorage，但 Reality Build 原先没有把 VSR payload manifest 的 revision root、字节校验和缓存收据接到 loader seam；在本轮 browser lowering 开始时，Android target 仍使用 embedded base64 payload，不能把浏览器 CacheStorage 静默冒充 Android 持久缓存。因此该轮只在既有 VSR `VSRSpatialAssetStreamer` loader seam 上增加 browser lowering，没有新建第二套资产驻留语义；Android host 的实际 lowering 在下一轮单独验证。

```text
Reality Build spatial payload manifest
  → payload_root as revision root
  → VSRSpatialAssetStreamer loader
  → createVSRBrowserAssetCache() / CacheStorage
  → SHA-256 + byte-length verification
  → cold rehydrate or revision invalidation
```

实现位于 `packages/world/visual-state-runtime/packages/spatial-reality-3d/src/browser-asset-cache.ts`，Reality Build `runtime-template.mjs` 只负责按 project identity 选择稳定 cache name、传入 `payload_root` 和读取 inspect receipt。provider 只拥有 SHA-addressed、可丢弃的浏览器 bytes、manifest root、diagnostics、byte-budget LRU 和 revision invalidation；VSR 继续拥有 catalog、lease、active working set、GLB import、mesh binding 与 residency transition，RNCS/RFE authority 没有变化。

本地真实结果：VSR typecheck/lint 通过；VSR 全套为 `122/122 PASS`，其中空间资产 suite 为 `9/9 PASS`；Reality Build 为 `142 tests / 134 pass / 0 fail / 8 skip`。Chromium 真实运行同一 project/cache name：v1 首次 active load `ready=39`、`cacheMisses=39`、`importFailed=0`、`170656` bytes，冷重载为 `cacheHits=39`；切换到新的 `payload_root` 后发出 `VSR_BROWSER_ASSET_CACHE_REVISION_CHANGED`，v2 首次 `ready=36`、`cacheHits=0`、`cacheMisses=36`、`importFailed=0`，再次冷重载为 `cacheHits=36`。收据写入 `apps/reality-build/evidence/BROWSER_ASSET_CACHE_PROVIDER_v0.1.json`，证据根为 `b23b8e1222302106b3d7cfa719454ffbf15670a9fd06370ec4b9a0e79888c2bf`。

边界：这关闭的是 Chromium CacheStorage 的 candidate read/write/rehydrate/revision-invalidation seam，不是 Android lowering、IndexedDB/quota 策略、跨进程/远程 coherence、CDN/部署级 invalidation、缓存性能曲线、物理/目标设备、生产资产服务或人工视觉验收；没有新增 K400 PASS。浏览器 provider 的“持久”只表示该浏览器 profile 的 CacheStorage 生命周期，不表示跨设备或生产可靠性。

## 本轮 Reality Build Android WebView synthetic-origin → CacheStorage candidate

Android 目标的资产考古先做了负例：生成的宿主使用 `file:///android_asset/index.html` 时，WebView 报告 `CacheStorage=true`、`crypto.subtle=true`，但 `Cache.put` 被拒绝为 `Request scheme 'file' is unsupported`；这说明“浏览器 API 存在”不能推出“Android 缓存 lowering 可用”。继续检查后，现有嵌入 HTML 已经是完整 base64 payload，缺少的只是宿主 origin，不需要再建原生缓存桥或复制 VSR provider。

```text
generated android-project/index.html
  → MainActivity reads the packaged asset
  → WebView.loadDataWithBaseURL("https://rncs.local/", ...)
  → existing createVSRBrowserAssetCache() / CacheStorage
  → SHA-256 + byte-length verification
  → cold process rehydrate or payload-root invalidation
```

实现收回 `apps/reality-build/src/targets.mjs`：Android host 现在把 APK 内的 `index.html` 读入内存，用固定 `https://rncs.local/` synthetic origin 加载；该 URL 只提供本地文档 origin，不是远程服务、TLS endpoint、WAN transport 或 authority。VSR 继续拥有 catalog、lease、active working set、import 和 residency receipt；WebView CacheStorage 只拥有可丢弃 app-private payload bytes 与 provider manifest。

本地真实结果：当前源码生成的 v1/v2 Android project 均由 Gradle 9.5.1、Android SDK 35 构建成功；Reality Build 为 `143 tests / 135 pass / 0 fail / 8 skip`，目标契约为 `30/30 PASS`。在 `Rcl_Aether_API35_ATD`（Android 15/API 35，`com.android.webview 124.0.6367.219`）同一包更新过程中，v1 为 `payloadCatalog=42`、`ready=39`、`cacheMisses=39`、`170656` bytes；v2 payload root 改变后发出 `VSR_BROWSER_ASSET_CACHE_REVISION_CHANGED`，`ready=36`、`cacheMisses=36`、`156064` bytes；进程重启后 `ready=36`、`cacheHits=36`、`cacheMisses=0`、`importFailed=0`。证据写入 `apps/reality-build/evidence/ANDROID_ASSET_CACHE_PROVIDER_v0.1.json`，证据根为 `2bdf6c1680210c24a5926ad6c31f9944b7f901f9b04734a172a9ab372596ab96`。

边界：这关闭的是 Android WebView/app-private CacheStorage 的 candidate origin/read/write/revision-invalidation/rehydrate seam，不是 WebView quota 或压力 eviction/performance 曲线、跨进程/跨设备 coherence、外部网络资产流送、物理设备 GPU、release signing、商店交付或人工视觉验收；没有新增 K400 PASS。APK 为 debug signing，当前 payload 仍嵌入 APK，不宣称 production cache 或真实网络。

## 本轮 Android WebView cache budget + provider-backed load scheduling

继续对 Android lowering 做压力考古时，`asset_cache` 原先只有 provider 内部默认预算，Reality Build request/schema 和 build identity 没有共同携带可审计的预算策略；在 `50,000`-byte 压力下，完整强制 catalog 的顺序扫描还会先把后续可复用的 LRU 条目驱逐，导致进程重启没有实际 cache hit。这个限制不是再建一套 Android cache，而是把已有 Node/browser provider contract 的预算显式化，并把 provider 已知缓存条目作为 VSR loader 的最小 load-order hint：

```text
Reality Build request.asset_cache
  → schema validation + build identity
  → shared browser/Android CacheStorage provider maxBytes
  → cached asset ids as VSR loadPriority hint
  → existing VSR resolution/import/lease/residency path
```

实现仍保持 owner 边界：Build 只声明可复现的 provider policy，CacheStorage 只拥有可丢弃 payload bytes 和 manifest；VSR 继续拥有 catalog、resolution root、dependency closure、lease、working set、import 和 residency receipt。`loadPriority` 只重排 loadable batch 的顺序，不改变 VSR resolution root 或 authority state。

本地真实结果：`VSRSpatialAssetStreamer` provider-backed priority 测试通过，VSR 全套为 `122/122 PASS`（空间资产 streaming `10/10 PASS`），Reality Build 为 `147 tests / 139 pass / 0 fail / 8 skip`，目标契约为 `31/31 PASS`。源码生成的 v1/v2 Android project 均由 Gradle 9.5.1 / Android SDK 35 构建，并在 `Rcl_Aether_API35_ATD`（API 35、Android 15、`com.android.webview 124.0.6367.219`）执行：v1 进程重启阶段 `ready=39`、`importFailed=0`、`8` cache hits、最终 resident `49,524` bytes、`28` evictions；v2 revision invalidation 阶段 `ready=36`、`importFailed=0`、diagnostic 为 `VSR_BROWSER_ASSET_CACHE_REVISION_CHANGED`、最终 resident `47,496` bytes；v2 再次进程重启为 `8` hits、`46,980` resident bytes、`25` evictions。三个阶段最终 resident bytes 都在 `50,000` provider budget 内，APK 为 debug signing。

收据写入 `apps/reality-build/evidence/ANDROID_ASSET_CACHE_BUDGET_CANDIDATE_v0.1.json`，证据根为 `3b3c740846ad94c5c2ec40c84b14106f8c15b67b620f1528e1fa2295c86cac25`，source commit 为 `789f22f46987c528cd2e97f431af25bb2acc7299`。边界：该预算只约束 provider 的最终 resident bytes，不约束 VSR 内存 working set 或 APK 内嵌 payload；`https://rncs.local/` 仍是本地 synthetic origin，不是远程/TLS/WAN/authority；没有关闭 WebView quota guarantee、eviction/performance 曲线、跨进程/跨设备 coherence、物理设备、release/商店交付或人工视觉验收，也没有新增 K400 PASS。

## 本轮 Android WebView metadata batching + performance profile candidate

对上一轮预算/调度 candidate 做实现级复查后，瓶颈落在 browser provider 的 manifest 元数据写入：旧路径把每次 payload read 的 access update 串行写回 manifest，导致 CacheStorage 本身与 content-addressed provider 的时间混合了不必要的 metadata flush。可复用的最小修复仍沿用同一 provider，不复制 Android cache 或 VSR residency：

```text
Reality Build asset_cache.persist_accesses
  → shared browser provider policy + build identity
  → payload write awaits one coalesced durable manifest flush
  → optional access telemetry stays memory-only when false
  → VSR cached-id load hint + existing resolution/lease/residency path
```

实现事实：`persist_accesses` 已进入 request/schema/build identity，Reality Build 默认使用 `false`；provider inspection 暴露 `maxBytes`、`persistAccesses`、`manifestWrites`、resident bytes、hits/misses/evictions；并发 payload write 会合并 manifest flush，但仍等待持久化完成。VSR 全套为 `122/122 PASS`（spatial reality `99/99`、asset streaming `11/11`），Reality Build 为 `149 tests / 141 pass / 0 fail / 8 skip`，target contract 为 `31/31 PASS`；source-generated v1/v2 APK 均由 Gradle 9.5.1 / Android SDK 35 构建，`apksigner` 的 v2 验证通过，运行日志未见 `FATAL EXCEPTION` 或 `AndroidRuntime` failure。

在 `Rcl_Aether_API35_ATD`（Android 15/API 35、`com.android.webview 124.0.6367.219`）上，优化后同一包的四个 phase 仍保持 `ready=39/36`、`importFailed=0`：v1 clean cold resident `45,640` bytes，v1 process restart `49,524` bytes/`8` hits，v2 revision invalidation `47,496` bytes 并发出 `VSR_BROWSER_ASSET_CACHE_REVISION_CHANGED`，v2 process restart `46,980` bytes/`8` hits。provider budget 仍为 `50,000` bytes。一个真实 WebView CDP control 的 4×16 KB 并发写/读为 direct CacheStorage `772.3/799.2 ms`，provider `2,182.4/1,856.8 ms`；后者包含 SHA、rooted manifest 和 content-addressed bookkeeping，不能解释为跨设备性能结论。8/32/128 KB、各 4 payload 且请求量为预算两倍的 bounded probe 均稳定到两条 resident payload、两次 eviction；`navigator.storage.estimate()` 只观察到该 ATD profile 的 `3,736,869,273` bytes quota，`persisted=false`，不是 quota guarantee。

收据写入 `apps/reality-build/evidence/ANDROID_ASSET_CACHE_PERFORMANCE_CANDIDATE_v0.1.json`，证据根为 `741da8194219b03a89e5a8773ef62bb5d8051b4e244c98fd5280934eb893ad2c`，source commit 为 `648f4dc17b73944dc36049820f7c873d39935e94`。边界：`50,000` bytes 只约束 provider discardable bytes，不约束 VSR memory working set 或 APK embedded payload；`https://rncs.local/` 只是本地 synthetic origin；该 receipt 没有关闭 physical device、release signing、remote cache coherence、WAN/TLS transport、production SLA 或 human visual acceptance，也没有新增 K400 PASS。

## 本轮 Reality Studio UI/Input → Reality Build target lowering candidate

引擎级考古重新检查 Reality Studio 后确认：UI 与输入并不是待新造的空白子系统。apps/reality-studio/src/ui-input.mjs 已经拥有 reality-studio.ui-tree.v1.2、reality-studio.input-profile.v1.2、anchor/container layout、data binding、focus navigation、pointer routing、跨设备 action map、runtime rebind 和 InputActionRuntime；scene-studio.mjs 会在 Studio 内编译 layout、派发 UI event、采样输入并进入 Behavior step。此前 Reality Build 只把统一项目 JSON 带入 payload，目标宿主仍使用硬编码 touch buttons 和旧 Behavior input bindings，所以“Build 成功”没有证明 Studio UI/Input 真正抵达产品运行链。

本轮采用 REUSE-OVER-REBUILD：apps/reality-build/src/ui-input.mjs 只做 Build-side validation、active tree/profile 选择、目标 viewport layout 和 sealed manifest/payload；runtime-template.mjs 将同一 Studio source lowering 成 browser DOM/WebView overlay，输入仍经 InputActionRuntime 进入既有 BehaviorRuntime/authoritative state。web-release 输出独立 ui-input-runtime.js 与 ui-input.manifest.json，web-single 和 Android embedded target 使用同一 payload 的 inline lowering；没有把 UI/Input 语义塞进 World Body IR，也没有把 DOM/WebView 变成新的 canonical owner。

真实结果：source-generated fixture 的 Build validation 为 valid=true，UI tree 为 13 个 layout nodes，Build receipt 的 project_root、ui_root、input_root、manifest_root 和 lowering_root 均被保留。Reality Build 测试为 156 tests / 148 pass / 0 fail / 8 skip，VSR 全套为 122/122 PASS；Gradle 9.5.1 生成 debug APK，apksigner v2 验证为 true。Chromium 通过 accessibility tree 看到 13 个实际 DOM 节点，桌面可见 7 个；KeyD 在 reset 后让 Behavior player x=70 → 166，KeyP 让暂停面板和“已暂停”文本显示，应用控制台为 0 errors / 2 WebGPU capability warnings。Android API 35 ATD (Rcl_Aether_API35_ATD, WebView 124.0.6367.219) 通过 https://rncs.local/ 启动，WebView 为 960×540 CSS, dpr=2, maxTouchPoints=5，触摸可见 11 个节点；三个按钮均在 viewport 内，真实 adb shell input tap 366 924 产生 ui:right → move_right，player x=70 → 73.2，uiError=""。完整收据为 apps/reality-build/evidence/BUILD_UI_INPUT_TARGET_LOWERING_CANDIDATE_v0.1.json，证据根为 54148436158b990a03fd78e4ad3b754df72821188724537d517ee335ecf6390d，source commit 为 bcc7b6cda71b68d6bbbbec81462e5b09b0eb18be。

该轮关闭的是“既有 Studio UI/Input contract → Reality Build browser/embedded target lowering”的 implementation seam，并将缺口明确记录为 RCL_GAP_RNCS_BUILD_TARGET_UI_INPUT_LOWERING；它没有关闭 native GPU UI、物理 Android、无障碍/本地化、跨设备矩阵、release signing、human visual acceptance 或 external network transport。Chromium/Android 页面上的 UI overlay、CSS 响应式布局和 WebView synthetic origin 均属于 auxiliary/platform lowering；Behavior、RSR/VSR、world state、authority、candidate/promotion 和 evidence owner 不变。

## 本轮动画 target lowering 考古（candidate）

VSR/GLTF 的动画语义并不是缺失能力：`spatial-reality-3d` 已有确定性 clip sampling、animation root、layers/blends/masks、animation graph、约束、deformation、蒙皮和 morph 测试；`gltf-asset` 已从 glTF/GLB 导入 `animations`、`skins` 和 morph 数据。RAGF 的 showcase GLB 在当前源码真实产出为 9 个节点、1 个 skin、4 个 animation clips、1 个 morph target。Studio Sequencer 仍拥有 authored presentation timeline，不能因为 Build 需要一段可执行动画就复制一个新的时间轴 owner。

本轮确认了两个 implementation seam：

1. Reality Build 初始 frame、空间 Tick 更新和 WebGPU render 之前都没有传入 deterministic animation options，因此 scene 中即使已有 clip，目标也不会按空间 Tick 执行它。
2. `composeImportedSpatialScene(..., {mode: 'replace-mesh'})` 过去只替换 mesh/material/node，丢弃 imported skin、animation channel target 和关节层；这会制造“动画元数据存在但骨架不可执行”的假通过。

最小修复保持 owner 边界：Build candidate 只允许已存在 clip 的 `fixed-tick` policy，按 `phase_seconds + max(tick, 0) / tick_hz * speed` 计算 VSR time；RSR 继续拥有 authoritative state/clock；VSR 继续编译 animationRoot/frameRoot。对于含 skin/animation/morph 的 replace-mesh GLB，唯一 identity render node 映射到显式 world node，其他 imported hierarchy 作为 support nodes 保留；多 render node、缺失 render node 或非 identity deformed render transform 失败闭合。此路径没有把 policy 写入 World Body IR/RCL Core，也没有把 Build 变成动画 evaluator。

本地证据：`Reality Build` 全套为 `160 tests / 152 pass / 0 fail / 8 skip`；VSR GLTF `23/23 PASS`、spatial 3D `99/99 PASS`、typecheck `PASS`。RAGF GLB → VSR import → replace-mesh → compile probe 验证了 8 个 support nodes、1 个 skin、4 个 clips、`skinnedDraws=1`，初始与 0.5 秒 frame 均 verified，`sourceRealityRoot` 稳定而 `animationRoot` 改变。由 `冰境试炼` candidate scene 生成的 Build output 自校验有效；web-release 与 Android embedded HTML 都携带同一 policy。真实 Chromium/WebGPU reset 后 Tick 0 为 0 秒，推进 15 Tick 后为 0.25 秒，`animationRoot`/`frameRoot` 改变、两帧 `verified=true`、应用错误为 0。完整收据为 `apps/reality-build/evidence/BUILD_ANIMATION_TARGET_LOWERING_CANDIDATE_v0.1.json`，状态为 `CANDIDATE_BUILD_ANIMATION_TARGET_LOWERING_VERIFIED`。

该 fixed-clip round 的边界仍然明确：Android 本轮只证明 embedded source project/HTML 中存在 lowering，没有 APK 或 Android runtime 执行；当时 Studio animation graph/layer/Sequencer 尚未进入 Build；没有物理设备、原生 GPU、性能曲线、人工视觉验收、生产资产服务或 K400 PASS。后续 structured candidate 见下一节，缺口记录仍为 `RCL_GAP_RNCS_BUILD_ANIMATION_TARGET_LOWERING`。

## 本轮 VSR animation layer/graph target lowering 考古（candidate）

在 fixed-clip candidate 之后重新检查了两个可能的 owner。VSR `sampleSpatialAnimationLayers()` 已经拥有 override/additive、weight、node mask 和固定采样时间；`sampleSpatialAnimationGraph()` 已经拥有声明式 state、state speed/loop、node mask 和确定性 transition。`compileSpatialFrame()` 规定了 graph → layers → single clip 的选择优先级，并把选择写入 `animationRoot`。因此这里的最小共享改动是扩展既有 Build candidate policy，而不是在 Build 或 Studio 再写一个 evaluator。

Studio Sequencer 的反向考古给出相反结论：`SequencerSession`/`evaluateSequence` 仍是 authored presentation timeline owner，版本为 `1.7.0-alpha.1`；`UnifiedManufacturingSession` 会在内存中为缺少 `sequencer` 的项目生成默认 sequence，并在导出时携带 `sequence.json`，但 `冰境试炼.unified-project.json` 原始文件没有 sequence，Reality Build 也没有 sequence consumer 或播放入口。音频 clip 虽可在 Studio default sequence 中引用 `asset_id`，这还不能证明 Build target 有音频消费，因此本轮不做 Sequence/audio 胶水。

本轮新增的 candidate policy 只允许三种明确 selection：兼容旧格式的 `clip`、已有 VSR layer contract 的 `layers`、已有 VSR graph contract 的 `graph`。layers 的每项 clip、weight、blend mode、loop 和 node mask 在 candidate 层校验后映射到 VSR；graph 的 initial state、state clip、speed/loop、node mask、state id 和静态 transition 同样校验后映射到 VSR。三者都共享 `phase_seconds + max(tick, 0) / tick_hz * speed`，RSR 仍只提供 authoritative Tick，VSR 仍负责采样、frame plan 和 root。

真实结果：Reality Build 全套为 `163 tests / 155 pass / 0 fail / 8 skip`；VSR typecheck PASS、glTF `23/23 PASS`、spatial 3D `99/99 PASS`。layers 和 graph 分别生成 `verifyBuild=true` 的 web-release candidate；Chromium/WebGPU 两条独立路径均从 Tick 0→15、时间 0→0.25 秒，`animationRoot` 与 `frameRoot` 改变，两帧 `verified=true`，应用错误为 0。layers 收据为 `policyRoot=74008740d94e7832fe473e76478e099c304d364a977ac9c91a451030792d9a2b`、`runtimeEvidenceRoot=859261863e49239fccbd0362ba55a2c29b7a8ba4adce417fa3642757e20dd5f0`；graph 收据为 `policyRoot=395841bc4b28cc04d2c367fc5b05a95687392e5268a7923730bfb2de8da8c476`、`runtimeEvidenceRoot=5e765b1e767647ed32b2d0c089c51ff5630b1dd342c837fa79b1ee81b1b2aed7`。完整收据为 `apps/reality-build/evidence/BUILD_ANIMATION_GRAPH_LAYER_LOWERING_CANDIDATE_v0.1.json`，证据根为 `eb2628ff1e50bc517cc2c247995665926d0865da0b9eac4719c57261e67157b0`。

随后对同一 graph policy 做了真实 Android target audit：Gradle 9.5.1 / Android SDK 35 生成的 debug APK 由 Windows apksigner 验签后安装到 `Rcl_Aether_API35_ATD`，`MainActivity` 的 WebView 以 `https://rncs.local/` synthetic origin 完成加载。通过 adb forward 的 WebView CDP 在同一同步调用中读取 Tick 0 的 `run` state、`walk → run` transition `0.25`，推进 15 个 tick 到 `0.25` 秒；`animationRoot`、`frameRoot` 改变，draw count 为 5，前后 frame 均 `verified=true`，spatial/asset error 为空。该 receipt 关闭的是 Android Emulator/WebView 的 graph target-lowering execution seam，不是物理设备或原生 GPU：`navigator.gpu` capability probe 可见，但 primary GPU 报告 `WebGPU adapter unavailable`，`spatial3dReceipt` 为空，未观察到 native submission。完整收据为 `apps/reality-build/evidence/ANDROID_ANIMATION_GRAPH_TARGET_LOWERING_CANDIDATE_v0.1.json`，证据根为 `e7c82e7195fc9f879d3cf7413ab7937a1e52ba3cf4d84673fdea7b5d7b321a37`。

这只关闭了“既有 VSR layers/graph 能否沿 Reality Build fixed-Tick seam 执行”以及“该 graph seam 能否在 Android Emulator/WebView target 上执行”的 candidate seam；没有关闭 Studio authored Sequence lowering、事件驱动 state machine、constraint/full deformation policy、音频 target、物理设备/原生 GPU、性能曲线、人工视觉验收或 K400 PASS。缺口仍为 `RCL_GAP_RNCS_BUILD_ANIMATION_TARGET_LOWERING`，但其子缺口已经从 flat clip seam 扩展为可验证的 VSR structured selection seam；Android APK/runtime 的 emulator 子路径已有独立 receipt，不能外推为设备/发布能力。

## 本轮 authored Sequence target lowering 考古（canonical owner decision required）

Reality Studio 当前源码真实拥有 `reality-studio.sequence.v1.7`、`SequencerSession` 和 `evaluateSequence()`。四条 focused sequencer tests 全部通过；对 `冰境试炼.unified-project.json` 运行 `createDefaultSequence()` 得到稳定的 `sequence_root`，`evaluateSequence(0)` 与 `evaluateSequence(.25)` 的 `authority_root` 保持一致而 `presentation_root/frame_root` 改变。这证明 Studio/Node 的 authored timeline 与 authority/presentation 分离是可执行 donor，不是缺失实现。

反向检查 Reality Build 的真实 seam：`presentationSpec()` 只读取 scene、bindings、asset bundle、asset bindings、animation policy 和 source root；Build 没有 Sequence consumer、播放入口或浏览器 Sequence runtime。原始 `冰境试炼.unified-project.json` 没有 `sequencer` 字段，Studio session 只在内存中 materialize default sequence，且该 fixture 的 animation/audio clip 数量为 0。现有 `animation_policy` 也没有 3D VSR clip/node/mask/weight 的 Sequence binding contract。

随后当前源码已经沿着最小 candidate 路径补齐了 camera cut，而没有建立第二个 timeline evaluator：`createSpatialSequenceFrameProjection()` 要求显式 `track_id + clip_id + camera_id` binding，`Reality Build` 只把已存在的 camera 降低为 VSR `activeCameraId`，并在 scene/frame root 上做校验。`apps/reality-build/evidence/BUILD_SEQUENCE_CAMERA_FRAME_PROJECTION_CANDIDATE_v0.1.json` 封存了 camera + animation evaluated-frame candidate 与真实 Chromium/WebGPU 收据；本轮完整 Build 回归为 `172 tests / 164 pass / 0 fail / 8 skipped`，camera binding 专测通过。这个 candidate 只选择已有 VSR camera，不处理 camera transform/lens keyframe 插值，也不等于 target-side Sequence playback。

因此仍不能把 Studio payload 猜成 VSR animation/camera layer，不能静默映射 audio/dialogue/effect/light/behavior track，也不能从 camera candidate 推出通用 Sequence runtime。旧的 `apps/reality-build/evidence/BUILD_SEQUENCE_TARGET_LOWERING_AUDIT_v0.1.json` 与 animation-only `apps/reality-build/evidence/BUILD_SEQUENCE_FRAME_PROJECTION_CANDIDATE_v0.1.json` 是各自 source commit 时点的负证据；当前总缺口仍为 `RCL_GAP_RNCS_SHARED_AUTHORED_PRESENTATION_SPINE`。下一步必须先裁决：Studio 输出 sealed evaluated Sequence frame 供 Build 做最小 target projection，还是抽取 shared target-side Sequence runtime 并定义各 target 的 track capability matrix；这是 authored-presentation/target-runtime canonical owner 决策，不是单纯的接口缺失。

## 本轮 authority → temporal presentation 共享脊柱复核

与 authored Sequence 不同，RSR/VSR 的“权威状态到时间呈现”接缝已经存在且是可执行的共享基础设施：VSR `temporal-presentation.v0.6` 将 `rsr.authoritative-state-frame.v0.7` 转成带 `sourceStateRoot` / `sourcePacketRoot` 的 sealed temporal packet；`TemporalPresentationBuffer` 只在呈现层执行 bounded hold、Hermite interpolation、bounded extrapolation、discontinuity snap 与 none/blend/snap correction。Reality Engine Session 的 spatial path 再用 `rncs.authority-presentation-binding.v0.1` 把 RSR authority frame、VSR temporal packet、frame plan 和 session candidate/commit roots 绑定起来，并在 commit 时从权威基线重算后比较 roots。专门回归结果为 VSR Temporal `11/11 PASS`、Reality Engine Session `14/14 PASS`，收据见 `docs/verification/RNCS_AUTHORITY_PRESENTATION_SESSION_LOCAL_EVIDENCE_v0.1.json`。

这条脊柱可以作为未来 authored presentation lowering 的下游承载层，但不能反向成为 authored Sequence owner：它现在承载的是 authoritative spatial object state 与 temporal correction，不拥有 Studio 的 camera、animation、audio、dialogue、effect、light、behavior track，也没有 Experience Fabric ingress。因而本轮只确认“authority → presentation”共享 donor 已经稳定，不新增 Sequence adapter，不把 temporal interpolation 误写成网络/设备/渲染产品能力；`RCL_GAP_RNCS_SHARED_AUTHORED_PRESENTATION_SPINE` 仍集中在 authored ingress 与 target capability policy。

## 本轮 World Body event delivery spine 复核

World Body IR 也已经拥有一个可复用的事件投递层，而不是每个 target 各写一套回调：`createWorldBodyEventDeliveryPlan()` 从已验证 IR 生成带 `sourceWorldBodyRoot`、tick、sequence、consumer、target 和 exactly-once `deliveryKey` 的确定性计划；`WorldBodyEventRuntime` 对 provider 缺失、拒绝、异常、重试和 duplicate suppression 分别出具 receipt。最小 IR 明确同时存在 `animation:hero-land` 与 `audio:hero-contact` 两条 route；独立 `@taowind/world-body-ir` 回归为 `40/40 PASS`，收据见 `docs/verification/WORLD_BODY_EVENT_DELIVERY_LOCAL_EVIDENCE_v0.1.json`。

Reality Build 已把该计划写入 candidate presentation、runtime payload 和浏览器 `dispatchWorldBodyEventTick()`；当前完整 Build 回归为 `172 tests / 164 pass / 0 fail / 8 skipped`。但浏览器 provider map 默认为空，`animation` / `audio` 只有在显式 provider admission 后才会从 `blocked-provider` 变为 `delivered`。因此这关闭的是“World Body authority event → bounded provider delivery receipt”的共享 execution seam，不是 `animation route → VSR graph/layer`、`audio route → sealed target asset plan` 或 Sequence event playback。不能按 route target 字符串推断 clip、asset 或 provider；该 provider binding 仍属于 `RCL_GAP_RNCS_SHARED_AUTHORED_PRESENTATION_SPINE` 的 canonical-owner 决策。

本轮继续沿既有 seam 做了 Behavior/World Body provider admission 反向考古。Behavior Fabric 的 `experience.audio.emit` / `experience.effect.emit` 已有 authority decision、command log、snapshot/replay root 和 provider 入口；Build `createRuntime()` 已将它们分别接到既有 `audioCue()` 与 `burst()`。World Body Event Runtime 则独立拥有 verified IR admission、delivery plan、retry 和 duplicate suppression。两者都是真实可复用 donor：`@taowind/world-body-ir` `40/40 PASS`，`@taowind/reality-behavior-fabric` `81/81 PASS`。

但当前没有把 World Body route 的 `consumer + target` 映射到 target provider 的 sealed contract。最小 IR 中的 `audio:hero-contact` 不是现有音频计划示例的 `cue_id=footstep-ice`，而且没有声明一条可验证的映射；`animation:hero-land` 也没有对应的 VSR clip/layer/graph 或 Sequence frame provider。浏览器 provider map 继续默认为空，只通过显式 `setWorldBodyEventProvider()` admission；因此本轮不添加字符串推断或平行 adapter。收据见 `docs/verification/RNCS_WORLD_BODY_PROVIDER_ADMISSION_AUDIT_v0.1.json`，当前缺口仍是 `RCL_GAP_RNCS_SHARED_AUTHORED_PRESENTATION_SPINE`，下一步必须先裁决 authored presentation ingress 与 route-to-provider binding owner。

## 本轮音频 target lowering 考古（负证据）

本轮先对真实源项目做了 audio execution audit，没有立即建立第二套音频系统。Reality Studio/资产记录已有 `sfx-wav` role 与 content hash；Experience Fabric 已有 deterministic audio cue/voice plan 和 oscillator/sample/offline WAV renderer；Spatial Embodiment 已有带 cue、position、gain、pitch、distance、occlusion 的 `spatial-audio` event。它们的语义 owner 各自存在，但当前 Build target 没有把这些语义共同接到文件资产与宿主 audio consumer。

源码生成的 `冰境试炼` web-release build `output/playwright/audio-source-audit-v02` 自校验有效；`asset-manifest` 中真实 WAV 为 `ba8ebd46...e.wav`、19888 bytes，目标目录文件存在。另一方面，`assetRuntimeMap()` 只把每个 asset 的 `primary_visual` 带进 runtime payload，Behavior 的 `experience.audio.emit` cue 没有 `asset_id`/file-role 绑定，`runtime-template.mjs` 的 provider 只按 cue 字符串生成 oscillator；`syncSpatialRuntime()` 只保留 RSR events，不消费 `spatial-audio`。

修复一个独立的旧版 Canvas HUD `fillText` 坐标回归并增加 runtime regression test 后，真实 Chromium 页面达到 `readyState=complete`、`0` application errors。instrumented Behavior step 进入并启动 procedural oscillator；强制 2D 接触真实产生 `spatial-audio / impact.generic`，RSR snapshot 仍 `verified=true`；整次运行没有 WAV request、`decodeAudioData` 或 target audio receipt。该 probe 是 execution-path evidence，不是 native audio、Android audio、latency、mixing、production mastering 或 human listening proof。

完整收据为 `apps/reality-build/evidence/BUILD_AUDIO_TARGET_LOWERING_AUDIT_v0.1.json`，状态 `AUDIT_AUDIO_TARGET_LOWERING_GAP_CONFIRMED` / `CANDIDATE_NEGATIVE_EVIDENCE_ONLY`，缺口为 `RCL_GAP_RNCS_AUDIO_TARGET_LOWERING`。Donor 与最小吸收边界是：保持 Studio/Experience Fabric/RSR 的语义 owner，复用 Build content-addressed asset records；在 canonical cue-to-asset owner、receipt shape 和 missing/fallback policy 未裁决前，不添加 cue-to-file 胶水，不把打包文件描述成已播放，也不宣布 K400 PASS。

## 音频 target lowering 后续候选（Chromium + Android WebView）

后续考古确认了 owner，而不是建立第二套音频系统：Reality Studio 的显式 `rncs.audio-target-profile.v0.1` 继续拥有 `cue_id → asset_id → file_role → asset_sha256` binding；RSR / Experience Fabric 继续拥有 cue identity、fixed-tick timing、spatial listener/position/gain/pitch/distance/occlusion 与离线 voice/bus 语义；VSR 继续拥有通用 content-addressed asset catalog、SHA 校验、bounded loading、ready/lease/evict receipt；Reality Build 只把 bound `kind: audio` bytes lower 到现有 Web Audio Provider。

`0cfee2d` 没有增加 authored audio schema，也没有复制 Experience Fabric 的 `maxVoices`、cue `maxInstances`/cooldown 或 bus graph。Build 复用既有 `VSRSpatialAssetStreamer` 形成临时 audio catalog，先取得 VSR receipt root，再交给 `decodeAudioData`；reset 会停止 active source 并释放/驱逐本轮 audio lease。`100c4d4` 的本地 Chromium 收据观察到 exact WAV `200`、VSR `ready=1`、19888 resident bytes、`failed=0`、`blocked=0`、decode `1/1`、page errors `0`；`ef910be` 对同一显式 profile 的 Gradle 9.5.1 / SDK 35 debug APK 在 API 35 Android Emulator/WebView 中观察到相同 `binding_count=1`、VSR receipt-root continuity、decode `1/1` 与 `Runtime.exceptionThrown=0`。

这关闭的是“显式 target binding → 既有 VSR asset residency → Web Audio decode”的 browser/embedded-WebView candidate seam，不是 native audio、扬声器输出、物理设备、跨设备 latency、混音质量或人工听感。`RCL_GAP_RNCS_AUDIO_TARGET_LOWERING` 仍开放；target-side voice cap、mixer/bus lowering、cache budget、连续/分段 streaming 仍需 canonical owner 和单独证据。完整收据为 `apps/reality-build/evidence/BUILD_AUDIO_VSR_ASSET_STREAMING_CANDIDATE_v0.1.json` 与 `apps/reality-build/evidence/ANDROID_AUDIO_VSR_ASSET_STREAMING_CANDIDATE_v0.1.json`。

`15f61b9` 继续复用 VSR 已有的 `createVSRBrowserAssetCache()`，没有新增音频 cache schema：audio plan root 作为 revision root，既有 `asset_cache.max_bytes` / `persist_accesses` policy 继续生效，VSR streamer 先从 CacheStorage 取 bytes，再进入 SHA 校验和 Web Audio decode。真实 Chromium 清空缓存后的序列为 miss/write `1/1` → 同运行时 hit `1` → cold reload hit `1`/miss `0`，且没有第二次 WAV request；API 35 Android WebView 在清理临时包数据后得到同样的 miss → cold-reload hit，VSR `ready=1`、19888 resident bytes、decode `1/1`、`failed=0`、`blocked=0`、`Runtime.exceptionThrown=0`，asset receipt root 保持一致。强行在 pending decode 期间 reset 产生的生命周期竞态不计入 cache verdict；完整收据为 `apps/reality-build/evidence/BUILD_AUDIO_VSR_CACHE_CANDIDATE_v0.1.json` 与 `apps/reality-build/evidence/ANDROID_AUDIO_VSR_CACHE_CANDIDATE_v0.1.json`。这只关闭了 target cache reuse candidate，不宣称 Android quota、目标设备性能、continuous streaming、native audio 或人工听感。

## 本轮 Experience Fabric / authored presentation owner 复核

远端分支复核没有发现一条已经把 Experience Fabric 音频策略接入 Unified Project/Reality Build 的更新实现；当前工作树仍是事实来源。`npm.cmd run test:experience-fabric --workspace @taowind/reality-simulation-runtime` 真实完成 `35/35 PASS`，独立收据见 `docs/verification/RSR_EXPERIENCE_FABRIC_LOCAL_EVIDENCE_v0.1.json`。这确认它不是“等待补写的接口”：`packages/world/reality-simulation-runtime/packages/experience-fabric/src/index.ts` 已拥有 fixed-tick cue admission、`maxInstances`、`cooldownTicks`、snapshot `audioPlanRoot`、确定性 replay、voice/spatial fields 与 bus declarations；`experience-fabric-audio` 还拥有离线 voice budget、priority、bus gain/low-pass/delay 与 WAV renderer。`audio-scene-runtime` 则是另一类离线制作/混音 donor，拥有 stem、bus、dialogue ducking、loudness/export，不应静默成为 gameplay cue owner。

这次重跑还确认了一个工程接缝：`@taowind/reality-simulation-runtime` 的 `exports` 与 `src/unified-index.mjs` 都没有公开 Experience Fabric、audio 或 VSR bridge 子路径。它因此是“内部源码可编译、可测试的 RSR donor”，还不是 Studio / Build 可依赖的稳定共享 runtime；单纯补一个 export 也不能替代 ingress、target lowering 与播放回执。

当前 ingress 仍然分裂但边界清楚：Reality Studio 的 `rncs.audio-target-profile.v0.1` 只拥有显式 `cue_id → asset_id → file_role → asset_sha256` 绑定；Studio `reality-studio.sequence.v1.7` 虽有 audio track，却没有进入 Build 的播放/投影契约；Reality Build 只接收 explicit audio target plan、既有 VSR asset residency/cache、Web Audio decode/schedule 和 RSR spatial context，既没有 Experience Fabric config/snapshot/audioPlanRoot ingress，也没有 `maxVoices`、cue concurrency、cooldown、bus graph 或 continuous/segmented stream lowering。故而不能把 Experience Fabric policy 字段拷进 Build，也不能按 sequence cue 名或第一个音频文件推断来源。

该负证据与 owner matrix 固化在 `apps/reality-build/evidence/BUILD_AUDIO_POLICY_OWNER_AUDIT_v0.1.json`；本轮 RSR 证据把同一缺口的共享 runtime donor 边界补齐。它把大缺口归入 `RCL_GAP_RNCS_SHARED_AUTHORED_PRESENTATION_SPINE`，把可执行的音频子缺口保留为 `RCL_GAP_RNCS_AUDIO_TARGET_LOWERING`；当前需要人类裁决的是：采用 Studio sealed evaluated frame → Build projection，还是建立 shared target-side Sequence/Experience runtime，并明确 voice/bus policy 的投影 owner。没有这个裁决，本轮不新增 schema 或胶水。

## 本轮 DML Remote Link 控制面资产复核

`packages/host/dml-remote-link` 已在当前提交树中存在，只是未被本工作树的 sparse checkout 物化。临时物化并重跑当前工作树测试得到 `6 tests / 6 pass / 0 fail / 0 skip`；证据见 `docs/verification/RNCS_DML_REMOTE_LINK_LOCAL_EVIDENCE_v0.1.json`。它已经真实执行一次性浏览器设备注册、短期 Grant、Relay 队列、签名 Host、DML Core 和 Projection 闭环，并验证 nonce 重放拒绝与 Host Policy 负例。

这关闭的是控制面安全与本机回执 donor 的考古缺口，不是 RNCS external world transport。DML Remote Link 的 owner 仍是 DML action/Workbench projection；它不拥有 URRF packet、RSR/VSR world state、复制 authority 或外部 carrier。可复用的是 device-bound Grant、Origin/Scope/Risk、签名/nonce、receipt root 和 local policy seam；不可复用为 RNCS world transport 的是 DML queue/projection schema。Loopback、单节点 JSON、Cloudflare 配置模板、无第二网络/物理设备的边界保持不变。

## 本轮 URRF semantic transport verification cache/performance candidate

对现有 URRF semantic transport → Loopback carrier seam 做了执行级 profiling 后，限制性成本不是 RSR world step，而是每个 packet 重复 clone、canonical hash 和 profile/packet contract verification。最小共享修复放在真正的 owner 上：RNCS Core Contract 对 canonical transport profile/constructed packet 做 deep-freeze，并缓存 immutable verification result；URRF `RealityTransportFabric` 复用已经登记的 sealed profile reference。外部输入、clone 或 tampered packet 仍走完整验证路径，没有放宽 admission。

本轮真实回归为：Core Contract `49/49 PASS`，URRF `21/21 PASS`，Network Runtime `31/31 PASS`，两个 transport source `node --check PASS`，formal benchmark `PASS`。同一工作树、Node v24.15.0、Windows x64、3000 个 Loopback input packets（50 clients × 60 ticks）的单次本地比较为 `1024.111 ms → 578.505 ms`，约 `43.51%` 降低；final state root 仍为 `fnv1a64:59c41f121ea346e5`。formal report 同时记录 2-player/60-tick `23.16 ticks/s`、50-player queue `4328.13 packets/s` 与 loss convergence `2 ticks`。完整收据见 `docs/verification/RNCS_TRANSPORT_PROFILE_IMMUTABILITY_PERFORMANCE_CANDIDATE_v0.1.json`。

这只关闭了 semantic carrier 的本地验证成本候选，不是 external provider 的实现。当前仍没有 WebSocket/WebTransport/QUIC/UDP/TLS/WAN、跨节点 authority/failover、key custody、物理设备或 production SLA 证据；不得把 Loopback benchmark 或 immutable cache 晋升为 K400 `PERFORMANCE`/`EVIDENCE` PASS。canonical external protocol、donor license、TLS/key custody、relay/leader/lease/failover owner 仍需人类裁决后才能进入下一轮 provider 实现。

## 结构判断

### 限制性瓶颈

本轮已把“provider 内部逐次 manifest 写入”收束为一个可复现的 API 35 WebView metadata/performance candidate：`persist_accesses=false`、coalesced manifest flush、显式 provider inspection 和 8/32/128 KB bounded probes 均有真实执行记录；这只关闭了当前 lowering 的一个实现瓶颈，不等于 quota guarantee、目标设备性能曲线或 remote coherence。

当前有两个有先后关系的瓶颈：`RCL_GAP_RNCS_RELEASE_3D_BROWSER_SCRIPT_PACKAGING` 已完成一个本地候选修复并通过 Build target 的真实浏览器回归；`RCL_GAP_RNCS_TARGET_PAYLOAD_IMPORT_BINDING` 已完成 web-release candidate loading/hash verification、显式 mesh binding、本机 Chromium WebGPU submission、host debug APK build/signing、Android Emulator embedded WebView dynamic working-set candidate、通用 VSR residency transition receipt、reset→cell transition→eviction→re-entry 的动态浏览器/Android candidate、Chromium CacheStorage 的 cold rehydrate/revision invalidation candidate、Android WebView synthetic-origin CacheStorage candidate 以及 50 KB provider budget/load-scheduling candidate，但物理/目标设备 GPU、Large World 新 chunk/scene revision、Android quota/eviction/performance 和生产资产服务仍未验证。Reality Studio network compilation 现在已进入 Reality Build headless 的本地 loopback/HTTP authority candidate，Network Runtime 已有 JSON→独立 Node 的 session checkpoint、共享 durable-store candidate、URRF semantic transport→Loopback carrier binding candidate 和 shared Node asset-cache provider candidate，但 WAN/跨节点 physical transport、实际断电/跨节点 crash recovery、真实多设备和生产部署仍未验证。结构性瓶颈仍是 `RCL_GAP_RNCS_SHARED_WORLD_COMPILATION_SPINE`，其 Studio ingress、Aether runtime projection、shared mass/character/asset-instance/compound-fixture donor、Network Observer Relevance binding、World Body/Large World Build candidate consumer、VSR asset resolution/import/binding/residency、browser/Android cache lowerings、network compilation→headless candidate、HTTP authority、session checkpoint、durable-store、semantic transport binding 和 Node asset-cache seam 已有证据，但完整 external provider、quota/performance、跨节点 durable authority、Android 物理/原生平台层、默认 Studio/World Body/Large World/Build 生产链仍未共同进入同一 runtime seam。

这不是“再写一个引擎子系统”的缺口，而是已有子系统不能共同承载同一个世界工件的缺口。Android host APK 现在已有候选构建闭环，剩余问题是平台宿主和设备证据，不应复制 Reality Cell/streaming/render glue。应把 Aether bridge 作为下游 runtime donor；若直接在 Studio、Build、Large World 各自添加转换，会产生重复语义、root 混淆和无法回滚的并行系统。

### 必须保持的不变量

1. World Body IR/codegen 继续是世界身体语义与候选 specialization 的 owner，不把 Studio UI 或 Build target 语义塞进 IR core。
2. Studio Unified Project 是 authoring owner；Studio/Build 现有手写/直接 RSR/VSR 路径继续是 fallback，不能被候选 codegen 静默替换。
3. `project_root`、`spatial_workspace_root`、`source_world_root`、`worldBodyRoot`、`stateRoot`、`frameRoot` 和 `compilation_root` 必须各自保留，不能用一个 hash 代替全部语义。
4. adapter 只能生成 candidate bundle、差分结果和 evidence；不得获得 RNCS/RFE commit、release promotion 或外部设备授权。
5. 未执行的浏览器 GPU、外部物理、真实网络、生产资产 Provider 和目标硬件继续标记 `UNVERIFIED`。

## 下一最小高杠杆候选

固定 clip、VSR layers、VSR graph 以及 Studio evaluated Sequence 的 animation/camera explicit binding 已完成 candidate 验证并分别封存；它们不再是“Build 完全没有既有 VSR 动画/镜头执行接缝”的未实现项，但 authored Sequence 的其余 track classes、camera transform/lens semantics、事件驱动 transition 与 target-side playback 仍未闭合，不应从 fixed-tick 证据外推。音频显式 target binding 已经通过既有 VSR asset residency 接缝完成 Chromium 与 Android WebView candidate；这不等于 voice/mixer/continuous-stream policy 已实现。

第一优先的 Build 3D classic-script packaging 已完成局部候选修复和真实浏览器回归；Studio→World Body→Aether 已完成候选 ingress、显式 asset-instance/observer binding runtime projection 和 shared mass/character/compound-fixture donor，Build 也能通过显式 request candidate 绑定同一 World Body source root；Large World VSR scene 现在也能通过 generic candidate 进入 Build evidence，复用 VSR asset streaming、GLB import、mesh binding、通用 residency transition、本机 WebGPU receipt、host APK build/signing 和 Emulator WebView candidate；动态 reset/cell transition 已在 web-release Chromium 与 embedded Android Emulator candidate 中执行；Browser CacheStorage provider 已在真实 Chromium 中完成首次写入、cold reload 命中和 payload revision invalidation，Android WebView synthetic-origin lowering 已完成 revision invalidation、进程重启 rehydrate、预算/load scheduling 以及 `persist_accesses=false` metadata batching/performance candidate，音频 target 也已复用同一 VSR browser cache contract 完成 clean-launch miss → cold-reload hit 的 Chromium/Android WebView candidate；Studio network compilation 已进入 Build headless 的本地 loopback/HTTP authority candidate，Network Runtime 已具备 JSON checkpoint→独立 Node 恢复、共享 Node-only durable-store candidate、URRF semantic transport→Loopback carrier binding candidate，Reality Cell cache mechanism 也已抽为共享 Node asset-cache provider。音频 target lowering 已经被证明是独立的 `RCL_GAP_RNCS_AUDIO_TARGET_LOWERING`，但 raw `冰境试炼` project 仍需显式、sealed cue-to-asset profile；不得从 cue 名或第一个音频文件推断 mapping。当前已验证的是 binding、VSR residency、browser/Android cache reuse 和 Web Audio scheduling，voice cap、mixer/bus、continuous/segmented stream、native/physical audio 仍未闭合。下一阶段最高杠杆缺口应转向两条有明确边界的候选：其一，在既有 URRF semantic seam 之上，由人类先裁决 canonical external protocol、donor license、TLS/key custody、relay/leader/lease/failover authority，再执行 WAN/TLS/重连/跨节点 durable authority；其二，在同一 cache contract 下获得 physical/reproducible target 的 Android quota/eviction/performance receipt。不能复制 Reality Cell/streaming/render glue，只做：

```text
Unified Project + selected spatial world + scene/asset roots
  → candidate scene/asset manifest with explicit source roots
  → existing Build Asset Database / RAGF content-addressed payloads
  → shared web/embedded target asset loader
  → Android WebView synthetic-origin cache/asset receipt
  → bounded quota/eviction/performance evidence
```

第一轮 ingress 已以 `examples/studio-authored-network-world-v03/project.mjs` 为 fixture 验证：确定性 World Declaration/codegen、Studio roots 与 World Body roots 的显式绑定、Network compilation root 保持、模型 kind lowering、2D transform 不越权、篡改/缺失资产/非法 authority 负例闭合；第二轮验证有损 candidate bundle 能进入 Aether Cell 并保持各级 runtime roots；第三轮验证 Build request candidate 能将同一 source root 写入 runtime evidence 并通过 Build 自校验；第四轮把动态质量经 shared `mass_q` donor 传入 RSR；第五轮把 3 个 Studio character facets 经 shared `spatial.character` donor 传入 RSR；第六轮把完整 fixture 集合经 `spatial.fixtures.items` 传入 RSR/VSR；第七轮把 Large World VSR scene 经 generic Build candidate 接缝执行；第八轮复用 VSR `resolveSpatialAssetStreaming()`，让 4 个 active-cell `rncs://` asset records 进入 frame/evidence roots（requested=4、missing=0）；第九轮复用 Large World GLB provider bundle、Build content-addressed target packaging 和 VSR streamer，完成 36 条 candidate payload catalog、33 条 active request 的 Chromium 字节加载/哈希校验；第十轮复用共享 VSR GLB importer/composer，完成 11 条显式 mesh bindings 和本机 WebGPU draw receipt；第十一轮完成 host APK build/signing；第十二轮在 Emulator WebView 中完成 cold-start、payload/binding/frame root 和 Canvas2D fallback candidate；第十三轮把 lease release/over-budget eviction 抽为 VSR transition receipt，并让 Aether/Build 复用；第十四轮把 Reality Build reset/cell transition/re-entry 接到同一 VSR working-set、residency、rebind 和 frame receipt；第十五轮将既有 Studio network compilation 接入 Reality Build headless candidate，并用实际生成 server 走一次双 slot local loopback session；第十六轮把 `HttpAuthorityClient` 接到同一 generated headless server，真实执行 compiled-slot join、独立 packet、ack convergence、health/metrics 和三类 HTTP authority 负例；第十七轮复用 RSR `fromSnapshot()`、AAF delegation、Network receipts 和 authority history，完成 `network.session-checkpoint.v0.1` 的 JSON 封存与独立 Node 恢复 candidate；第十八轮将 Large World 的原子文件 donor 抽为共享 `@taowind/rncs-durable-store`，并由 Network 与 Large World 各自执行语义验证和 candidate receipt；第十九轮把该 store 接入真实生成 headless server 的 checkpoint/recover endpoints，并跨两个独立 Node server 进程执行 authority resume。下一阶段改为审计 external transport/session 的 WAN/TLS/重连/跨节点持久会话边界，与 Android WebView/物理或可复现 GPU-capable target host 是否保留同一 world/target manifest、payload/binding/frame roots、cache eviction 和性能边界；音频 target 只保留为已验证的资产驻留 candidate，后续 voice/mixer/stream policy 必须先有 canonical owner；任何晋升为默认产品路径的动作仍需独立 authority/设备证据。

## 本轮 RSR bounded heightfield candidate

继续考古 Large World Runtime 后，确认其 `terrainHeight(seed, sampleX, sampleZ)` 与 `gridMesh(seed, x, z, sampleResolution)` 仍是地形采样和可视网格的唯一既有 owner；本轮没有复制生成器，也没有把 Large World 的 terrain scene 静默变成 RSR authority。原先的“已选 chunk/固定点高度样本 → RSR 物理 terrain fixture” seam 已以独立 integration candidate 接通；既有 `observe()` 的 load/unload hysteresis 也新增了可独立验证的 source stream transition root，但完整查询语义和生产证据仍未闭合。

本轮在 RSR Spatial Embodiment 增加了 bounded `heightfield` candidate：

```text
Large World terrain owner
  → verified active stream resolution
  → rooted source stream transition (entered / retained / released / budget-evicted)
  → integration candidate sidecar / Kernel state batch
  → explicit fixed-point height samples
  → RSR static or fixed-rotation kinematic heightfield
  → bounded support contact + character snap/footstep height
  → deterministic replay roots
  → VSR triangle-mesh projection / frame receipt
```

实现保持在 Large World/RSR/Kernel/VSR 各自 owner 内：Large World 继续拥有 active-set policy，并由 `rncs.large-world-stream-transition.v0.1` root 封存 previous/current active set、released chunk 与 budget eviction；Kernel 只做受限 schema lowering，RSR 只接受整数毫米样本并拒绝 dynamic、旋转和超限网格，VSR 只投影三角网格；没有新增第二个 terrain generator。当前碰撞仍以单 support-point/AABB penetration test 为基础，本轮叠加最多四个 shape-aware support points，共享 manifold identity 但不是完整接触流形；同时新增 bounded terrain-surface ray query、sphere-vs-authored-triangle sweep，以及仅面向 upright capsule 的 bounded capsule-vs-triangle sweep；动态 terrain 与连续 manifold 仍未闭合。

本地真实证据：Spatial Embodiment `76/76 PASS`，Reality Simulation Runtime 全量 `210/210 PASS`，并执行 flat settle/replay、slope normal、bounded vertical/diagonal terrain ray、bounded authored-triangle sphere sweep、bounded upright-capsule-vs-triangle sweep、bounded four-point contact manifold、root-bound heightfield sample patch、Kernel lowering、admission negative cases、footstep support height、VSR mesh/frame projection，以及 managed static body residency transition。旧的 heightfield evidence 仍保留其历史 `69/69` 与 `203/203` roots；新的 surface-ray evidence 位于 `docs/verification/RNCS_RSR_HEIGHTFIELD_RAY_QUERY_CANDIDATE_v0.1.json`，历史 shape-probe evidence 位于 `docs/verification/RNCS_RSR_HEIGHTFIELD_SHAPE_PROBE_CANDIDATE_v0.1.json`，sphere-sweep evidence 位于 `docs/verification/RNCS_RSR_HEIGHTFIELD_SPHERE_SWEEP_CANDIDATE_v0.1.json`，capsule-sweep evidence 位于 `docs/verification/RNCS_RSR_HEIGHTFIELD_CAPSULE_SWEEP_CANDIDATE_v0.1.json`，contact-manifold evidence 位于 `docs/verification/RNCS_RSR_HEIGHTFIELD_CONTACT_MANIFOLD_CANDIDATE_v0.1.json`，heightfield mutation evidence 位于 `docs/verification/RNCS_RSR_HEIGHTFIELD_MUTATION_CANDIDATE_v0.1.json`；这些都是本地 candidate execution roots，不是目标设备、外部物理或生产发布证明。

### 本轮 RSR bounded heightfield mutation candidate

考古没有发现 RCL、Kernel 或 Large World 已有的一等、可执行 heightfield deform command；已有 `replaceManagedStaticBodies(...)` 只能整块替换受管理静态体，并不适合把同一 terrain body 的局部变化作为可重放世界事件。因此局部 mutation 的执行语义仍由 RSR Spatial Embodiment owner 持有；RCL native control plan 与独立 lowering bridge 只提供显式候选入口，并继续登记为 `RCL_GAP_RNCS_TERRAIN_MUTATION_COMMAND_SEMANTICS`：

```text
tick-local patch command
  → expected heightfield root check
  → bounded ordered integer sample validation
  → in-place RSR authored surface mutation
  → affected contact/cache invalidation
  → mutation root + snapshot/replay/causal evidence
```

`patch-heightfield` 只接受静态或固定旋转运动学 heightfield，最多 4096 个样本；索引越界、重复、非安全整数、stale root 和 no-op 都在写入前拒绝。mutation event 保存前后 heightfield roots 与已变更样本，受影响 contact IDs 从 lifecycle/cache 中移除，下一次求解重新生成接触；RSR 自身的 runtime command/replay 路径已执行，`rsr-spatial-heightfield-mutation.v0.1` schema 也已登记。该路径仍不是 dynamic-body terrain、Large World deform stream、连续三角形 manifold、一等 RCL/Kernel command primitive 或 canonical commit/promotion。


## 本轮 RCL native spatial command plan → RSR/VSR candidate lowering

本轮沿 RCL → Kernel → 控制面 → RSR 的真实执行链继续考古：RCL native self-host compiler 已能稳定执行 `Sequence`，但没有一等 typed spatial command；`rncs-core` 的 world mutation 只接受通用 `set/delete`，EntityKernel 也没有 spatial command batch；RSR 才拥有可执行的 `SpatialCommand` 与 `patch-heightfield`。因此没有把局部 terrain mutation 伪装成现有通用 world-state change，而是把缺口收窄为一个显式的 RCL declaration → RSR candidate lowering seam：

```text
RCL native self-host `rncs.spatial.command.<alias>.*` facets
  → `rncs.rcl-spatial-command-plan.v0.1` + RCL native state root
  → `rncs.rcl-rsr-spatial-lowering.v0.1`
  → existing `rncs.spatial-command-plan.v0.1` / RSR SpatialCommand
  → existing RSR candidate simulation + VSR frame projection
  → existing spatial replay bundle
```

RCL control plane 负责声明值、样本向量、command type、tick、body/fixture identity 和 source plan root 的校验，并要求 `rncs.rsr.simulate` authority requirement；`rcl-rsr-spatial-bridge` 只验证 source command plan root、RCL native state root、target command root 和 candidate-only boundary，然后复用既有 `createSpatialRealityEngineSession()`，不复制 RSR 求解器。RSR 继续拥有 mutation event、接触缓存失效、snapshot/replay 与 causal delta；VSR 继续拥有 frame projection。

本轮证据位于 `docs/verification/RNCS_RCL_PHYSICAL_COMMAND_PROFILE_KERNEL_BATCH_CANDIDATE_v0.1.json`：RCL control plane `18/18 PASS`、rncs-core `50/50 PASS`、bridge `3/3 PASS`、Reality Engine Session `14/14 PASS`、RSR `210/210 PASS`；`patch-heightfield` 与 `set-velocity` 两条 source 均经 native execution、profile/batch/lowering root 校验、RSR/VSR candidate simulation 和 replay 后得到一致的 replay final state root，正式 snapshot 保持不变，payload/canonical-write/unsupported-type 负例均 fail closed。旧的 `RNCS_RCL_RSR_SPATIAL_LOWERING_CANDIDATE_v0.1.json` 仍作为此前单命令历史证据保留。

该 seam 关闭的是“RCL native plan 无法进入既有 RSR session”的候选执行缺口；本轮进一步把不可约命令语义封存为 rooted `rcl.physical-command-profile.v0.1`，并由 `rncs.entity-command-batch.v0.1` 保留 source/profile/target command roots 与 candidate-only boundary。profile 已覆盖 `patch-heightfield` 的 world editing / destructible surface 与既有 `set-velocity` 的 correction/replay 正例，未知类型、样本不匹配、命令篡改和 canonical-write boundary 负例均 fail closed。它仍不是 RCL 已拥有一等 typed spatial primitive。当前 declaration 仍只能表达这两个已绑定类型，最多 256 条命令和 4096 个地形样本；dynamic-body terrain、Large World deform scheduler、连续完整 terrain manifold、目标设备/生产性能、canonical commit/promotion 仍是 OPEN。该候选只进入 K400 的 `EXPRESS / COMPILE / LOWER / EXECUTE / CORRECT / ROBUST / EVIDENCE` 证据，不宣布新单元 PASS。

因此下一步不再扩张 RSR command union，而是审计 RCL native compiler 的 first-class typed module/link seam：确认 `physical command profile` 是否能在 RCL 自身的类型/模块/bytecode 边界中表达并保留同一 roots；若不能，则显式登记 `RCL_GAP_RNCS_FIRST_CLASS_PHYSICAL_COMMAND_PRIMITIVE`，继续把 profile 作为控制面/Provider contract，而不把 facet convention 误称为语言原语。只有该 owner seam 稳定后，再继续 dynamic terrain policy → continuous manifold / solver integration，避免在 RSR 之外再造第二套 terrain command owner。

## 本轮 Large World → RSR terrain lowering adapter

在保持 Large World Runtime 不依赖 RSR 的前提下，新增 `packages/integration/large-world-rsr-bridge`。它先验证 region、chunk、stream resolution 和 source stream transition，再只接受 active chunk，把既有 `chunk.mesh.positions` 的 row-major y 样本降低为 `rncs.entity-state-batch.v0.1` 的 `spatial.fixtures.items.shape=heightfield`；Kernel 既有 materializer 随后生成 RSR static terrain body。每个 binding 同时保留 `chunk_root`、`state_root`、`content_root`、`mesh_root`、`height_samples_root`、`origin_mm` 和 `stream_root`，candidate/admission/physical transition 另行绑定 `stream_transition_root`，相邻 chunk 的共享边界样本经回归保持相等。

本地真实执行：Large World `36/36 PASS`；bridge `5/5 PASS`；RSR 全量 `210/210 PASS`；覆盖 active-only lowering、Kernel materialization、120 tick RSR terrain contact/grounded、bounded terrain-surface ray、lowered terrain sphere sweep/upright-capsule-vs-triangle sweep、bounded four-point contact manifold、RSR-native heightfield patch、确定性 replay、VSR heightfield projection、相邻 chunk boundary、inactive chunk rejection、batch/candidate tamper rejection，以及同一 RSR world 的 stream enter/exit、dynamic avatar state preservation、transition-root replay、Large World runtime snapshot/replay、RSR `fromSnapshot()` 恢复和切换后继续 step。bridge 还验证了 9-body/225-sample READY admission、0-budget BLOCKED_RESOURCE no-mutation，以及 1-body/25-sample stream transition admission；新的 Large World stream-transition evidence 还验证了 budget-evicted 与 released chunk 的分离、replay root、candidate admission root 和 RSR physical transition root。旧的 lowering candidate evidence 位于 `docs/verification/RNCS_LARGE_WORLD_RSR_TERRAIN_LOWERING_CANDIDATE_v0.1.json`，保留其当时固定的 `203/203` roots；residency transition evidence 位于 `docs/verification/RNCS_LARGE_WORLD_RSR_TERRAIN_RESIDENCY_TRANSITION_CANDIDATE_v0.1.json`，surface-ray evidence 位于 `docs/verification/RNCS_RSR_HEIGHTFIELD_RAY_QUERY_CANDIDATE_v0.1.json`，residency admission evidence 位于 `docs/verification/RNCS_LARGE_WORLD_RSR_TERRAIN_RESIDENCY_ADMISSION_CANDIDATE_v0.1.json`，历史 shape-probe evidence 位于 `docs/verification/RNCS_RSR_HEIGHTFIELD_SHAPE_PROBE_CANDIDATE_v0.1.json`，sphere-sweep evidence 位于 `docs/verification/RNCS_RSR_HEIGHTFIELD_SPHERE_SWEEP_CANDIDATE_v0.1.json`，capsule-sweep evidence 位于 `docs/verification/RNCS_RSR_HEIGHTFIELD_CAPSULE_SWEEP_CANDIDATE_v0.1.json`，contact-manifold evidence 位于 `docs/verification/RNCS_RSR_HEIGHTFIELD_CONTACT_MANIFOLD_CANDIDATE_v0.1.json`，heightfield mutation evidence 位于 `docs/verification/RNCS_RSR_HEIGHTFIELD_MUTATION_CANDIDATE_v0.1.json`，source stream transition evidence 位于 `docs/verification/RNCS_LARGE_WORLD_STREAM_TRANSITION_RECEIPT_CANDIDATE_v0.1.json`，均不回写历史 evidence。

负例和未闭合边界已经固定：适配器不改变 Large World active working set 或 canonical world state，也不授予 provider commit authority；RSR transition 只管理带标签的静态候选体，要求 candidate tick 与物理 tick 相等，并在切换时清除旧接触/支撑缓存。source stream policy 仍由 Large World 持有；本轮 transition receipt 只封存既有 decision，不自动重排、回收 provider 资源或替代 upstream scheduler；physical admission 只做 body/fixture/sample budget fail-closed。bounded sphere-vs-authored-triangle sweep、bounded upright-capsule-vs-authored-triangle sweep 与最多四点 contact manifold 已执行，但动态地形、连续完整 manifold、并行 Job、物理设备性能或生产资产发布证据仍未闭合。因此 `RCL_GAP_RNCS_LARGE_WORLD_PHYSICAL_TERRAIN_LOWERING` 已从“无 lowering seam”收窄为“candidate lowering、source stream transition receipt、同世界物理 residency transition、bounded surface ray、bounded sphere/capsule sweep、bounded contact manifold 与物理 admission guard 已验证、生产 stream scheduler/dynamic terrain/continuous full manifold 与产品执行仍 OPEN”，K400 只进入 `EXPRESS / COMPILE / LOWER / EXECUTE / CORRECT / ROBUST / EVIDENCE` 的 candidate evidence，不宣布新单元 PASS。

本轮裁决：`RCL_NATIVE_PHYSICAL_COMMAND_PROFILE_AND_KERNEL_CANDIDATE_BATCH_AND_RSR_VSR_LOWERING_VERIFIED_FIRST_CLASS_RCL_TYPED_PRIMITIVE_DYNAMIC_BODY_TERRAIN_LARGE_WORLD_DEFORM_STREAM_CONTINUOUS_MANIFOLD_STREAM_SCHEDULER_AND_PRODUCTION_BOUNDARIES_OPEN`。Large World runtime replay/snapshot 与 RSR `fromSnapshot()` 已能在同一 candidate transition 上恢复等价 roots；RSR-native terrain patch 也已能在 tick-local command 中产生可验证 mutation root；RCL physical profile 现在覆盖 bounded editing/destructible-surface patch 与 velocity correction/replay，并通过 Kernel candidate command batch 进入既有 RSR/VSR candidate session 并 replay。下一最高杠杆工作转为审计 RCL native compiler 的 first-class typed module/link seam，再继续收敛 dynamic terrain policy → continuous terrain manifold / solver integration；仍禁止复制 terrain generator，也不得借 adapter 获得 canonical world mutation 或 release promotion 权限。

## K400 / 证据裁决

本轮完成资产考古、既有 runtime donor 的真实执行、RCL native spatial plan → RSR/VSR candidate lowering 与边界定位，不宣布 K400 任一新单元 PASS。下一候选必须分别提供 `EXPRESS / COMPILE / LOWER / EXECUTE / CORRECT / ROBUST / PERFORMANCE / AI_GENERATE / EVIDENCE` 的可重放回执；源码生成、schema 通过、package test、host APK 或本机 Chrome smoke 不能替代 Android WebView/目标硬件、外部物理、真实分布式网络和生产差分门。

当前总体裁决：`PROCEED_AS_CANDIDATE`；World Body 仍是 `F4.5 Partial Production Parity` 方向上的候选基础，Studio/Build/Large World 统一消费链尚未实现。

外部 transport donor 的详细审计见 `docs/architecture/engine-stack/EXTERNAL-TRANSPORT-DONOR-AUDIT-2026-09.md`：DuoWorld Relay 仍只是受许可和部署边界限制的物理 Provider donor；DML Remote Link 已证明控制面身份/回执 donor 可本地执行，但不能替代 URRF world transport。下一步必须先裁决 canonical external transport 与 Provider/security owner。
