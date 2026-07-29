# TaoWind Unified Reality Intelligence MCP v0.1

`@taowind/turi-mcp` 是 RCL、RNCS、UPDIA/WorldSeed、GameBrain 与既有 MCP 的统一入口。它把能力注册、权限、候选分支、证据回执、Artifact、Job 和能力生长放在同一个协议边界内。

当前版本是 `0.1.0-alpha.1`，交付状态是 `INTEGRATION_CANDIDATE`：本地 MCP SDK 的 stdio/Streamable HTTP、RCL 编译、RNCS 候选仿真和结构化成长闭环已经有自动化证据；尚未完成真实 ChatGPT Connector 或 MCP Inspector 会话，因此不能标记 `VERIFIED`。

## 快速运行

在仓库根目录执行：

```powershell
npm run smoke:turi-mcp
npm run test:turi-mcp
npm run serve:turi-mcp
```

默认 HTTP 地址是 `http://127.0.0.1:8797/mcp`，健康检查为 `/health`，清单为 `/mcp/manifest`。stdio 入口是：

```powershell
npm run serve:turi-mcp:stdio
```

部署到公网并连接 ChatGPT，请看 [`docs/turi-mcp/public-deployment.md`](../../../docs/turi-mcp/public-deployment.md)。

直接运行包内脚本时，工作目录应为仓库根目录，或显式设置 `TURI_REPO_ROOT`。

## 连接真实 UPDIA

当前桥接只调用 WorldSeed `src/updia/local-interaction/cli.mjs` 的真实 JSONL 方法。配置至少需要：

```powershell
$env:TURI_UPDIA_ROOT='C:\path\to\worldseed'
$env:TURI_UPDIA_ENTRY='C:\path\to\worldseed\src\updia\local-interaction\cli.mjs'
$env:TURI_UPDIA_STATE_DIR='C:\path\to\turi-updia-state'
$env:TURI_UPDIA_CHECKPOINT='C:\path\to\worldseed\evidence\updia\asil\living-subject-001-v5.3.checkpoint.json'
$env:TURI_UPDIA_KNOWLEDGE_STORE='C:\path\to\turi-updia-state\native-rgr\store.json'
$env:TURI_UPDIA_ENDPOINTS='http://127.0.0.1:11435'
```

首次启动必须提供有效 checkpoint；后续启动可复用 `TURI_UPDIA_STATE_DIR/checkpoint.json`。没有这些配置时，UPDIA 不会被伪造为已连接；相关工作流会返回限制或 `UPDIA_NOT_CONFIGURED`。

公网部署时，TURI 只负责 MCP 网关，UPDIA 应运行在受保护的独立 HTTP bridge 上：

```powershell
$env:TURI_UPDIA_BRIDGE_URL='https://<updia-bridge>.onrender.com'
$env:TURI_UPDIA_BRIDGE_TOKEN='<same-secret-as-the-bridge>'
$env:TURI_UPDIA_BRIDGE_ASYNC='true'
$env:TURI_UPDIA_BRIDGE_POLL_MS='1000'
$env:TURI_UPDIA_DEFAULT_MAX_TOKENS='512'
$env:TURI_UPDIA_DEFAULT_MODEL='qwen3.5:latest'
```

远程 `generate` 默认使用 `Prefer: respond-async` 提交任务，并轮询 bridge 的短请求状态。这避免本地模型长推理占用单个公网隧道请求；健康检查和 Native RGR 查询仍走同步短请求。bridge 不支持异步协议时，Adapter 会兼容原同步响应。

在 Vercel 等无状态函数平台设置 `TURI_MCP_STATELESS=true`。此模式为每个 POST 创建独立 MCP server/transport，不发放进程内 session id，避免连续请求命中不同 Lambda 后出现 `Session not found`。常驻 Node/Render 服务可保留默认 stateful 模式。

bridge 的 `/health` 可以公开用于平台探针，但 `/invoke` 必须使用 Bearer token。Vercel serverless 的临时文件系统不能承担 UPDIA checkpoint、Native RGR store 或 TURI receipts 的跨重启持久性；需要持久磁盘或外部持久化存储。

## 权限默认值

- `TURI_AUTHORITY_MODE=candidate`：允许候选分支、仿真、回执和受限本地工程流程。
- `authorized_write`、正式合并、回滚、记忆提交、能力晋升、外部 push/PR/deploy 默认关闭。
- 远程绑定必须启用 Bearer、Host/Origin allow-list；不要把 `TURI_ALLOW_PUBLIC_NO_AUTH` 用于生产。

## 能力生长

`turi_experience_record` 只接收结构化 ExperienceRecord，不接受原始聊天。典型顺序是：

```text
ExperienceRecord → Pattern Candidate → Generative Protocol Candidate
→ Capability Candidate → evaluation/regression/adversarial/rollback
→ Promotion Court review → explicit promote → lineage/version/rollback
```

没有自动晋升。示例见 `examples/turi-mcp/growth-dynamic-manga.mjs`，它明确把未接入 VSR 的动态漫画流程标成静态/适配器级证据。

## 目录

- `src/registry`：CapabilityManifest、查询和资源注册。
- `src/adapters`：复用既有 RCL MCP、Reality One Gateway 和 WorldSeed bridge。
- `src/workflows`：候选、意图、世界、研究、电影和工程工作流。
- `src/evidence`、`src/artifacts`、`src/jobs`：可追溯输出与长任务。
- `src/growth`：经验、模式、协议、候选能力、评价、晋升、谱系和回滚。
- `docs/turi-mcp`：架构、权限、适配器、接入与限制。
