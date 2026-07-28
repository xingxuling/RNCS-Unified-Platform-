# TURI MCP 公网部署与 ChatGPT 连接

本仓库已经提供根目录 `render.yaml`。它创建一个 HTTPS Render Web Service，启动 TURI Streamable HTTP MCP：

```text
https://<render-service>.onrender.com/mcp
```

`/health` 和 `/healthz` 是健康检查端点；`/mcp/manifest` 用于确认版本、协议和工具数量。MCP `/mcp` 端点必须使用 Bearer token，默认保持 `candidate` 权限，正式写入、外部副作用和能力自动晋升均关闭。

## 1. 推送并创建 Render 服务

当前分支应先推送到 GitHub：

```powershell
git push -u origin feat/turi-unified-rcl-rncs-updia-mcp-v0.1
```

打开 Render Blueprint 创建页：

```text
https://dashboard.render.com/blueprint/new?repo=https://github.com/xingxuling/RNCS-Unified-Platform-/tree/feat/turi-unified-rcl-rncs-updia-mcp-v0.1
```

页面会预选分支 `feat/turi-unified-rcl-rncs-updia-mcp-v0.1`；确认根目录的 `render.yaml`，然后创建服务。Render 会要求填写未提交到仓库的：

```text
TURI_BEARER_TOKEN=<至少 24 个字符的随机密钥>
```

PowerShell 可生成一个临时密钥：

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

不要把这个 token 写进 Git、README、聊天记录或模型提示词。Render 创建完成后，在服务页复制真实的 `onrender.com` 域名；服务名或域名可能因账号已有资源而不同，不要手工假定 URL。

## 2. 先做公网 smoke

将下面的占位符替换为 Render 服务域名和刚设置的 token：

```powershell
$base = 'https://<render-service>.onrender.com'
$token = '<同一个 Bearer token>'
Invoke-RestMethod "$base/health"
Invoke-RestMethod "$base/mcp/manifest"
Invoke-RestMethod "$base/mcp" -Method Post -Headers @{ Authorization = "Bearer $token"; Accept = 'application/json, text/event-stream' } -ContentType 'application/json' -Body (@{
  jsonrpc = '2.0'
  id = 1
  method = 'initialize'
  params = @{
    protocolVersion = '2025-06-18'
    capabilities = @{}
    clientInfo = @{ name = 'public-smoke'; version = '0.1.0' }
  }
} | ConvertTo-Json -Depth 8)
```

成功标准：`/health` 返回 HTTP 200，`/mcp/manifest` 返回 `transport=streamable-http`，初始化响应包含 `mcp-session-id`，并且未带 Bearer 的 `/mcp` 请求返回 401。

## 3. 在 ChatGPT 中添加

在 ChatGPT 的设置中打开 Apps / Connectors；如果当前工作区提供 Developer mode / custom MCP app，创建一个自定义 MCP app：

1. Endpoint 填 `https://<render-service>.onrender.com/mcp`。
2. Authentication 选择 Bearer，并填入 Render 中的同一个 secret。
3. 执行 Scan tools / Refresh tools。
4. 先调用 `turi_server_info`、`turi_health`、`turi_capability_search` 这类只读工具，再测试 candidate 工具。

ChatGPT 的入口名称和可用权限取决于账号/工作区；OpenAI 的 Developer mode 文档说明了自定义 MCP app 的 endpoint、认证、扫描工具和测试流程。当前服务使用 Streamable HTTP，因此不能填 stdio 命令或本机 `127.0.0.1` 地址。

## 4. UPDIA 的公网边界

仅部署当前根仓库会让 TURI/RCL/RNCS 能力在线，但不会凭空把本机的 WorldSeed/UPDIA 目录带到 Render。Render 环境没有本机路径 `TURI_UPDIA_ROOT`、`TURI_UPDIA_ENTRY` 和 checkpoint，因此 UPDIA 工具会明确返回 `UPDIA_NOT_CONFIGURED`，不会伪造健康状态。

要启用真实 UPDIA，需要把经过审查的 WorldSeed runtime 一起部署到同一个服务/镜像，或把它作为受保护的独立内网服务，并在 Render 环境变量中配置：

```text
TURI_UPDIA_ROOT=/app/worldseed
TURI_UPDIA_ENTRY=/app/worldseed/src/updia/local-interaction/cli.mjs
TURI_UPDIA_STATE_DIR=/var/lib/turi-updia
TURI_UPDIA_CHECKPOINT=/app/worldseed/evidence/updia/asil/living-subject-001-v5.3.checkpoint.json
TURI_UPDIA_ENDPOINTS=<受保护的模型服务地址>
```

不要把 checkpoint、模型服务密钥或真实数据提交到仓库。远程模型 endpoint 必须使用 TLS、访问控制和出站 allow-list。

## 5. 持久化与生产限制

`render.yaml` 默认使用 Render Free 计划，并将 `TURI_DATA_DIR` 放在 `/tmp/turi-mcp`。这是为了提供不需要先购买资源的可运行公网入口，但它有两个明确限制：实例会休眠，重启/重新部署后 Job、Artifact、EvidenceReceipt、成长记录和 checkpoint 状态可能丢失。

要让“能力生长”具备跨重启的持久性，应升级到有持久磁盘的 Render 计划，并把 `TURI_DATA_DIR` 与 `TURI_UPDIA_STATE_DIR` 放到挂载盘；还应配置备份、日志保留、限流和域名。当前默认不打开 `authorized` 或外部副作用，ChatGPT 接通后仍需要人类确认高风险操作。

## 6. 完成标准

公网部署只有在真实 ChatGPT/MCP 会话完成后才标记为 `VERIFIED`。需要保存：

- `/health`、`/mcp/manifest` 和 `initialize` 的结果。
- `tools/list` 与 manifest 工具数量一致。
- 一个只读调用和一个 candidate 调用的原始结果及 EvidenceReceipt。
- 未带 Bearer、错误 Origin 和缺少 authority token 时的拒绝结果。

在这些外部会话证据产生前，仓库状态仍是 `INTEGRATION_CANDIDATE`，不是已完成的 ChatGPT 生产验收。
