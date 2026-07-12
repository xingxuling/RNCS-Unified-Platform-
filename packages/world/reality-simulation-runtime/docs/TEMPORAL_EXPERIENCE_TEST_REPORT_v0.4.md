# Temporal Experience Fabric v0.4 测试报告

## 1. 结果摘要

| 层 | 结果 |
|---|---:|
| VSR | 29/29 PASS |
| RSR v0.1 Simulation | 11/11 PASS |
| RSR v0.2 Constraint Physics | 19/19 PASS |
| RSR v0.3 Embodied Dynamics | 30/30 PASS |
| RSR v0.4 Temporal Experience | 35/35 PASS |
| **总计** | **124/124 PASS** |

## 2. v0.4 覆盖范围

### 配置与时间

- 合法配置验证；
- 缺失 Clip 拒绝；
- 输入事件按 ID 规范排序；
- 共享 Tick。

### 动画

- 关键帧采样；
- Loop；
- Trigger Transition；
- Crossfade 完成；
- Exit Time 回到 Idle；
- Marker 事件；
- Additive Layer；
- 骨骼 Pose；
- 双骨 IK。

### 音频

- Marker 驱动 Audio Cue；
- Cooldown；
- RIFF/WAVE 文件头；
- 确定性 WAV Hash；
- Voice Budget 与 Dropped 诊断；
- 内联 PCM Sample。

### 特效

- Burst 数量；
- 事件位置；
- 重力；
- Size Curve；
- 生命周期；
- Screen Signal；
- Max Instance；
- 种子差异。

### 连续性与投影

- Replay 根一致；
- Snapshot Recovery 收敛；
- provisional RFE CausalDelta；
- Player / Debugger 共享 invariant；
- Player 隐藏调试节点；
- Accessibility 显示声学字幕；
- 真实 PNG；
- 综合演示同时产生动画、音频和特效。

## 3. 综合演示验收

输出目录：`outputs/experience-fabric-verify/`

包含：

- 30 帧 PNG；
- `final-player.png`；
- `final-debugger.png`；
- `final-accessibility.png`；
- `experience-audio.wav`；
- `experience-showcase.mp4`；
- Snapshot 与 CausalDelta；
- `demo-evidence.json`。

验收条件：

- Final / Replay / Recovered State Root 相同；
- 多观察者验证为 `ok=true`；
- WAV 大于 44 字节；
- MP4 真实生成；
- Audio Cue Event 不少于 4；
- 兼容层无回归。

## 4. 基准

本次环境 Node.js v22.16.0：

| 场景 | 结果 |
|---|---:|
| 标准综合场景 | 11.18 ms/Tick |
| 64 Animator | 14.42 ms/Tick |
| 2000 粒子 | 195.04 ms/Tick |
| 96 Voice / 2 秒 / 24 kHz | 305.29 ms |

## 5. 反证

2000 粒子的纯 TypeScript 对象数组明显不满足实时预算。VSR 的逐节点 CPU 软件光栅在高清、多粒子和阴影组合下同样超时。因此：

- 本版可证明语义、确定性和闭环；
- 不声称已经达到 Niagara、Unity VFX Graph、FMOD 或 Wwise 的工业吞吐；
- 下一阶段必须推进 SoA、对象池、WASM/SIMD、GPU 粒子和实时音频后端。
