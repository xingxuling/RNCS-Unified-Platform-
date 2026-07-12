# 物理系统命名边界反演报告 v0.2

## 1. 被反演的旧名称

传统“物理引擎”通常把边界锁定为：

```text
刚体 + 碰撞体 + 力 + 关节 + 求解器
```

这个名称默认了五个历史假设：

1. 物理只属于游戏对象；
2. 作用关系必须写死为模块类型；
3. 世界定律是隐藏的全局代码；
4. 求解器可以直接把结果写成现实；
5. 调试信息只是附属日志，不属于可验证现实。

## 2. 反演后的本质

用户真正需要的不是“让两个盒子撞起来”，而是：

> 在给定实体、场、材料关系、空间关系、约束、时间与主体命令的条件下，稳定地产生一组可解释、可恢复、可验证、但尚未越过权威边界的现实状态候选。

因此，RSR v0.2 将物理重新定义为：

# Reality Constraint & Causal Response Fabric
# 现实约束与因果响应织构

其最小闭环为：

```text
Embodiment 具身实体
+ Field 场
+ Material Relation 材质关系
+ Spatial Compatibility 空间相容性
+ Constraint 关系约束
+ Intent Command 主体命令
+ Deterministic Time 确定性时间
↓
Candidate State Transition 候选状态迁移
↓
Evidence + CausalDelta 证据与因果差异
↓
RFE Authority Commit 权威提交
```

## 3. 原语压缩

传统模块 | 新原语
---|---
RigidBody | Embodiment + Inertia
Collider | Spatial Shape + Compatibility Filter
Trigger | Sensor Relation
Force Volume | Field
Joint | Constraint Relation
Collision Matrix | Compatibility Policy
Physics Layer | Category/Mask Claim
CCD | Deterministic Microstep Policy
Island Solver | Constraint Connectivity Island
Physics Debugger | Observer-relative Evidence Projection
Network Physics Snapshot | Content-addressed Constraint Snapshot

## 4. v0.2 已实现的反演结果

- 静态、动态、运动学三种具身状态；
- Box 与 Circle 两类空间形状；
- 确定性均匀网格空间索引；
- Box/Box、Circle/Circle、Box/Circle 窄相；
- 碰撞层、掩码与组关系；
- 实体传感器与材质级 sensor-only 关系；
- 材质对级恢复系数、摩擦与禁用策略；
- 全局重力、均匀场、径向场、线性阻力场；
- 动态冲量、瞬时力、速度、传送和唤醒命令；
- 运动学实体；
- 距离约束、阻尼、刚度和断裂阈值；
- 确定性自适应微步，降低高速穿透；
- 约束岛构建；
- 接触、传感器、约束断裂事件与证据哈希；
- 快照、恢复和重放；
- provisional RFE Constraint CausalDelta；
- 玩家与调试者共享现实根的差异化 VSR 投影。

## 5. 没有伪装成已完成的边界

v0.2 仍是二维平移约束物理，不包含：

- 旋转刚体与角动量；
- Capsule、Convex Polygon、Chain、Heightfield；
- SAT/GJK/EPA；
- Revolute、Prismatic、Rope、Motor 等约束；
- 真正的 sweep TOI 连续碰撞；
- 软体、流体、布料和粒子连续介质；
- 3D 六自由度物理；
- SIMD、WASM、Rust/C++ 原生求解器；
- 分布式权威物理同步。

这些能力不应重新堆成彼此孤立的“功能模块”，而应继续作为 Shape Provider、Constraint Provider、Field Provider、Solver Policy 和 Evidence Adapter 扩展同一织构。

## 6. 反证标准

本反演若出现以下情况即失败：

1. 相同输入无法得到相同状态根；
2. 快照恢复后结果不同；
3. 微步策略仍允许测试中的高速实体穿透薄墙；
4. 传感器意外产生实体冲量；
5. 材质关系与碰撞过滤在不同命令顺序下不一致；
6. 物理结果绕过 RFE 直接成为权威现实；
7. 玩家与调试投影对应不同 simulationRoot；
8. 空间索引在稀疏世界无法明显压缩候选对。
