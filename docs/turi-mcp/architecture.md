# TURI MCP v0.1 架构

## 目标

TURI 是统一协议入口，不是另一个低配聊天机器人。当前 MCP 宿主（例如 ChatGPT）负责高阶理解、研究综合、协议生成和纠错；TURI 负责任务分解、能力路由、权限边界和证据回执；UPDIA/WorldSeed 负责连续性、Native RGR 检索、经验候选和行动裁决；RCL 负责编译；RNCS Reality One Gateway 负责候选分支、仿真、AAF/RFE 权限和正式世界状态。

```text
Host GPT / MCP Client / stdio / Streamable HTTP
        │
        ▼
TURI server: host intervention + registry + policy + receipts
        │
        ├── RCL adapter → existing rcl-mcp-server.mjs JSON-RPC handler
        ├── RNCS adapter → existing RealityOneGateway / declared runtimes
        ├── UPDIA adapter → continuity + Native RGR evidence + experience candidates
        ├── GameBrain provider → bounded WorldSeed CLI subprocess
        ├── Ollama embedding → semantic retrieval (retained)
        └── Ollama generation → explicit offline fallback only
        │
        ▼
candidate branch / simulation / receipt / explicit authority / formal merge
```

TURI 不把自然语言偷偷当成 RCL；没有 `rclSource` 时，意图编译只能返回待补充源文件的提案。RNCS 候选执行必须验证编译、计划校验、候选创建、仿真、diff，并在前后读取正式 `state_root` 与 `revision`。

MCP 服务器不能在会话外主动唤醒宿主，因此缺少高阶贡献时返回 `REQUIRES_HOST_REASONING`、证据包、输出契约、权限上限和 `resumeToken`。宿主在当前会话中补齐后，再调用续跑工具。详见 [Host Intervention Protocol](./host-intervention-protocol.md)。

## 入口与资源

- `POST /mcp`：Streamable HTTP 初始化或已有 session 请求。
- `GET /mcp`：已初始化 session 的 server-to-client 请求。
- `DELETE /mcp`：关闭 session。
- `/health`、`/healthz`：健康状态。
- `/version`：协议和版本。
- `/mcp/manifest`：部署清单、权限模式、工具数量和注册表摘要。
- `turi://server/info`、`turi://capabilities/index`、`turi://schemas/capability-manifest`、状态/文档资源：只读发现。
- `turi://protocols/host-intervention`：宿主介入流程和 L0–L4 权限模型。

## 默认暴露面

注册表包含 150 个能力，默认 tools/list 暴露 103 个工具，其中包括三项宿主介入协议工具。其余低层兼容能力仍可通过 `turi_capability_search`、`turi_capability_describe` 和 `turi_capability_invoke` 按清单访问。所有调用都返回 TURI 统一 envelope 和 EvidenceReceipt。
