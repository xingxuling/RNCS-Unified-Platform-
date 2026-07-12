# RSR 现实约束与因果响应合约 v0.2

## 1. 权威边界

RSR 只计算候选演化，不拥有最终现实提交权：

```text
ConstraintPhysicsSnapshot
→ constraintSnapshotToCausalDelta(baseRealityRoot)
→ provisional = true
→ RFE Resolver / Authority Commit
```

## 2. 数值与时间

- 权威状态只使用安全整数；
- 默认固定点比例 `scale = 1000`；
- 固定时间步 `stepHz`；
- 高速连续实体按速度与最小形状特征计算确定性微步；
- `maxSubsteps` 是明确的预算边界；
- 不把宿主浮点时间写入状态根。

## 3. 稳定顺序

- 实体按 id 排序；
- 网格 key 排序；
- 候选对按 `minId|maxId` 排序；
- 命令按 id 排序；
- 约束按 id 排序；
- 接触、事件和约束岛稳定排序。

## 4. 空间相容性

关系是否进入窄相由以下结构共同决定：

```text
Collision Filter
+ Material Interaction
+ Shape Geometry
+ Sensor Policy
```

传感器关系产生事件和证据，但不得产生穿透修正或冲量。

## 5. 场

场不是写死在实体脚本中的外力，而是按标签或碰撞类别选择具身实体的环境关系：

- Uniform Field；
- Radial Field；
- Linear Drag Field。

场配置属于快照连续性的一部分，恢复后必须继续产生相同结果。

## 6. 约束

v0.2 的 Distance Constraint 表示两个具身实体之间需要维持的距离关系，并包含：

- restLength；
- stiffnessQ；
- dampingQ；
- breakImpulse；
- enabled / broken；
- lastImpulse。

约束断裂必须生成内容寻址证据事件。

## 7. 接触生命周期

接触按模拟 tick 聚合，支持：

- contact begin / persist / end；
- sensor begin / persist / end；
- constraint break。

接触记录包含首次或最后发生的 microstep，用于解释高速交互。

## 8. 快照连续性

快照必须包含：

- 实体及运行状态；
- 场；
- 材质交互；
- 约束及断裂状态；
- 接触与事件；
- 约束岛；
- 空间与微步诊断；
- contactRoot、constraintRoot、islandRoot、stateRoot。

## 9. 观察者投影

VSR 投影不得改变物理现实：

- 玩家视图隐藏速度、接触点、约束线和状态根；
- 调试视图显示这些信息；
- 两者必须共享相同 Reality Invariant。

## 10. 当前语义限制

- 形状不旋转；
- CCD 是确定性微步策略，不是解析 TOI；
- 接触求解器是参考实现，不是生产级高速原生求解器；
- diagnostics.candidatePairs 是求解迭代中的候选尝试数，而非唯一物体对数。
