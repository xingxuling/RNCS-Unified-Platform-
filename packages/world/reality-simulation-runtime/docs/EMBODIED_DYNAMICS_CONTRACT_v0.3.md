# Embodied Dynamics Contract v0.3

## 1. 合约身份

- World: `rsr.embodied-dynamics-world.v0.3`
- Snapshot: `rsr.embodied-dynamics-snapshot.v0.3`
- RFE Delta: `rfe.embodied-dynamics-causal-delta.v0.3`
- Runtime: `0.3.0-alpha.1`

## 2. 确定性边界

1. 输入配置、命令、步频和运行时版本相同；
2. ID 排序、候选对排序、关节排序固定；
3. 持久状态以整数位置、整数速度、turn-fixed 角度量化；
4. 每个微步后提交量化状态；
5. Snapshot 必须包含恢复所需的求解参数、材质、交互、接触缓存来源；
6. Replay 与 Recovery 必须获得相同 `stateRoot`；
7. 查询会改变 `queryRoot`，不会改变物理 `bodyRoot`。

## 3. 权威边界

本运行时只生成 provisional causal delta。它无权直接覆盖 RFE 权威现实。

```text
Simulation Snapshot
→ Causal Delta
→ Authority Resolver
→ Commit / Reject / Branch
→ Evidence
```

## 4. 接触与事件

- 接触、传感器、关节断裂、睡眠/唤醒均缓冲至 step 完成后输出；
- 事件不得在求解过程中重入修改世界；
- 事件证据哈希由稳定语义对象计算；
- Sensor 产生关系事件，但不产生实体冲量。

## 5. 数值单位

- 位置/线速度：`positionScale` 固定点，默认 1000；
- 角度：一整圈 = `1_000_000`；
- 角速度：turn-fixed / second；
- 比例、密度、摩擦、恢复等：Q = `1_000_000`；
- 中间几何求解使用 JS Number，微步末量化回整数状态。

## 6. 兼容性

v0.3 新增独立 `embodied-dynamics` 包，不删除 v0.2 `constraint-physics`。旧世界仍由 v0.2 兼容内核运行。
