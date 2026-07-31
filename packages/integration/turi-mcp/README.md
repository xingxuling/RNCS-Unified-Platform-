# TaoWind Unified Reality Intelligence MCP v0.1

`@taowind/turi-mcp` 是 RCL、RNCS、UPDIA/WorldSeed、GameBrain 与既有 MCP 的统一入口。它把能力注册、权限、候选分支、证据回执、Artifact、Job 和能力生长放在同一个协议边界内。

当前版本是 `0.1.0-alpha.2`。默认架构是“宿主 GPT 主推理，TURI 主调度，UPDIA 主连续性与证据，RCL 主编译，RNCS 主仿真”；生成式 Ollama 只保留为明确启用的离线后备，embedding 检索不受影响。

高阶任务的默认闭环是：

```text
turi_request_host_reasoning
→ 当前宿主读取 UPDIA 证据包并生成结构化贡献
→ turi_resume_with_host_contribution
→ RCL 编译 / RNCS 隔离仿真
→ turi_record_assisted_experience（L3 候选，不自动提交正式记忆）
```

完整协议和 L0–L4 权限边界见 [`docs/turi-mcp/host-intervention-protocol.md`](../../../docs/turi-mcp/host-intervention-protocol.md)。

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
$env:TURI_REASONING_MODE='host'
$env:TURI_HOST_RESUME_SECRET='<至少 32 个字符的随机签名密钥>'
```

`TURI_UPDIA_DEFAULT_MODEL` 仅用于 `reasoningMode=local` 的离线/人工指定调用，不再处于 `turi_research_task`、`turi_intent_compile` 或 `turi_world_task` 的默认路径。

若使用会轮换地址的 research-only Quick Tunnel，不要把临时域名写死。改用短时有效、由 watchdog 更新的发现文档：

```powershell
$env:TURI_UPDIA_BRIDGE_DISCOVERY_URL='https://gist.githubusercontent.com/<owner>/<gist-id>/raw/updia-bridge-route.json'
$env:TURI_UPDIA_BRIDGE_DISCOVERY_FILE='updia-bridge-route.json'
$env:TURI_UPDIA_BRIDGE_ALLOWED_HOST_SUFFIXES='.trycloudflare.com'
$env:TURI_UPDIA_BRIDGE_DISCOVERY_CACHE_BUST_MS='60000'
```

发现文档必须使用 `taowind.updia-bridge-route.v0.1`，包含 HTTPS `url`、`updatedAt` 与 `expiresAt`。过期、格式错误或不在 allow-list 的目标会被拒绝。

明确启用 `reasoningMode=local` 后，远程 `generate` 使用 bridge 的异步/流式兼容路径；健康检查和 Native RGR 查询仍走同步短请求。这条路径只用于离线后备或人工指定，不是 ChatGPT 联合模式的主推理路径。

在 Vercel 等无状态函数平台设置 `TURI_MCP_STATELESS=true`。此模式为每个 POST 创建独立 MCP server/transport，不发放进程内 session id，避免连续请求命中不同 Lambda 后出现 `Session not found`。常驻 Node/Render 服务可保留默认 stateful 模式。

ChatGPT 应优先调用 `turi_research_task`。它同步检索 UPDIA 证据后立即返回 `REQUIRES_HOST_REASONING` 和 HMAC 签名的 `resumeToken`，不会等待本地生成模型。`updia_research_start` / `updia_research_status` 只保留给明确的离线本地模式。

研究输出契约要求每个问题都包含已知事实及 claim/source id、推断、可证伪假设、最小实验、未知项和优先级。续跑时会拒绝未知 evidence id、缺段输出和越权动作；请求 compile/simulate 时必须提交显式 RCL/RNCS source。

私有 bridge 的 `/health` 可以公开用于平台探针，但 `/invoke` 应使用 Bearer token；受限的公开研究 bridge 必须在服务端只允许只读研究方法并拒绝 mutation。Vercel serverless 的临时文件系统不能承担 UPDIA checkpoint、Native RGR store 或 TURI receipts 的跨重启持久性；需要持久磁盘或外部持久化存储。

## 权限默认值

- `TURI_AUTHORITY_MODE=candidate`：允许候选分支、仿真、回执和受限本地工程流程。
- L0 检索、L1 宿主推理、L2 编译/隔离仿真不要求逐次请示；`resumeToken` 的权限上限固定为 L2。
- 联合经验只写入 L3 候选；正式 UPDIA 记忆提交、能力晋升和正式状态修改仍走独立授权。
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
- `src/host`：宿主介入、签名续跑令牌、证据/契约/权限负控。
- `src/evidence`、`src/artifacts`、`src/jobs`：可追溯输出与长任务。
- `src/growth`：经验、模式、协议、候选能力、评价、晋升、谱系和回滚。
- `docs/turi-mcp`：架构、权限、适配器、接入与限制。
