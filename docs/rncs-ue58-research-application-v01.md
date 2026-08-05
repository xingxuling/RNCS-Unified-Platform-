# RNCS UE5.8 Research Application v0.1

Date: 2026-08-01
Source archive: `C:\Users\User\Downloads\RNCS_UE5_8_Research_Package_2026-08-01.zip`
Source SHA-256: `E222A40053EDD7EC389A0C199D2081DDA7E4D4ACEEA9D1B0F4C0B04D038CD4CA`

## 结论

这份包对 RNCS 有帮助，但它是研究与证据包，不是可以直接编译进 RNCS 的 UE5.8 源码。它最有价值的部分是把 Unreal 的六组可迁移机制整理成了 RNCS 的升级顺序：

1. MassEntity 的数据、行为、批处理分离。
2. StateTree 的行为编译与层级状态求值。
3. World Partition、Data Layers、HLOD、PCG 和大世界坐标的分层现实单元。
4. Iris 的复制桥、量化状态、观察者相关性、优先级与并行发送。
5. UE Tasks 与 Chaos 的受约束任务图、因果岛和求解器边界。
6. Unreal MCP 的类型化工具、游戏线程串行边界和运行时/编辑器隔离。

## 证据边界

- `evidence/official_sources.md` 是官方资料索引，不等于本地实现已通过 UE5.8 验收。
- `evidence/taowind_receipts.json` 和 `07_taowind_research_findings.md` 是压缩包提供的外部 receipt。其正向与负向 RCL 原型证据本轮没有重新执行，因此保留为外部研究证据，不升级成当前分支的测试通过数。
- `prototypes/RNCSUE58RuntimeProfile.rcl` 与 `prototypes/RNCSUE58NegativeControl.rcl` 是可迁移的行为样例，不是 RNCS 现有运行时的自动接入。
- 压缩包记录的 UPDIA/RGR 查询曾把 UE5 研究错误地映射到 AI/BCI 资料，说明研究来源必须带命名空间、来源角色和临时生命周期。

## 当前工程映射

| UE5.8 机制 | RNCS 对应位置 | 当前状态 |
| --- | --- | --- |
| Mass Fragment/Archetype/Chunk/Processor | `rncs-core` Entity Kernel、RSR authority bodies、simulation phases、VSR frame resources | 已有 typed Fragment、Composition Signature、确定性 State Batch、Deferred Mutation Ledger，以及一实体一 body/fixture 的 RSR/VSR 批处理绑定；多 fixture archetype、chunk/processor 和并行 Job 仍缺 |
| StateTree/Smart Object | `reality-behavior-fabric`、RCL behavior、候选现实工作流 | 已有确定性状态机/行为树、权限边界和 Evidence-aware read/write task graph；Opportunity Slot 还未完整编译 |
| World Partition/PCG/LWC | VSR streaming cells、Cell-aware asset streaming、bounded next-cell prefetch、rooted HLOD proxy selection and deterministic static HLOD generation、per-cell proxy residency、RSR spatial embodiment、Aether RNCS bridge Reality Cell | 已有跨 VSR cell、RSR causal island、Observer Relevance、LWC sector/local 坐标、依赖/预算/淘汰解析、前景优先的 next-Cell 预取、按 cluster bounds 距离切换的 HLOD 代理、静态源节点自动代理生成、代理纳入所属 cell catalog、file-backed 异步 payload/lease/eviction runtime，以及严格 GLB 解码后场景绑定和真实 WebGPU 上传/淘汰证据的有界 Reality Cell v0.1；泛化资产格式、生产级磁盘缓存调度、跨材质 HLOD、动态内容再生成、PCG 生成和超大世界验收仍缺 |
| Iris/Network Prediction | `reality-network-runtime`、RSR v0.7 reconciliation | 已有权威帧、预测、恢复和现在的 Observer Relevance View；量化 wire descriptor、并行发送和完整 rollback cue ledger 仍缺 |
| Chaos/Tasks/Trace | RSR GJK/EPA、constraint islands、sleep、replay roots、Reality Cell causal projection | 已有确定性碰撞、solver island、快照回放和有界 snapshot-derived causal island；Reality Field、受保护 solver bridge、独立 runtime trace 仍缺 |
| Unreal MCP | `taowind-reality-mcp`、developer execution runtime | 有 MCP 工具权限和工程执行边界；UE game-thread provider、schema compiler、编辑器/运行时隔离还未接入 |

## 2026-08-06 运行时资产接入更新

- RAGF 现在输出带封存根和兼容目标的 `ragf.vsr-spatial-asset.v0.4` 与 `ragf.rsr-embodiment-profile.v0.4`，不再只写一个脱离当前运行时版本的名称。
- VSR `compileRagfSpatialAsset(...)` 已把实际生成的主网格和三级 LOD 编译为当前 scene，并可绑定 Cell residency；RSR `materializeRagfEmbodimentProfile(...)` 已把实际 profile 转换成固定点动态角色配置。
- RAGF 内置生成器已完成质量升级：圆润分部几何、结构化四张 PBR map、8 骨骼、4 动画、morph target、三级 LOD 和语义碰撞 fixture；几何 GLB 与 PBR 包分开寻址，palette-only regeneration 仍复用 mesh root。
- 当前证据：VSR spatial `98/98`、RSR spatial `64/64`、RAGF `177/177`、实际 RAGF workspace 到 VSR/RSR 的联测 `1/1`。
- 这仍是有界运行时接入，不等于 UE/Unity 的专业资产质量、完整 PBR GPU 上传、自动凸分解或目标硬件性能验收。

## 本轮已落地

### 1. Evidence Namespace 与 Ephemeral Source Packet

`packages/integration/taowind-reality-mcp/src/knowledge-index.mjs` 现在把仓库文档标为 `repository` 持久证据，并支持 `rncs.ephemeral-source-packet.v0.1`：

- 外部研究资料在内存中按 namespace、domain、evidence role 建档。
- `source_only`、`persistent_only`、namespace 和 evidence role 过滤已经接入 MCP `search`。
- search/fetch 结果携带 `persistent`、`packet_id` 和 `source_uri`，可以追溯来源。
- `dropSourcePacket(packet_id)` 可撤销整包，不写入权威状态，不修改仓库文件。

这是 P0 的本地 MCP 侧实现。UPDIA/RGR 的异步研究状态桥、真正的 source-only 远程检索和自动证据回写仍未完成。

### 2. Observer Relevance View

`packages/network/reality-network-runtime/src/relevance.mjs` 已实现一个只读、确定性的相关性视图：

- 支持空间半径、语义标签、焦点主体、因果主体和对象预算。
- 始终保留 required/focus/causal 主体，并保留来源状态根与权威帧根。
- 生成 `network.observer-relevance.v0.1`、优先级、遗漏主体、事件投影和 `viewRoot`。
- 不修改 RSR 权威快照；它是复制/呈现前的筛选合同，不是客户端权威状态。

这对应 Iris 的 filtering/prioritization 思路，但还不是 Iris 线协议、量化状态复制或并行发送实现。

### 3. Entity Kernel 与 Reality Scheduler P1

P1 已经进入源码和测试：

- `packages/kernel/rncs-core-contract/src/entity-kernel.mjs` 提供跨 Node/Python 哈希约束下的 typed Fragment Schema、Composition、State Batch、Deferred Mutation Ledger、expected entity root 和原子提交。
- `packages/control/reality-behavior-fabric/src/reality-scheduler.mjs` 编译显式 prerequisites，检查 read/write hazard，执行 authority、input root、operation budget、rollback 和 evidence policy。
- `BehaviorRuntime.tickScheduled(...)` 提供可选 scheduled tick，不改变原有直接 Tick 路径；失败时恢复运行时快照，外部 Provider 副作用仍必须通过能力权限单独治理。

### 4. Kernel -> RSR -> VSR Binding P1

本轮已把 Kernel 状态接入真实空间运行时：

- `materializeKernelStateBatch(...)` 将 `rncs.entity-state-batch.v0.1` 的实体行物化为 RSR authority body/fixture，保留 `state_root`、`batch_root` 和 `entity_root`。
- `projectKernelStateBatchToVSR(...)` 只从该 RSR 快照生成 VSR scene、frame plan 和 pixel root，不创建第二份可写的视觉世界。
- `packages/integration/aether-rncs-bridge/src/kernel-spatial-binding.mjs` 接受真实 `EntityKernel` 或封存批次，并在 bridge 入口验证 `batch_root`；集成回归已验证 3/3。

### 5. Weighted-blended OIT P0

VSR 的 BLEND 材质默认进入 weighted-blended OIT：CPU 参考路径维护 depth-weighted accumulation 与 revealage，WebGPU 使用独立 `rgba16float` accumulation/revealage 目标和 resolve composite pass；`transparencyMode:'sorted'` 仍可用于兼容场景。frame plan、资源根、pass 依赖、fake-device 编码和真实 Chromium WebGPU receipt 均已绑定。

### 6. Screen-space Dynamic Indirect Light P0

VSR 后处理现在接入有界 SSGI：CPU 参考路径和 WebGPU tone-map 共享 scene color/depth 邻域采样，以及 rooted intensity、radius、steps、thickness 参数；`ssgiPasses` 进入 WebGPU receipt，并由真实 Chromium 回归执行。它补上了局部动态颜色反弹的真实接入，但不等于完整 DDGI/Lumen 或全局动态 GI。

### 7. Deterministic Irradiance Probe Bake P0

VSR 新增 `vsr.spatial-irradiance-probe-bake.v0.1`：从场景灯光、环境纹理/颜色和 emissive 几何生成最多八个确定性 probe，封存 `sourceRoot`、布局设置和 bake `root`，并通过 source-root 校验后写入现有 `environment.probes`。CPU PBR 和 WebGPU `environment-probes` storage buffer 直接消费同一结果，真实 Chromium receipt 记录 `irradianceCacheProbes=4`。`npm run evidence:irradiance-bake --workspace @taowind/visual-state-runtime` 会把 JSON bake 回读校验，并输出 `outputs/spatial-irradiance-probe-bake/evidence.json` 与 `reference.png`。这是可持久化的有界 probe cache，不等于 DDGI/Lumen。

### 8. Deterministic Static Lightmap Bake P0

VSR 将静态 lightmap bake 升级为 `vsr.spatial-lightmap-bake.v0.2`：对无 skin、无 morph、无 LOD 的静态节点，按三角形生成不重叠的受预算约束 UV1 charts；每个 chart 使用最多四个固定采样点，对 shadow-casting 的 opaque/masked 静态几何执行确定性射线可见性判断，并把已覆盖 texel 按 dilation 扩张到 atlas padding。产物包含线性 RGBA8 atlas、复制后的 baked meshes、节点级 baked materials 和 `lightmapBakeRoot`。`applySpatialLightmapBake()` 在 source-root 校验后将这些记录接入现有 CPU/WebGPU lightmap 采样路径；`npm run evidence:lightmap-bake --workspace @taowind/visual-state-runtime` 会回读 bake JSON 并输出 CPU PNG/evidence。它已经具备有界阴影可见性和边缘防漏光基础，但不等于 UE 的 seam-aware packing、完整 leakage control 或动态 GI。

### 9. Bounded Irradiance Volume P0

VSR 新增 `vsr.spatial-irradiance-volume.v0.1`：在最多 512 个网格样本内持久化环境、灯光和 emissive irradiance，封存 `sourceRoot` 与不含灯光的 `topologyRoot`；每个样本有确定性静态几何可见性、颜色、强度和可见性值。`updateSpatialIrradianceVolume()` 在拓扑不变时对改变后的灯光执行增量混合，`applySpatialIrradianceVolume()` 通过 source-root 校验后写回环境；CPU 三线性采样与 WebGPU binding 8 消费同一格式。`npm run evidence:irradiance-volume --workspace @taowind/visual-state-runtime` 会回读 JSON、校验 root 并生成 CPU PNG，真实 Chromium temporal receipt 记录 `irradianceVolumeSamples=48`。它是有界动态 irradiance cache，不等于完整 DDGI/Lumen、跨体积漏光/遮挡治理或工业级大世界 GI；多体积选区/混合由下一节 field contract 提供。

### 10. Multi-volume Irradiance Field P0

在单体积路径上新增 `vsr.spatial-irradiance-volume-field.v0.1`：多个 volume 共享 scene source/topology roots，由 world-partition cell id 参与确定性 active-cell 选区，使用有限 AABB 距离做边界 blend，并受 `maxVolumes`/`maxSamples` 预算约束。CPU 参考路径与 WebGPU binding 8 使用同一体积元数据和 sample offset 布局；frame plan 会把选区后的 field root、环境资源 root 和 streaming root 一起封存，`verifySpatialFrame()` 会校验 field artifact 与 selected root。`npm run evidence:irradiance-volume-field --workspace @taowind/visual-state-runtime` 会生成并回读双体积 JSON、校验两个 active cells、输出 CPU PNG/evidence。真实 Chromium temporal 回归新增 `multi_volume` 帧，receipt 报告 `irradianceVolumeSamples=36`、`submitted=true`、`deviceLost=false`；CPU 回归验证 active-cell 裁剪和 pixel root 变化。这是有界跨体积选区/混合，不等于跨体积漏光/遮挡治理、adaptive probe relocation 或完整 DDGI/Lumen。

### 11. Bounded Reactive Temporal Mask P0

在已有相机运动重投影、投影深度拒绝和 3x3 neighborhood clamp 之上，VSR 新增 `temporalReactive` 与 `temporalReactiveThreshold`，并把材质 `temporalReactive`、`reactiveMaskTextureId`、节点 reactive 标量和 skin/morph 保守覆盖接入 Draw Packet。随后又加入 `temporalVelocityThreshold`、`temporalVelocityDilation`、当前/上一实例变换和 velocity attachment；CPU 参考 resolve、普通 WebGPU tone-map、透明/OIT composite 共享 velocity、bounded dilation、previous-depth/history-velocity reject 契约。后处理 uniform 保持 96 字节，reactive/velocity 数据通过独立 `rgba16float` attachment 进入最终 resolve。CPU 回归验证亮部 history、authored 1x1 mask 与对象运动；真实 Chromium 新增 `plain_temporal`、`authored_reactive`、`velocity_static` 与 `moving_velocity` 帧，材质纹理绑定从 6 增到 7、发生一次真实纹理上传，静止/运动 PNG 与 frame root 可区分，全部相关帧 `submitted=true`、`deviceLost=false`。该能力仍不包含高阶 disocclusion/TAA history heuristics 或完整 UE/Unity temporal contract。

### 12. Spatial Reality Partition P1

`packages/integration/aether-rncs-bridge/src/reality-cell.mjs` 将同一个有界 cell 决策同时投影到 RSR、Network 和 VSR：

- 从 RSR joint/contact 图推导确定性的 snapshot causal islands，并把因果主体扩展到其所属 cell；
- 调用 `network.observer-relevance.v0.1`，把 focus/causal/semantic 选择映射为 selected/forced cells，不修改 RSR authority snapshot；
- 用固定点坐标量化 LWC `sector`/`localQ`，封存 catalog、causal、relevance、VSR config/resolution 和 state roots；
- 将同一 catalog 真正送入 VSR `scene.streaming` 与 frame plan，支持上一帧 active cells 的 enter/exit/hysteresis；
- 提供 `assetCatalog` 时，以同一 active-cell 集合调用 VSR asset streaming resolver，封存依赖闭包、resident/queued/deferred/evicted 集合、预算和 `assetStreaming.root`；
- `projectKernelStateToRealityCell(...)` 输出 RSR snapshot、Reality Cell state、资产解析、VSR scene/frame/pixel evidence；demo 会写出 JSON、PNG 和 evidence root。
- `createRealityCellAssetRuntime(...)` 将 sealed Cell 资产请求接入 VSR 异步 streamer；file-backed loader 通过 SHA-256 校验真实 bytes，`acquire` 返回 receipt，lease release 与显式 eviction 分开执行，传入 `cacheDirectory`/`cacheByteBudget` 后还会使用内容寻址 manifest、校验后的磁盘回填和确定性 LRU 字节预算。
- `bindRealityCellAssetScene(...)` 将通过校验的 GLB 或 external-buffer glTF bytes 交给现有 glTF importer，把 mesh/material/`vsrRGBA` texture 资源绑定到 active Cell 节点，并把外部 buffer/image 依赖 roots 纳入 binding receipt；Node 与真实 Chromium 共享同一个 frame root。
- `createRealityCellAssetSceneRuntime(...)` 将场景绑定提升为有状态迁移：先取得下一 Cell 的资产租约，成功后释放上一 Cell，再根据新 receipt 的 eviction 集合淘汰旧资产；`projectKernelStateToRealityCell(..., {assetSceneRuntime})` 同时输出 transition lifecycle root。

这是状态、资产选择、file-backed payload 生命周期、内容寻址磁盘缓存、GLB/external-buffer glTF 场景绑定路径、有界 next-Cell 预取、自动静态 HLOD 生成、按 cell 的代理驻留与代理选择和 near -> far -> near 场景迁移的真实绑定；仍不等于已经完成所有资产格式的解码、多进程/远端缓存一致性、生产级 GPU upload/eviction 策略、跨材质 HLOD、动态内容再生成、PCG 生成或超大世界性能。

### 13. Cell-aware Asset Residency P1

Reality Cell 现在不只选择节点，还能把 Cell catalog 映射到 VSR `assetCatalog`：

- active/forced cells 产生确定性的 asset roots，并递归补齐 mesh/texture/material 的依赖闭包；
- `residentAssetIds`、`queuedAssetIds`、`deferredAssetIds`、`evictedAssetIds` 和 byte/asset budget 同时进入 Reality Cell state 与 VSR frame plan；
- near -> far 的 Cell 迁移会产生可回放的淘汰集合，篡改资产解析会被 state root/frame root 拒绝；
- Node bridge `28/28` 与真实 Chromium WebGPU 都验证同一 `assetStreaming.root` 和最终 `frameRoot`；file-backed runtime demo 进一步验证真实 bytes、SHA-256 receipt、lease release 和 near -> far eviction，GLB/external-buffer glTF demo 验证解码后的 scene binding，transition demo 验证下一 Cell 的三个依赖先完成预取且不取得前景租约、旧 Cell 后释放并淘汰，缓存测试验证冷 runtime 回填和小预算 LRU。

这是 UE World Partition/streaming 语义的有界接入层，已经包含可运行的 file-backed loader、带 manifest/LRU 的本地内容寻址缓存、GLB/external-buffer glTF 到 WebGPU 的真实链路、有状态 Cell 场景替换、rooted HLOD proxy selection、静态自动 HLOD generation 和按 cell 的代理 catalog 绑定；泛化格式、跨进程/跨主机资源一致性、跨材质 HLOD、动态内容再生成、PCG 和超大世界验收仍需后续实现。

## 当前可复核证据

- RSR 空间具身：`63/63`；RSR 全量：`194/194`。
- Kernel -> RSR -> VSR bridge：原有 Aether integration `3/3`，Reality Cell integration `28/28`；frame verified，重复调用的 binding/frame/pixel/cell roots 相同，并拒绝篡改 batch/cell state。
- Reality Cell real Chromium WebGPU：`apps/reality-studio/tests/browser_reality_cell_webgpu_test.py` 读取同一份 `scene.vsr3d.json` 和 sealed streaming options，实际提交 2 个 draw calls/14 个 triangles，`submitted=true`、`deviceLost=false`，无 page/WGSL/request 错误，浏览器 `frameRoot` 与 Node frame plan 一致；证据写入 `output/playwright/REALITY_STUDIO_REALITY_CELL_WEBGPU.json`。
- Cell-aware asset streaming：near Cell 的 `asset:shared` resident、`asset:mesh` queued，依赖闭包和预算根进入 `frameRoot`；near -> far 回放验证 `asset:shared` eviction，真实 Chromium `asset_streaming_root=863123e1799ff9e46341efd6e13466e6426b12f5bb4461dee3c3367c1b71c834` 且最终 `frameRoot` 与 Node 一致；file-backed runtime evidence root 为 `b31a704f0626f1921e6925f260496696aff842e2e2979ca25bc7164caba0cbcb`。
- Strict GLB scene binding：`asset:mesh` 的真实 GLB bytes 经 glTF importer 生成 mesh/material/`vsrRGBA` texture 资源并挂入 active Cell；Node/browser `frameRoot=e2d9e00e938640ebbce2d8b10c6e9434f005e5d5b2f824b31c3d58fa9acc1e2e`，Chromium receipt 报告 4 draws、28 triangles、2 texture uploads、23 buffer uploads、1 texture eviction、6 buffer evictions，`submitted=true`、`deviceLost=false`，evidence root 为 `b2ea5f45eb040ec50e6f2dc286dadf0559e90eb2baf0e8b8973a862b6cb361e6`。
- Transactional cross-format Cell scene replacement：near frame root 为 `690c6d590eb68c05e129e4d097a40ddf76bc1cdd7b2f7767e0a53f22c6e72fef`，far external-buffer glTF frame root 为 `6c5617adc399898e8881f1f526acbf57166469260f8786d5e01fdf8d9119f2c5`，nearAgain frame root 为 `2805397f2c78bf8016dd68341c1fc8696ea1edae7a5c485c2d70a820223ecf38`；near receipt 提前完成三个 far 依赖的预取，far binding receipt 的 `operations` 为空，far transition 淘汰 `asset:mesh`/`asset:shared`，Node 最终 ready 集合为空。默认缓存回放 reports `sourceReads=0`、`cacheHits=7`、`cacheMisses=0`、manifest root `db2c2522db618ea5e6f10fc710f3726e6bf3b6f593447b5e935fc47270f1ce41`；cold prefetch 回放 reports `sourceReads=5`、`cacheHits=2`、`cacheMisses=5`、manifest root `5179a8d5df9ffc80391a6cfde40aa9d2ca707e4175d124027d44d5b0c1a497d0`。Chromium 在同一 executor 完成 near -> far -> near，三帧均 `submitted=true`、`deviceLost=false`，far 报告 `textureEvictions=1`、`bufferEvictions=17`，near-again 报告 `textureEvictions=1`、`bufferEvictions=6`，PNG SHA-256 为 `71f1d13740f604ce4d9b706d212a6dfe2d50e72ac74580d8e6ea53fc15eb0d85`，无 page/WGSL/request 错误，transition evidence root 为 `78e1bdf655d6de76e3d01a087b0733282a48f25d0fbfb29c5509e8ecd99e56c0`。
- VSR asset streaming：`6/6`，catalog identity 会把 `format` 和 external-resource metadata 纳入 root，避免 GLB 与 glTF 记录错误复用；Reality Cell bridge `28/28` 另覆盖内容寻址缓存命中、冷 runtime 回填、前景优先的 next-Cell 预取和 LRU 字节预算。
- RNCS Core Entity Kernel：新增测试 `6/6`，原有 Core Contract 测试 `8/8`。
- Reality Behavior Fabric：`81/81`，含 Scheduler 图、authority/evidence/rollback 和 scheduled tick 回归。
- VSR spatial reality：`97/97`；glTF importer：`21/21`；generated lightmap/weighted OIT/SSGI/irradiance bake/volume/field/reactive/velocity 的真实 Chromium temporal 回归覆盖 base/history/blended/bright-blended/plain-temporal/authored-reactive/reactive/reset/dynamic-light/multi-volume/residency/velocity_static/moving_velocity 十三个 GPU 帧；常规烘焙帧为 `materialTextureBindings=6`、`oitPasses=2`、`velocityPasses=1`、`ssgiPasses=1`、`irradianceCacheProbes=4`、`irradianceVolumeSamples=48`，authored reactive 帧为 `materialTextureBindings=7` 且新增一次纹理上传，多体积帧报告 `irradianceVolumeSamples=36`，所有相关帧 `submitted=true`、`deviceLost=false`；dynamic-light 改变 frame root 与 PNG，plain-temporal/authored-reactive 的 PNG 不同，moving_velocity 与 velocity_static 的 PNG/frame root 不同，CPU field/reactive/velocity 回归分别验证 active-cell 选区/pixel root、亮部 history 抑制、材质 mask 和对象运动接入。HLOD Node/Chromium 证据另外验证 near 两个源实例到 far 一个代理 draw 的 rooted promotion，自动 HLOD Node/Chromium 证据验证静态源集生成的 `24` 到 `8` 三角形代理提交，cell-aware HLOD Node/Chromium 证据验证单 cell 近景和双 cell 远景代理驻留。
- 网络运行时：`27/27`，含 Observer Relevance View。
- TaoWind Reality MCP：`29/29`，含 source packet 单元测试、MCP namespace/source-only 集成回归和原有 MCP 集成回归。
- 之前的真实 Chromium WebGPU 回归仍有效：时序、深度拒绝、3x3 temporal clamp、luminance-derived 与 authored/material reactive mask、instance motion velocity、lightmap、alpha blend、texture/buffer residency、SSGI、generated probe cache、多体积 field、authored HLOD、automatic HLOD 和 cell-aware automatic HLOD near/far promotion 均提交成功，`deviceLost=false`，无 page/WGSL/request 错误。

这些数字证明当前仓库里的实现和测试路径，不证明 RNCS 已达到 UE5.8、Godot 或 Unity 的整体能力等价。

## 下一步优先级

1. Spatial Reality Partition：Cell-aware 资产依赖/预算解析、file-backed async loader/lease/eviction、内容寻址 manifest/LRU 缓存、GLB/external-buffer glTF scene-to-WebGPU 路径、前景优先的 next-Cell prefetch、rooted HLOD proxy selection、自动静态 HLOD 代理生成、按 cell 的代理 catalog 绑定和事务式 near/far/nearAgain scene replacement 已完成有界 v0.1；下一步是 BasisU/KTX2 supercompression、Draco/Meshopt、多进程/远端缓存一致性、跨格式 GPU upload/eviction、format-aware prefetch policy、跨材质 HLOD、动态内容再生成、PCG 和超大世界预算验收。
2. Replication and Prediction：补 quantized state descriptor、wire-level observer filter、priority budget、rollback/resim cue ledger。
3. Reality Field and Trace：补受保护 solver bridge、runtime trace 和可回放的 trace analysis，但不把 runtime trace 混入正式权威账本。
4. Unreal MCP Provider：在 loopback、类型化 schema 和 game-thread serial queue 约束下接入 UE 编辑器/运行时；默认保持无宿主写权限。
5. Kernel-to-RSR/VSR expansion：把当前一实体一 body/fixture 桥扩展为多 fixture archetype、chunk/processor 和网络 frame 绑定，并保持 RSR 单一权威来源。
6. Full dynamic GI path：在当前有界 irradiance volume field、generated probe cache 和 v0.2 static lightmap bake 之后补跨体积遮挡/泄漏控制、自适应 probe 更新、大场景 streaming 预算和目标硬件性能验收；不把 volume/field receipt、probe bake、lightmap receipt 或 SSGI receipt 当作完整 DDGI/Lumen 证据。

## 非目标

本次不把研究包中的模块名称直接写入 registry 充数，也不把外部 receipt、官方网页或 RCL prototype 当作当前工程已完成能力。每一步升级都必须落到源码、schema、测试或真实运行收据上，并继续保持“状态与因果是脑，模型只是嘴”的权威边界。
