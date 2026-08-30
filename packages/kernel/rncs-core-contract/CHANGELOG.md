# Changelog

## Unreleased

- 新增 `rncs.entity-kernel.v0.1`：typed Fragment Schema、Entity Composition、State Batch、Deferred Mutation Ledger 和快照恢复。
- 新增 `rncs.representation-transition.v0.1` 候选契约：跨表示 identity、authority、equivalence、resource decision 与可回滚候选态；保持 `NOT_COMMITTED`，不替代 RFE 权威提交。
- 新增 v0.3 Truth Layer Candidate：Canonical World Time、authority-receipted World Event、确定性 Event Log Replay 与 Fact World Tree schema/test；Subject Memory 保持独立。

## v0.1.0 — 2026-06-30

- 定义 Reality Transition Envelope。
- 冻结唯一上位连续性：RFE Generation。
- 实现 Python / Node 确定性哈希和生命周期。
- 实现 HNAC、ICAR、Living Artifact、VSR 适配器。
- 增加证据图、投影引用、宿主状态引用。
- 增加跨运行时一致性与篡改检测。
