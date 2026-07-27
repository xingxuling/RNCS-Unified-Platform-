# Changelog

## Unreleased

- Sphere、Box、Capsule 常见组合接入确定性三维广义凸窄相位；球-球使用精确闭式接触，EPA 退化保留显式诊断兜底；
- 旋转 Capsule 使用定向线段包围盒参与 broad phase，避免旋转胶囊被旧的竖直 AABB 漏检；
- 新增旋转胶囊、球-胶囊、球-球和旋转胶囊 broad phase 回归，空间具身测试达到 59/59。

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
