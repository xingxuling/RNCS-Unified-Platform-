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
| `authorityLevel` | `L0` 检索、`L1` 宿主推理、`L2` 隔离执行、`L3` 持久候选、`L4` 正式/现实影响 |
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
- `turi_request_host_reasoning`：检索 UPDIA 证据并返回宿主任务、缺口、输出契约和签名续跑令牌。
- `turi_resume_with_host_contribution`：校验宿主贡献、证据引用与权限，再可选执行 RCL 编译和 RNCS 隔离仿真。
- `turi_record_assisted_experience`：记录区分 UPDIA/GPT/编译器/仿真/用户授权的 L3 经验候选，不自动提交正式记忆。
- `turi_world_task`：默认请求宿主认知，收到显式 source 后才执行 RNCS 候选；GameBrain 可选。
- `turi_cinematic_task`：电影/漫画 IR 适配器计划，可选已配置 VSR。
- `turi_research_task`：Native RGR 检索后默认交给宿主 GPT；只有 `reasoningMode=local` 才调用本地生成后备。
- `turi_engineering_task`：复用现有 Developer Execution Runtime；push、PR、deploy 仍由外部效果开关控制。
