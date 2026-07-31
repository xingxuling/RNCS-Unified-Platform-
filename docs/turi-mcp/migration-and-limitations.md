# 迁移与已知限制

## 从既有 MCP 迁移

既有 `@taowind/taowind-reality-mcp` 与 RCL MCP 不删除、不改权威状态。客户端可先使用 TURI 的兼容别名，例如 `rcl_status`、`rncs_status`、`rncs_create_candidate`、`updia_health`；新集成应优先使用 `turi_*` 高层工作流和 `turi_capability_invoke`。

旧工具名没有全部默认出现在 `tools/list`，这是有意的工具面收敛；通过 `turi_capability_search` 可发现完整注册表，通过清单中的 `compatibilityAliases` 迁移。

## 当前限制

- UPDIA 本地模式必须显式配置 WorldSeed entry/state dir；首次启动还必须提供有效 bootstrap checkpoint，未配置时不做假健康。公网模式应配置 `TURI_UPDIA_BRIDGE_URL` 和 `TURI_UPDIA_BRIDGE_TOKEN`，不能把本机路径当作云端 UPDIA。
- Vercel 可承载无状态 TURI MCP 网关，但其 serverless 临时文件系统不保证 checkpoint、Native RGR store、receipt 和 session 跨重启持久化；完整 UPDIA 链需要带持久磁盘的 bridge 或外部持久化存储。
- Vercel 上的 `turi_record_assisted_experience` 只能保证当前函数实例内的 L3 候选写入；要跨重启积累联合经验，必须接入持久存储。它不会自动调用 `updia_memory_commit`。
- 当前 UPDIA bridge 没有 generic subject-create、observe、world-model、goal-arbitration 等方法；对应能力为 `evidence_only`。
- RCL cinematic/game-rule/asset protocol 是适配器计划，未宣称原生 RCL 语法覆盖。
- GameBrain、RSR、VSR 是可选 provider；未配置不等于已执行。
- TURI v0.1 仍是 alpha；没有速率限制中间件、分布式 session store 或生产级密钥托管。
- 自动化测试不替代每次部署后的真实 ChatGPT Connector/MCP Inspector 复验，也不替代人类对正式 merge、渲染质量和性能的验收。
- 动态漫画成长示例只验证结构化经验→候选→评价→人工晋升→直接复用→lineage/rollback 的静态适配器环；不能单独证明生产系统“越用越强”。
