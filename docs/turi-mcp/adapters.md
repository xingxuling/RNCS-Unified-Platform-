# RCL / RNCS / UPDIA 适配边界

## RCL

`src/adapters/rcl.mjs` 直接复用 `packages/languages/reality-computation-language/src/rcl-mcp-server.mjs` 的 `listRclMcpTools` 与 `handleRclMcpMessage`。因此 RCL 的 compile、run、disassemble、search、selfhost/bootstrap 不产生第二套编译器。TURI 额外把真实输出归一为 `turi.compiled-reality-plan.v0.1`，但不改变原始结果。

## RNCS

`src/adapters/rncs.mjs` 使用 `@taowind/reality-one-gateway`，并按已发现 runtime manifest 调用 action。当前真实核心 runtime 是 `rncs.aetherworld-native`，可发现 `health`、`compile`、`validatePlan`、`createCandidate`、`getCandidate`、`diffCandidate`、`simulateCandidate`、`authorizeCandidate`、`rejectCandidate`、`mergeCandidate`、`history`、`worldStatus`、`rollbackGeneration`、`replayGeneration` 等。RCL control runtime 的 `compileExecute` / `compileAuthorityPlan` 只有在 runtime 声明时才可调用。

候选流程不会改变正式 world。正式 merge、rollback、replay 和 behavior 权限由 TURI policy 与现有 AAF/RFE 共同约束。

## UPDIA / WorldSeed

`src/adapters/updia.mjs` 有两种真实传输模式：本地模式通过受限 Node 子进程向配置的 `local-interaction/cli.mjs` 发送单次 JSONL 请求；公网模式通过 Bearer 保护的 `/invoke` HTTP bridge 转发同一组 `handleBridgeRequest` 方法。首次启动必须提供有效 bootstrap checkpoint；后续启动可以使用 state dir 内持久化的 `checkpoint.json`。缺少 checkpoint 时 TURI 报 `UPDIA_NOT_CONFIGURED`，不会把 entry/state-dir 存在误报成 ready。Native RGR store 通过 `TURI_UPDIA_KNOWLEDGE_STORE` 或 bridge 的 `UPDIA_KNOWLEDGE_STORE` 显式加载；bridge 首次启动会从配置的真实仓库文档建立 store，之后只复用已验证 store。当前真实方法是：

`health`、`models`、`generate`、`status`、`set_model`、`adjudicate_action`、`record_execution`、`feedback`、`writebacks`、`accept`、`reject`、`knowledge_query`、`knowledge_explain`、`knowledge_conflicts`、`knowledge_verify`、`knowledge_writeback`、`shutdown`。

因此 `subject_create`、generic observe/event ingest、独立 world model、goal arbitration、perception 和独立 organ scheduling 没有被虚构为可执行能力；它们在注册表中保留 `evidence_only/static` 边界。`subject_close` 只映射真实 `shutdown`，Native RGR 写回先走 candidate，commit 需要 authority token。没有可用 Ollama/兼容模型时，root 与 RGR 仍可健康运行，但认知状态会明确返回 `degraded-no-models`，研究工作流会返回 `grounded_degraded`，不会把检索事实冒充成模型推理。

## GameBrain / RSR / VSR

GameBrain 是配置好的 WorldSeed `src/cli.mjs simulate` 子进程，seed 路径必须位于配置根目录，ticks 有上限并输出到 TURI artifact 目录。RSR/VSR 只有对应 Developer Execution Runtime provider 配置后才会运行；没有 provider 时返回 limitation，不宣称已完成渲染或性能验证。
