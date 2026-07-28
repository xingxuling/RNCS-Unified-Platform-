# 能力生长与自我进化闭环

TURI 不把调用日志直接当学习结果。可复用经验必须是结构化 `ExperienceRecord`，并且至少能引用 EvidenceReceipt。原始聊天、未验证对话和未结构化模型输出会被拒绝。

## 闭环

```text
记录经验
  → 多案例 pattern mining
  → GenerativeProtocolCandidate
  → CapabilityCandidate（仍是 candidate）
  → success/failure/control/regression/adversarial/budget/security/rollback evaluation
  → Promotion Court request/review
  → human-approved promote
  → lineage/version/compare/restore
```

可用工具别名包括：

- `turi_experience_record/get/search/compare`
- `turi_pattern_mine/status/evidence`
- `turi_protocol_candidate_create/get/compile/diff/reject`
- `turi_capability_candidate_build/get/invoke/diff`
- `turi_capability_evaluate/regression_test/adversarial_test/benchmark`
- `turi_capability_promotion_request/review/promote/reject`
- `turi_capability_lineage/versions/compare_versions/restore_version`
- `turi_capability_health/conflict_scan/deprecate/archive/prune`
- `turi_learning_report`

晋升至少要求多个来源经验、可回归评价、失败边界、安全测试、回滚测试和显式人工批准。缺少 security/rollback cases、determinism、receipt coverage 或 regression 清零时，评价只能是 `RESTRICT_SCOPE` / `RETRY`。正式能力注册会记录版本与源经验/模式/协议/评价 lineage；回滚只恢复保留版本，不删除历史。

`examples/turi-mcp/growth-dynamic-manga.mjs` 和 `tests/growth.test.mjs` 验证的是适配器/静态动态漫画闭环。它们不能替代真实 VSR、模型、多次长时运行或人工接受测试，所以不能单凭它们宣布“越用越强”。
