# Temporal Experience Fabric 正式合约 v0.4

## 1. 合约目的

定义 RSR v0.4 中动画、音频和特效共享的确定性时间、事件、状态、快照和证据边界。

## 2. 权威边界

1. 本运行时只生成体验状态和候选因果，不自行提交 RFE 权威现实。
2. 输入事件必须具有稳定 `id`、`tick` 与 `type`。
3. 同一配置、种子、初始快照和事件序列必须产生相同 `stateRoot`。
4. 动画、音频计划和特效必须共享同一 `tickHz`。
5. 观察者投影可以隐藏或增强信息，但不得改变 `stateRoot`。

## 3. 时间合约

- 时间单位为整数 Tick；
- 动画局部时间以 `Q=1,000,000` 定点倍率保存；
- 状态机在每 Tick 的顺序为：输入事件 → 绑定动作 → 动画推进 → Marker → 特效推进 → 快照；
- 离线音频通过 `tick / tickHz` 映射到采样帧；
- 粒子模拟采用固定 Tick，不使用墙钟时间。

## 4. 动画合约

- Clip 是属性轨迹和 Marker 的持续对象；
- State 引用 Clip，不复制轨迹；
- Transition 可由参数、Trigger、Exit Time 和优先级决定；
- Crossfade 必须确定性；
- Layer 支持 Override 与 Additive；
- Skeleton Pose 是动画属性的派生投影；
- IK 是 Pose 后处理，不修改权威输入 Clip。

## 5. 音频合约

- Audio Cue 是语义事件到一个或多个 Voice 的映射；
- Audio Plan 是可哈希计划，WAV 是设备无关参考投影；
- Voice 支持优先级与最大数量，超限必须记录 dropped 数量；
- 总线处理顺序必须稳定；
- 噪声由事件、Voice 和采样索引生成确定性序列；
- 实时设备输出属于未来 Host Adapter，不纳入本版确定性根。

## 6. 特效合约

- Effect Instance 必须保留源事件、开始 Tick、位置、强度和发射计数；
- Particle ID 必须由实例、Emitter 和序号稳定生成；
- Burst 与 Rate 发射顺序必须稳定；
- 粒子曲线使用归一化 `tQ`；
- Screen Signal 是体验投影提示，不是现实状态；
- 调试投影可显示内部状态，玩家投影不可泄漏调试节点。

## 7. 快照合约

`rsr.experience-snapshot.v0.4` 至少包含：

- Tick 和配置哈希；
- 参数与动画层状态；
- 求值后的属性；
- 骨骼 Pose；
- Effect Instance 和 Particle；
- Screen Signal；
- Audio Cue Event；
- 语义事件日志；
- Diagnostics；
- Animation / Skeleton / Audio / Effect / Event / State Roots。

恢复后继续运行，必须与不中断运行收敛到相同根。

## 8. RFE 候选合约

输出格式：

```text
rfe.experience-causal-delta.v0.4
```

必须：

- `provisional=true`；
- 引用 `baseRealityRoot`；
- 包含候选 `stateRoot`；
- 包含多模态 Evidence Roots；
- 不声称已被 RFE 提交。

## 9. 兼容性

v0.4 保留：

- VSR 基线；
- RSR v0.1 Simulation；
- RSR v0.2 Constraint Physics；
- RSR v0.3 Embodied Dynamics。
