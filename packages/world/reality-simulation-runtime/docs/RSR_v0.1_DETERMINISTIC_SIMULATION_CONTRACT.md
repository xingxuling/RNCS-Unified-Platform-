# RSR v0.1 确定性模拟合约

## 1. 合约目标

对于相同的：

- 世界配置；
- 创世配置哈希；
- 固定步频率；
- 命令集合与命令 id；
- 起始快照；
- 步数；

运行时必须产生相同的：

- 刚体顺序；
- 刚体位置与速度；
- 接触顺序；
- 碰撞事件；
- 接触根；
- 状态根。

## 2. 数值边界

v0.1 使用安全整数定点表示，不将浮点数写入权威模拟状态。

```text
real = fixed / scale
默认 scale = 1000
```

积分使用截断整数除法：

```text
velocity += acceleration / stepHz
position += velocity / stepHz
```

该策略牺牲部分精度，以换取可预测、可序列化和可重放的参考语义。

## 3. 稳定顺序

- 刚体按 id 排序；
- 碰撞对按 `minId|maxId` 排序；
- 同 tick 命令按 command id 排序；
- 事件按事件 id 排序；
- 快照 bodies、contacts、events 均稳定排序。

## 4. 权威边界

RSR 不拥有现实提交权。

```text
SimulationSnapshot
→ snapshotToCausalDelta(baseRealityRoot)
→ provisional = true
→ RFE Resolver / Authority Commit
```

任何直接把模拟状态写成 RFE 已提交 Generation 的实现都违反本合约。

## 5. 恢复边界

恢复必须继承原始 `configHash`，不能用检查点中的动态位置重新计算创世身份。恢复后继续相同步数，最终状态根必须与不中断运行相同。

## 6. 反证条件

出现以下任一情况，本合约失败：

1. 相同输入产生不同状态根；
2. 恢复后的最终根与原运行不同；
3. 命令数组顺序改变结果；
4. 碰撞产生无界能量；
5. 模拟绕过 RFE 权威直接提交现实；
6. 玩家与调试投影对应不同 simulationRoot。
