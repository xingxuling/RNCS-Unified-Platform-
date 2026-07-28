# Capability Registry 与 Manifest

每个能力必须具备：

| 字段 | 含义 |
| --- | --- |
| `capabilityId` | 稳定、可搜索的正式 ID |
| `domain` | `rcl`、`rncs`、`updia`、`research`、`cinematic`、`engineering`、`gamebrain` 等 |
| `inputSchema` / `outputSchema` | 结构化输入输出契约 |
| `implementation` | `native`、`adapter`、`provider` 或 `evidence_only` |
| `evidenceLevel` | `verified`、`executed`、`static`、`declared` |
| `executionMode` | `read_only`、`candidate`、`authorized_write`、`external_effect` |
| `rollbackSupport` | `none`、`logical`、`reality_branch`、`git` 等 |
| `requiredAuthority` | 所需权限能力 |
| `compatibilityAliases` | 既有 MCP/CLI 名称的兼容别名 |

实现级别的意义：

- `native`：TURI 自己完成注册、回执、Job 或成长状态机。
- `adapter`：调用既有真实模块，不复制其权威状态。
- `provider`：调用外部配置的 GameBrain/VSR/RSR/执行进程，必须声明配置和限制。
- `evidence_only`：只有边界、格式或缺失能力的证据，调用会明确失败，不返回伪造结果。

增加动态能力时必须通过 `registerDynamic`，再次注册同 ID 会失败，且缺少四个安全字段会失败。成长引擎只允许把经过评价和人工 Promotion Court 批准的受限候选加入动态注册表。

## 重要工作流

- `turi_intent_to_reality`：意图分析 → 可选 RCL 编译 → 候选执行。
- `turi_candidate_execute`：RNCS compile → validate → createCandidate → simulate → diff → formal state unchanged receipt。
- `turi_world_task`：可选 UPDIA 认知、RNCS 候选、可选 GameBrain。
- `turi_cinematic_task`：电影/漫画 IR 适配器计划，可选已配置 VSR。
- `turi_research_task`：Native RGR 检索、UPDIA 受限生成、可选 RNCS 实验。
- `turi_engineering_task`：复用现有 Developer Execution Runtime；push、PR、deploy 仍由外部效果开关控制。
