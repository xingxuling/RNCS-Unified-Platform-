# TURI MCP 公网部署与 ChatGPT 连接

本仓库已经提供根目录 `render.yaml`。它创建一个 HTTPS Render Web Service，启动 TURI Streamable HTTP MCP。TURI 也可以作为 Vercel 的无状态公网网关，但真实 UPDIA 的 checkpoint、Native RGR store 和主体连续性必须运行在带持久化状态的独立 bridge 上；WorldSeed 分支已提供对应的 `render.yaml`。

```text
https://<render-service>.onrender.com/mcp
```

`/health` 和 `/healthz` 是健康检查端点；`/mcp/manifest` 用于确认版本、协议和工具数量。MCP `/mcp` 端点必须使用 Bearer token，默认保持 `candidate` 权限，正式写入、外部副作用和能力自动晋升均关闭。

## 0. 先部署真实 UPDIA bridge

打开 WorldSeed Blueprint：

```text
https://dashboard.render.com/blueprint/new?repo=https://github.com/xingxuling/zhinao/tree/codex/zhinao-rncs-visual-intent-v01
```

确认使用 `worldseed/render.yaml`。该服务使用持久磁盘保存 `/var/lib/updia`，创建前请在 Render 页面确认计划费用。只填写未提交到仓库的：

```text
UPDIA_BRIDGE_TOKEN=<至少 24 个字符的随机密钥>
```

服务上线后先验证：

```powershell
$updia = 'https://<updia-service>.onrender.com'
$token = '<同一个 UPDIA_BRIDGE_TOKEN>'
Invoke-RestMethod "$updia/health"
Invoke-RestMethod "$updia/invoke" -Method Post -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body (@{ id='smoke-1'; method='knowledge_verify'; params=@{} } | ConvertTo-Json -Depth 8)
```

`/health` 必须报告 `rootAvailable=true`、knowledge store 校验成功和稳定的 `identityRoot`/`lineageId`；没有 Ollama 时可以是 `degraded-no-models`，这不等于 bridge 失效。

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

## 4. 将 TURI 接到真实 UPDIA

在 TURI 的 Vercel Project Environment Variables 或 Render Service Environment 中配置 bridge：

```text
TURI_REASONING_MODE=host
TURI_HOST_RESUME_TTL_MS=7200000
TURI_HOST_RESUME_SECRET=<至少 32 个字符的随机值；只存在部署环境>
TURI_UPDIA_BRIDGE_URL=https://<updia-service>.onrender.com
TURI_UPDIA_BRIDGE_TOKEN=<same-secret-as-UPDIA_BRIDGE_TOKEN>
```

Vercel 还应设置 `TURI_MCP_STATELESS=true`。Host Intervention 的续跑状态全部封装在签名令牌中，因此可以跨 Lambda 请求恢复；签名密钥必须在所有实例一致，不能在进程启动时随机生成。

本机 research-only Quick Tunnel 只适合验收链。此时使用 WorldSeed watchdog 发布的短时发现文档，避免把临时 tunnel 域名写死：

```text
TURI_UPDIA_BRIDGE_DISCOVERY_URL=https://gist.githubusercontent.com/<owner>/<gist-id>/raw/updia-bridge-route.json
TURI_UPDIA_BRIDGE_DISCOVERY_FILE=updia-bridge-route.json
TURI_UPDIA_BRIDGE_ALLOWED_HOST_SUFFIXES=.trycloudflare.com
TURI_UPDIA_BRIDGE_DISCOVERY_CACHE_MS=30000
TURI_UPDIA_BRIDGE_DISCOVERY_CACHE_BUST_MS=60000
```

发现文档无权提升 bridge 权限；TURI 会校验 HTTPS、域名 allow-list 和有效期。电脑、Ollama 或 watchdog 离线后，路由在有效期结束时失败关闭。

不要把 bridge token、模型服务密钥或真实数据提交到仓库。远程模型 endpoint 必须使用 TLS、访问控制和出站 allow-list。若 TURI 既未配置静态 bridge URL，也未配置发现 URL，`turi_health` 会明确返回 `updia.status=not_configured`。

Vercel 可以承担 ChatGPT 连接的 TURI `/mcp` URL，但不要把本机 `TURI_UPDIA_ROOT` 路径填入 Vercel；serverless 临时文件系统不提供 UPDIA 状态连续性。默认 `turi_research_task` 只经 bridge 检索证据并交还当前 ChatGPT 推理，不会让 Vercel 等待本地生成式 Ollama。

## 5. 持久化与生产限制

根目录 `render.yaml` 默认使用 Render Free 计划，并将 `TURI_DATA_DIR` 放在 `/tmp/turi-mcp`。这是无持久化的 TURI 网关配置；实例会休眠，重启/重新部署后 Job、Artifact、EvidenceReceipt 和成长记录可能丢失。WorldSeed 的 bridge Blueprint 使用带磁盘的计划保存 UPDIA checkpoint 与 Native RGR store。

要让“能力生长”具备跨重启的持久性，应升级到有持久磁盘的 Render 计划，并把 `TURI_DATA_DIR` 与 `TURI_UPDIA_STATE_DIR` 放到挂载盘；还应配置备份、日志保留、限流和域名。当前默认不打开 `authorized` 或外部副作用，ChatGPT 接通后仍需要人类确认高风险操作。

## 6. 完成标准

公网部署只有在真实 ChatGPT/MCP 会话完成后才标记为 `VERIFIED`。需要保存：

- `/health`、`/mcp/manifest` 和 `initialize` 的结果。
- `tools/list` 与 manifest 工具数量一致。
- 一个只读调用和一个 candidate 调用的原始结果及 EvidenceReceipt。
- 未带 Bearer、错误 Origin 和缺少 authority token 时的拒绝结果。

在这些外部会话证据产生前，仓库状态仍是 `INTEGRATION_CANDIDATE`，不是已完成的 ChatGPT 生产验收。
