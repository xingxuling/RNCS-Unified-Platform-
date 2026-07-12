# @vsr/shared-coordination

VSR Alpha.7 的共享现实协调层。

## 提交模型

```text
VSR Interaction Commit Receipt
→ Shared Commit Candidate
→ Base Cursor / Root 验证
→ Authority / Observer / Device / Proposal 撤权检查
→ 变量目标冲突检查
→ direct 或 disjoint-rebase
→ SHA-256 Shared Event
→ Replica Sync Batch
```

## 核心类

- `VSRSharedRealityCoordinator`
- `VSRSharedRealityReplica`
- `VSRSharedRealityHttpServer`

## 真实性边界

当前 Coordinator 是单权威内存实现，适合协议、产品和机制验证。它尚未实现多 Coordinator 共识、磁盘 WAL、TLS、数字签名或 RFE C12 quorum。
