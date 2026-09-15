# Changelog

## v0.3.0

- 删除v0.2式内嵌运行时设计。
- 新增Runtime Manifest、版本选择、依赖排序和循环检测。
- 新增Node Module与stdio两种传输。
- 新增统一调用回执、超时、幂等缓存和调用日志。
- 动态接入LAF、CNP、AAF、RFE与ICAR五个独立包。
- 完成CNP→ICAR→AAF→RFE原生编排。
- 新增HTTP控制入口和中文离线工作台。
- 修复调用完成后超时定时器未清理造成的进程延迟。

## v0.3 Agent Capability Contract v0.1 candidate

- 新增 `AgentCapabilityRegistry`，把 runtime/action 映射为 AI 可理解的语义能力目录。
- 新增 `listCapabilities`、`describeCapability`、`matchCapabilities`、`invokeCapability`。
- 新增 capability readiness、effect、authority scope 预检与 unstable 显式 opt-in。
- 新增 capability invocation/result/preflight receipts，并保留原 Gateway invocation receipt。
- 新增 `/api/capabilities*` HTTP API 与 CLI 命令。
- 新增 Agent Capability JSON Schema、RCL 约束规格与 7 项能力层自动化测试。
- 既有 Gateway 17/17 测试与 Network Runtime 20/20 测试保持通过。
