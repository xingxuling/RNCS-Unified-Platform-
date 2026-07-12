# VSR v0.1.0-alpha.8 现实模拟分支架构

## 1. 闭环

```text
RFE 权威现实快照
→ RSR 确定性推进
→ 多个 Simulation Branch
→ 差异、风险与因果证据
→ VSR 观察者／设备投影
→ 主体选择候选未来
→ RFE v1.0 provisional 宪法提交请求
→ 防篡改持久日志
```

VSR 不把模拟结果自动当作真实现实。模拟只提出候选未来，RFE 仍保留最终权威。

## 2. 核心模块

### simulation-core

- 固定时间步二维物理；
- 快照、恢复、碰撞事件；
- 状态根、接触根和 CausalDelta；
- alpha.8 将安全证据升级为规范化 SHA-256。

### simulation-branch

- 从同一快照创建多个候选未来；
- 命令按绝对 tick 和 id 确定性执行；
- 生成 Branch Root、Command Root、Event Root；
- 计算位移、速度、碰撞和风险指标；
- 比较任意两个分支；
- 生成 provisional 分支选择凭证。

### simulation-branch-vsr

- 同一 Branch Set 生成 viewer、planner、auditor 三类视图；
- 支持桌面、手机、平板和 XR；
- 不同视图共享同一个 Set Root 和 Reality Invariant；
- 可单独执行逻辑投影，或生成软件 PNG。

### adapter-rsr

- 将分支选择、最终快照和 CausalDelta 绑定到 RFE v1.0 Constitution；
- 输出 `rfe.vsr-simulation-commit-request.v1.0`；
- 保持 `provisional: true`；
- 提供 SHA-256 链式持久日志、幂等写入和篡改检测。

## 3. 分支对象

```text
VSRSimulationBranchPlan
├── baseRealityRoot
├── steps
├── commands[]
├── createdBy
└── logicalTime

VSRSimulationBranchResult
├── baseSimulationRoot
├── finalSnapshot
├── commandRoot
├── eventRoot
├── causalDelta
├── metrics
└── branchRoot
```

## 4. 权威边界

以下对象均不是已提交现实：

- Simulation Branch；
- Branch Selection；
- CausalDelta；
- RFE Simulation Commit Request。

只有 RFE 宪法层完成法定提交后，候选变化才可成为权威现实。

## 5. 性能基线

测试环境：Node.js v22.16.0、Linux、单线程 TypeScript 参考实现。

| 场景 | 中位数 | P95 |
|---|---:|---:|
| 3 分支 × 每分支 90 step | 21.22 ms | 26.41 ms |
| 3 观察者 × 3 设备逻辑投影 | 6.78 ms | 10.38 ms |
| 单观察者 × 单桌面软件 PNG | 451.69 ms | — |

逻辑投影与像素光栅分开计量，避免把软件 PNG 成本误算成模拟或权限投影成本。
