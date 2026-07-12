# 具身动力学命名边界反演报告 v0.3

## 1. 旧名称隐含的边界

传统“物理引擎”通常默认：

- 对象是刚体；
- 物理是位置、速度和碰撞；
- 关节、场、传感器、查询分别属于不同模块；
- 引擎直接修改世界状态；
- 调试信息和玩家画面是同一份状态的附属显示；
- 重放只要求视觉相似，不要求状态根一致。

这些边界适合历史上的游戏运行时，却把“现实如何允许变化”缩成了“刚体如何移动”。

## 2. 反演问题

```text
物理引擎
→ 为什么对象必须先被叫作刚体？
→ 碰撞为什么是核心，而不是相容性约束的一种？
→ 关节、材料、场、传感器、查询为什么分散？
→ 模拟为什么有权直接成为权威事实？
→ 同一现实为什么不能按玩家、调试者、审计者分别投影？
```

## 3. 新定义

> **具身动力学织构（Embodied Dynamics Fabric）**：维护具身主体、空间形态、材料关系、约束关系、外部场和观察查询，并在确定性时间中求解可接受的候选状态迁移。

最小闭环：

```text
具身主体
+ 形态
+ 材料关系
+ 运动状态
+ 约束关系
+ 场
+ 主体命令
+ 时间预算
↓
宽相候选
↓
凸形相容性求解
↓
接触/关节顺序冲量
↓
候选状态 + 事件 + Evidence Root
↓
RFE 权威提交或拒绝
```

## 4. 原语压缩

| 传统模块 | v0.3 统一原语 |
|---|---|
| 刚体 | Embodied Body |
| Collider / Fixture | Shape-bearing Fixture |
| 材质 | Material Relation |
| 碰撞 | Spatial Compatibility Constraint |
| 关节 | Persistent Relation Constraint |
| 力场 | Environmental Causal Field |
| Trigger | Non-resolving Sensor Relation |
| Raycast / Query | Observer Spatial Question |
| CCD | Temporal Compatibility Budget |
| 存档 | Quantized Reality Snapshot |
| 回放 | Root-equivalent Causal Replay |
| 物理回调 | Buffered Evidence Event |

## 5. 现有能力

- 二维平移与旋转刚体；
- 自动质量与转动惯量；
- 复合 Fixture；
- Circle、Box、Convex Polygon、Capsule、Segment；
- GJK 凸形重叠检测与 EPA 穿透求解；
- Sweep-and-Prune / Uniform Grid 宽相；
- 顺序冲量、摩擦、恢复、滚动阻力；
- 接触缓存与 warm start；
- Distance、Revolute、Prismatic、Weld 关系约束；
- 关节限位、电机、断裂；
- Uniform、Radial、Drag、Vortex、Buoyancy 场；
- AABB、Point、Ray、Circle Shape Cast；
- 自适应确定性微步；
- 约束岛与睡眠；
- Contact/Sensor/Joint/Body 生命周期事件；
- Snapshot、Replay、Recovery、Root；
- RFE provisional Causal Delta；
- 玩家/调试者多观察者投影。

## 6. 反证与边界

本版仍不是生产级 Box2D/PhysX 替代品：

- 接触流形当前每对形态主要保留一个求解点；
- EPA/GJK 是确定性参考实现，尚未经过海量退化几何模糊测试；
- CCD 仍以自适应微步和离线 Shape Cast 为主，不是完整解析 TOI 管线；
- 查询尚未接入持久动态 AABB 树；
- 纯 TypeScript 求解器在 280 动态实体压力场景约为 6–7 tick/s；
- 尚无多线程、SIMD、WASM/Rust 原生后端；
- 没有软体、布料、流体、破坏、车辆、3D 六自由度。

## 7. 下一反演方向

```text
碰撞检测
→ 持续空间关系图

单机求解
→ 分区权威因果求解

单精度/固定点二选一
→ 可证明的数值策略协商

单一物理精度
→ 观察者与任务相对精度预算

物理世界
→ 多尺度现实域及兼容性解析器
```

## 8. 锚点

物理不是让物体“看起来像现实”。

物理是：

> 在给定主体、关系、规则、时间和计算预算下，生成一个可验证、可恢复、可提交的现实候选。
