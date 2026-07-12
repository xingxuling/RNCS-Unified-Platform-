# Bridge v0.1 → v0.2 Migration

## 契约变化

| 项目 | v0.1 | v0.2 |
|---|---|---|
| Compilation Plan | 描述性 JSON | 版本化、Schema 校验、可执行契约 |
| 世界修改 | 无正式执行 | 候选分支 → 模拟 → AAF → RFE |
| Behavior | 计划字段 | 正式 BehaviorRuntime 程序 |
| Gateway | 无 Provider | `rncs.aetherworld-native` |
| Aetherworld | 前端状态模型 | HTTP 调用 RNCS 运行时 |
| 多人/VSR | 未连接 | 复用 Network v0.2 与 VSR v0.6 |

## 兼容策略

- `migrateCompilationPlan` 支持 `rncs.compilation-plan.v0.1` → v0.2。
- RSR、VSR、Network 协议原样复用，不迁移其数据格式。
- 旧 Bridge TypeScript 入口已由 ESM 正式运行时替换；包导出保持 `@taowind/aether-rncs-bridge`。

## 回退

1. 代码层回退到基线提交 `a340a283`。
2. RFE 数据层通过 AAF 双批准恢复到目标 Generation。
3. 删除 Gateway 的 `aetherworld-native.runtime.json` 即可停止发现新 Provider，不影响其他 13 个运行时。
