# Aetherworld RNCS Native Runtime Architecture v0.7

## 目标结构

```mermaid
flowchart TD
  U[用户目标] --> A[Aetherworld RNCS 世界驾驶舱]
  A --> G[Reality One Gateway]
  G --> C[Compilation Plan v0.2]
  C --> B[Reality Branch Candidate]
  B --> S[隔离模拟]
  S --> F[AAF 动作级裁决]
  F --> H[Reality Behavior 注册]
  H --> R[RFE 正式提交]
  R --> P[RSR v0.7 权威世界]
  P --> N[Network v0.2 双客户端]
  N --> V[VSR v0.6 时间投影]
  V --> A
  R --> T[Reality Studio / 历史 / 恢复]
```

## 权威边界

- **事实权威：** RFE Generation。
- **物理权威：** 当前 RFE 世界状态物化出的 RSR 权威帧。
- **多人权威：** Network 服务端持有的 RSR 权威状态。
- **表现权威：** 无；VSR 仅拥有 Presentation Root。
- **用户界面：** 观察、发起候选和提交批准，不拥有世界事实写权限。

## 故障与恢复

- 非法计划在候选创建前拒绝。
- 无模拟或无 AAF 批准的候选不能合并。
- 关键删除动作默认拒绝。
- 高风险物理、网络、合并和回滚要求 owner + security 双批准。
- 缺失网络基线使用既有完整快照恢复。
- 恢复不是覆写历史，而是创建带证据的新 Generation。
