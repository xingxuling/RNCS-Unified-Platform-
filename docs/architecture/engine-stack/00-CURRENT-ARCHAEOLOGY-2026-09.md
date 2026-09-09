# RNCS Engine Stack Current Archaeology

日期：2026-09-10

状态：`CANDIDATE_ARCHITECTURE_AUDIT`

本记录只沉淀当前源码、schema、测试入口和本地执行结果；不把历史 README、生成物或未执行的外部后端提升为当前能力。

## 审计基线

- RNCS worktree：`codex/rncs-engine-stack-archaeology-v01`，基于 `main-95` 的 `09f11a88e56c93f3b295c767ff71f62f7e4f890f`。
- GitHub `origin/main-95` 当前指针与该 commit 相同。
- 工作树原先干净；当前新增的唯一内容是本审计文件。
- worktree 使用 sparse checkout。部分已被 Git 跟踪的源文件没有物化到磁盘，因此这类失败只能记为 `BLOCKED_CHECKOUT_COVERAGE`，不能冒充语义测试失败。

## 已确认的现实能力

| 层 | 当前真实入口 | 当前证据边界 |
|---|---|---|
| Authoring | Reality Studio Unified Project v0.9、Spatial Workspace v1.4、行为/时间轴/UI/输入/RSR 场景编辑 | Studio 的当前源码存在真实 session、空间编辑、Network Compiler 和导出路径；历史状态文件称 237/237，但本 sparse worktree 的 223 个测试中有 8 个在 import 阶段被跳过的模块阻断。 |
| Physical | RSR v0.9 固定点三维空间模拟、碰撞、约束、角色、重放 | 当前物理、空间、网络 reconciliation、具身和差分相关本地包测试已通过；车辆、地形高度场、自动凸分解、工业接触流形、并行 Job 仍明确未完成。 |
| Visual | VSR v0.8 CPU reference、glTF/GLB/PBR、动画图、蒙皮/morph、WebGPU 编码/真实 Chromium 边界 | 本地 VSR/RSR 专项套件已通过；真实 Chromium 与 fake device 不是目标硬件帧率或跨设备生产证明。 |
| Assets | RAGF 资产创生、资产连续性、GLB/材质/动画候选和 Studio 资产数据库 | 本地候选生产与导入链可运行；外部文生 3D Provider、专业 DCC 回写、电影/AAA 质量和生产资产服务仍未闭合。 |
| Network | Studio network authoring/compiler v1.6，Network Runtime v0.2 的编译世界、预测、回滚、丢包/重排测试 | 当前是本地确定性/故障注入证据，不是真实跨节点部署、攻击面、安全密钥或生产 SLA 证据。 |
| Large World | Large World Runtime v0.1.0-alpha.7 的 WorldSeed→Region→Chunk、有限工作集、URRF/VSR、复制、持久化和恢复 | package 自身测试已取得 36/36 PASS；该路径没有接入 Studio/Build，也没有在 `rncs.modules.json` 中登记，当前不能称为产品级统一世界管线。 |
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
```

第一条链的真实 Studio 导出与 Build 运行时没有调用 `world-body-codegen`。第二条链的 `world-body-codegen` 也没有 Studio 或 Build consumer。第三条链保持 RNCS world truth 与 URRF/VSR representation 的边界，但没有统一 authoring/build artifact。

源码级事实：

1. `apps/reality-studio/src/scene-studio.mjs` 的 `exportArtifacts()` 导出行为、资产、空间、GPU、时间轴、Network Compilation 等文件，但不调用 World Body codegen。
2. `apps/reality-build/src/runtime-evidence.mjs` 从 Unified Project 创建 `UnifiedManufacturingSession`，直接重放 Behavior/Spatial trace 并生成 Build evidence；它不消费 World Body IR 或 codegen manifest。
3. `packages/world/world-body-codegen/src/index.mjs` 只接受 `taowind.world-declaration.v0.1`，生成 RSR config、VSR bindings、temporal/network、render graph、event routes、RCL 和 proof template；没有 Unified Project adapter。
4. Studio 的 Network Compiler 已经拥有 `project_root`、`spatial_workspace_root`、`source_world_root`、`active_scene_root`、`authoring_root`、`world_config_root` 和 asset binding roots，但这些根没有被映射到 World Body roots。
5. `rncs.modules.json` 登记了 Studio/Build 与 World Body 包，却没有让 Studio/Build 依赖 World Body；Large World Runtime 和 URRF 也没有 registry entry。这是能力可发现性/测试编排缺口，不应靠重复胶水解决。

语义覆盖也不是一一对应：Studio Unified Project 还拥有 behavior、input、sequencer、UI、spatial3d 和 network facets；Studio 的 network fixture 实际覆盖 6 bodies、3 characters、2 asset bindings、2 player slots。World Body IR v0.1 当前有 authority、physical、visual、temporal、assets、observers、events 七类状态 root，另有 BodyMap 与 Render Graph set root；codegen 只对这些声明生成 specialization。它没有直接承载 Studio 的 character controller、joint/material/listener、behavior/UI/input/audio、network transport profile 或 Large World streaming。因而下一步不能把这些字段静默丢进 World Body，也不能把它们硬塞入 World Body core；必须保留 facet owner，并用显式 sidecar/root binding 证明覆盖和缺口。

## 结构判断

### 限制性瓶颈

当前最大瓶颈是 `RCL_GAP_RNCS_SHARED_WORLD_COMPILATION_SPINE`：缺少一条保持 root、authority、candidate 和 evidence 语义的共享 authoring-to-runtime compiler seam。

这不是“再写一个引擎子系统”的缺口，而是已有子系统不能共同承载同一个世界工件的缺口。若直接在 Studio、Build、Large World 各自添加转换，会产生重复语义、root 混淆和无法回滚的并行系统。

### 必须保持的不变量

1. World Body IR/codegen 继续是世界身体语义与候选 specialization 的 owner，不把 Studio UI 或 Build target 语义塞进 IR core。
2. Studio Unified Project 是 authoring owner；Studio/Build 现有手写/直接 RSR/VSR 路径继续是 fallback，不能被候选 codegen 静默替换。
3. `project_root`、`spatial_workspace_root`、`source_world_root`、`worldBodyRoot`、`stateRoot`、`frameRoot` 和 `compilation_root` 必须各自保留，不能用一个 hash 代替全部语义。
4. adapter 只能生成 candidate bundle、差分结果和 evidence；不得获得 RNCS/RFE commit、release promotion 或外部设备授权。
5. 未执行的浏览器 GPU、外部物理、真实网络、生产资产 Provider 和目标硬件继续标记 `UNVERIFIED`。

## 下一最小高杠杆候选

建立一个独立 integration adapter（建议 `packages/integration/world-body-studio-bridge`），只做：

```text
Unified Project + selected spatial world + scene/asset roots
  → candidate World Declaration
  → existing world-body-codegen bundle
  → existing Studio/Build evidence as a sidecar
```

第一轮应以 `examples/studio-authored-network-world-v03/project.mjs` 为 fixture，验证：确定性双生成、Studio roots 与 World Body roots 的显式绑定、真实 RSR/VSR 观测差分、Network compilation 的 root 保持、Build fallback 不变、篡改/缺失资产/非法 authority 负例闭合。Large World 接入应在同一 adapter contract 之后再做，而不是另起一套 world compiler。

## K400 / 证据裁决

本轮只完成资产考古与结构定位，不宣布 K400 任一新单元 PASS。下一候选必须分别提供 `EXPRESS / COMPILE / LOWER / EXECUTE / CORRECT / ROBUST / PERFORMANCE / AI_GENERATE / EVIDENCE` 的可重放回执；源码生成、schema 通过、package test 通过不能替代真实 runtime、平台、设备和生产差分门。

当前总体裁决：`PROCEED_AS_CANDIDATE`；World Body 仍是 `F4.5 Partial Production Parity` 方向上的候选基础，Studio/Build/Large World 统一消费链尚未实现。
