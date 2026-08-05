# Reality Simulation Runtime（RSR）v0.9.0-alpha.1

RSR是RNCS的三维权威状态、物理接触、角色具身和可验证重放内核。

## v0.9 Stable Embodiment

- 精确Vertical Capsule–OBB碰撞，替代Capsule对旋转Box的AABB近似。
- 法向与摩擦切向冲量跨Tick持久缓存和Warm Start。
- Contact与Joint共同构建确定性Constraint Island。
- 岛级Sleep/Wake，避免相连物体各自进入不一致睡眠。
- Coyote Time和Jump Buffer。
- 保留空间哈希、台阶、Ground Snap、移动平台、单向平台与v0.7权威网络协议。
- Sphere、Box、Capsule 和作者提供的 Convex Hull fixture 对接确定性三维 GJK/EPA；球-球使用精确闭式接触，诊断记录 GJK/EPA 调用、凸体接触和退化兜底次数。
- Convex Hull fixture 校验有限、非共面顶点和三角索引，并从 RSR 快照原样投影为 VSR 三角网格。

## RAGF Embodiment Binding

- `materializeRagfEmbodimentProfile(...)` 校验 `ragf.rsr-embodiment-profile.v0.4` 的 profile 根和 `rsr.spatial-embodiment-world.v0.6` 目标，把米制胶囊/质量/位置转换为当前固定点 RSR 配置。
- RAGF 的角色 profile 会落成动态 authority body、character controller、collision fixture 和可选 listener；`verifyRagfEmbodimentMaterialization(...)` 会重新计算 materialization 根并拒绝篡改。
- 该桥接覆盖 RAGF -> RSR 的确定性具身入口，不宣称已完成车辆、关节角色、自动凸分解或工业级接触流形。

## Entity Kernel Binding

- `materializeKernelStateBatch(...)` 将 `rncs.entity-state-batch.v0.1` 的 typed Fragment rows 按实体根确定性物化为 RSR authority body/fixture；Kernel 状态根保留在 `config.reality.realityRoot`，批次根保留为 evidence root。
- `projectKernelStateBatchToVSR(...)` 沿同一条 body/fixture 快照路径生成 VSR scene、frame plan 和 pixel root，并把 `kernel-entity:<id>` 标签与实体根写入投影数据。
- Aether bridge 的 `projectKernelStateToReality(...)` 接受真实 `EntityKernel` 或已封存 batch，先验证 `batch_root`，再提供 Node 侧的跨运行时入口。

## Spatial Reality Partition

`projectKernelStateToRealityCell(...)` 在 Aether bridge 中把同一份 RSR 快照绑定到 Reality Cell v0.1：RSR snapshot-derived causal islands、Network Observer Relevance、固定点 LWC sector/local 坐标和 VSR `scene.streaming`/frame plan 共用一个 catalog/state root。提供 `assetCatalog` 时，同一 active-cell 集合还会解析依赖闭包、resident/queued/deferred/evicted 资产预算，并把 `assetStreaming.root` 写入 state/frame；异步磁盘 payload、GPU 上传、HLOD/PCG 和生产大世界预算仍属于后续能力。

## 运行

```bash
npm run typecheck
npm run test:spatial-embodiment
npm test
npm run verify:release
```

## 真实性边界

- 角色控制器默认仍为Y轴直立胶囊；物理窄相位已支持带刚体旋转的Capsule。
- Sphere/Box/Capsule/Convex Hull 常见组合均走广义凸支持路径；球-球使用稳定闭式特例，极少数 EPA 退化仍保留显式 legacy fallback 并计入诊断。
- Convex Hull 当前是单个作者网格 fixture；自动凸分解、地形高度场、车辆轮胎接触和完整工业接触流形仍未实现。
- 接触缓存是确定性单点持久流形，不是完整四点/八点工业接触流形。
- 约束求解器仍是单线程整数确定性参考实现，不声称达到Jolt/PhysX/Chaos吞吐量。
- Kernel binding 当前是一实体一 body/fixture 的确定性桥；多 fixture archetype、完整 ECS chunk/processor、并行 Job 和网络 wire frame 绑定仍未完成。
