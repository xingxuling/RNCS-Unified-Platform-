# RSR v0.5 三维具身契约

## 状态层级

- `RFE Generation`：权威现实代际；
- `RSR Spatial Snapshot`：某一 Tick 的候选具身模拟；
- `VSR Frame Plan`：观察者与设备相对投影；
- `Audio/Haptic Event`：感知计划，不自动成为权威事实。

## 确定性

相同配置、命令顺序和 Tick 数必须产生相同 `stateRoot`。快照恢复后继续运行，必须与不中断运行收敛。

## 安全边界

RSR 只生成候选运动和感知事件。高风险身体、机器人或神经设备动作必须在外部经过 AAF 和设备安全层批准。
