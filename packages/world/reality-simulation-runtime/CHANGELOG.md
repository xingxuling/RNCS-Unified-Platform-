# Changelog

## Unreleased

- 强化 `rsr.authoritative-state-frame.v0.7` 校验：验证帧身份、元数据、对象唯一性以及每个嵌套 `bodyRoot`，不再只验证外层 `frameRoot`；
- RNCS 空间会话现在把 RSR 权威帧作为可验证的 VSR 时序输入，保留同一 `stateRoot` 的权威展示边界；
- Sphere、Box、Capsule 常见组合接入确定性三维广义凸窄相位；球-球使用精确闭式接触，EPA 退化保留显式诊断兜底；
- 旋转 Capsule 使用定向线段包围盒参与 broad phase，避免旋转胶囊被旧的竖直 AABB 漏检；
- 新增作者凸包 fixture：校验非共面顶点和三角索引，接入旋转 GJK/EPA、快照重放与 VSR 网格投影；空间具身测试达到 63/63。
- 新增 bounded `heightfield` fixture candidate：接收固定点毫米采样，接入静态/运动学 terrain 支撑、斜坡法线、Kernel lowering、VSR 网格、脚步支撑高度与确定性重放；空间具身测试达到 69/69、RSR 全量达到 203/203。Large World terrain adapter、完整接触流形、精确 terrain ray/shape cast 和目标设备证据仍保持 OPEN。
- 新增 candidate-only managed static body residency transition：按受管理标签对静态 RSR body 做 enter/exit/retain 切换，清除旧接触/支撑缓存，保留非管理动态运行态，并生成 `rsr.spatial-body-residency-transition.v0.1` 根；Spatial Embodiment 达到 70/70、RSR 全量达到 204/204。Large World stream policy、完整接触流形、精确 terrain ray/shape cast 和目标设备证据仍保持 OPEN。
- 新增 bounded fixed-point heightfield surface ray query：对已 lower 的 authored heightfield 做 bounded XZ clip、确定性 cell traversal 和双三角面求交，返回真实表面距离、交点与 upward normal；Spatial Embodiment 达到 71/71、RSR 全量达到 205/205。shape cast、完整接触流形、动态地形和目标设备证据仍保持 OPEN。
- 新增 bounded heightfield sphere/upright-capsule support probe：以九点 footprint support、固定步进和二分细化返回第一个 sampled contact；unsupported box/convex 类型 fail closed。exact swept shape cast、完整接触流形、动态地形和目标设备证据仍保持 OPEN。
- 新增 bounded heightfield sphere-vs-authored-triangle sweep：对 face/edge/vertex 候选做确定性固定点求交，并以 bounded projected cell window 和 `4096` cell 上限保护预算；Spatial Embodiment 达到 72/72、RSR 全量达到 206/206。upright capsule 仍是 support probe，exact capsule sweep、完整接触流形、动态地形和目标设备证据仍保持 OPEN。
- 新增 bounded upright-capsule-vs-authored-triangle sweep：对 capsule segment interior 与 triangle face/edge/vertex 候选求 earliest deterministic hit，并以 `4096` projected cell 上限保护预算；Spatial Embodiment 达到 73/73、RSR 全量达到 207/207。动态地形、完整接触流形和目标设备证据仍保持 OPEN。
- 新增 bounded heightfield contact manifold candidate：按 moving fixture footprint 采样最多四个 authored support points，共享 `manifoldId` 并保留独立 contact cache key，主点执行位置修正；Spatial Embodiment 达到 74/74、RSR 全量达到 208/208。连续完整 manifold、动态地形和目标设备证据仍保持 OPEN。
- 新增 bounded `patch-heightfield` runtime command：按有序整数样本和可选 expected heightfield root 执行静态/固定旋转运动学 terrain patch，输出可校验 mutation root，精确失效受影响 contact cache，并进入 snapshot/replay/causal delta；Spatial Embodiment 达到 76/76、RSR 全量达到 210/210。动态 body terrain、Large World deform stream、一等 RCL/Kernel command primitive、连续完整 manifold 和目标设备证据仍保持 OPEN。
- 新增 RCL physical command profile 与独立 `@taowind/rcl-rsr-spatial-bridge`：`rncs.spatial.command.<alias>.*` 经 native authority plan、`rcl.physical-command-profile.v0.1`、Kernel `rncs.entity-command-batch.v0.1` 和 root-bound lowering receipt 后进入既有 RSR/VSR candidate session，覆盖 bounded heightfield editing/destructible-surface patch 与 velocity correction/replay，并完成模拟/重放回归（RCL control plane 18/18、bridge 3/3、core command batch 1 条新增正负例）；一等 RCL spatial primitive、动态 terrain、Large World deform scheduler、连续完整 manifold 和目标设备证据仍保持 OPEN。
- 新增 Entity Kernel -> RSR -> VSR 绑定：typed state batch 确定性物化为 authority body/fixture，并沿同一快照生成带实体标签的 scene/frame/pixel roots；Aether bridge 集成回归 3/3。
- 新增 bounded Spatial Reality Partition：Aether bridge 从 RSR snapshot 推导 causal islands，接入 Network Observer Relevance、固定点 LWC sector/local 坐标和 VSR streaming/frame plan；`reality-cell.v0.1` 的 enter/exit、root 链和篡改拒绝集成回归 22/22。
- 新增 Cell 驱动的 VSR asset streaming resolution：`assetCatalog` 依赖闭包、resident/queued/deferred/evicted 预算和 active-cell request 进入 Reality Cell state/frame roots；Node/真实 Chromium 根一致，异步 payload loader 与 GPU upload 仍保持显式边界。

## 0.5.0-alpha.1

- 新增 Spatial Embodiment Fabric；
- 新增三维 Sphere、Box、Capsule 与三维查询；
- 新增 Grounded、角色移动、空中控制、跳跃和足步；
- 新增 Distance、Ball、Hinge、Motor 与 Break；
- 新增空间音频、身体区域触觉与 Sensory Root；
- 新增 v0.5 Snapshot、Replay、Recovery 与 RFE CausalDelta；
- 接通 VSR v0.4 三维场景、Frame Plan 和 Pixel Root；
- 新增 36 项机制测试，总回归 160/160；
- 保留 v0.1-v0.4 全兼容层。

## 0.4.0-alpha.1

- 新增 Temporal Experience Fabric；
- 新增统一 Tick、Experience Event 与 Binding Graph；
- 新增关键帧、状态机、Crossfade、动画层、Marker；
- 新增二维骨骼与双骨 IK；
- 新增振荡器、内联采样、ADSR、空间声像、总线、低通与延迟；
- 新增确定性立体声 WAV 渲染；
- 新增 Burst / Rate 粒子、曲线、力、碰撞和屏幕信号；
- 新增玩家、调试、审计和无障碍投影；
- 新增 v0.4 Snapshot、Replay、Recovery、Evidence Roots 与 RFE CausalDelta；
- 新增真实 PNG / WAV / MP4 演示；
- 新增 35 项机制测试，总回归 124/124；
- 保留 v0.1、v0.2、v0.3 兼容层。

## 0.3.0-alpha.1

- 新增 Embodied Dynamics Fabric；
- 新增旋转与角动量；
- 新增复合 Fixture 和五种凸形；
- 新增 GJK/EPA；
- 新增 Sweep-and-Prune；
- 新增四类关节、五类场、四类空间查询；
- 新增 warm start、约束岛、睡眠与断裂；
- 新增 v0.3 Snapshot、RFE Delta 与 VSR Bridge；
- 新增 30 项机制测试；
- 保留 v0.2 Constraint Physics 与 v0.1 Simulation 兼容层。

## 0.2.0-alpha.1

- 现实约束与因果响应物理；
- Box / Circle、均匀网格、距离约束、场、事件、RFE/VSR 适配。
