# MCP Inspector / ChatGPT 连接指南

## MCP Inspector

启动服务：

```powershell
$env:TURI_AUTH_MODE='none'
$env:TURI_AUTHORITY_MODE='candidate'
npm run serve:turi-mcp
```

在 MCP Inspector 中连接：

```text
http://127.0.0.1:8797/mcp
```

先执行 `tools/list`、`resources/list`，再调用 `turi_server_info`、`turi_health`、`turi_capability_search`，最后用 `turi_candidate_execute` 验证候选不变量。不要直接调用 merge/rollback/promotion；先确认 authority 配置和人类审批。

## ChatGPT Connector

ChatGPT 侧应使用可访问的 HTTPS Streamable HTTP URL，并在连接配置中提供 Bearer token。TURI 本地默认只绑定 loopback，不能直接被云端 ChatGPT 访问。

公网部署请按 [`public-deployment.md`](./public-deployment.md) 使用 Render Blueprint；不要把本地 authority token 放进模型提示词。

正式接入完成后必须保留：

1. ChatGPT `initialize` 成功响应。
2. `tools/list` 与 `/mcp/manifest` 工具数量/版本一致。
3. 一个只读调用和一个 candidate 调用的原始结果及 EvidenceReceipt。
4. 未带 Bearer、错误 Origin、无 authority token 的拒绝结果。

当前仓库没有这些外部会话证据，因此交付状态仍为 `INTEGRATION_CANDIDATE`，不是 `VERIFIED`。
