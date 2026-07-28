# TURI MCP v0.1 架构

## 目标

TURI 是统一协议入口，不是第三个互不兼容的执行壳。RCL 继续负责现实计算语言与编译；RNCS Reality One Gateway 继续负责运行时发现、候选分支、仿真、AAF/RFE 权限和正式世界状态；UPDIA/WorldSeed 继续负责 LocalInteractionRoot、模型调用、Native RGR 检索/写回和行动裁决；TURI 负责把这些边界编译成一致的 CapabilityManifest、工作流和 EvidenceReceipt。

```text
MCP Client / stdio / Streamable HTTP
        │
        ▼
TURI server: registry + policy + jobs + receipts + resources
        │
        ├── RCL adapter → existing rcl-mcp-server.mjs JSON-RPC handler
        ├── RNCS adapter → existing RealityOneGateway / declared runtimes
        ├── UPDIA adapter → WorldSeed LocalInteractionRoot JSONL bridge
        ├── GameBrain provider → bounded WorldSeed CLI subprocess
        └── Developer adapter → declared engineering runtime actions
        │
        ▼
candidate branch / simulation / receipt / explicit authority / formal merge
```

TURI 不把自然语言偷偷当成 RCL；没有 `rclSource` 时，意图编译只能返回待补充源文件的提案。RNCS 候选执行必须验证编译、计划校验、候选创建、仿真、diff，并在前后读取正式 `state_root` 与 `revision`。

## 入口与资源

- `POST /mcp`：Streamable HTTP 初始化或已有 session 请求。
- `GET /mcp`：已初始化 session 的 server-to-client 请求。
- `DELETE /mcp`：关闭 session。
- `/health`、`/healthz`：健康状态。
- `/version`：协议和版本。
- `/mcp/manifest`：部署清单、权限模式、工具数量和注册表摘要。
- `turi://server/info`、`turi://capabilities/index`、`turi://schemas/capability-manifest`、状态/文档资源：只读发现。

## 默认暴露面

注册表包含 147 个能力，但默认 tools/list 暴露 98 个高价值工具。其余低层兼容能力仍可通过 `turi_capability_search`、`turi_capability_describe` 和 `turi_capability_invoke` 按清单访问，避免无限制工具面。所有调用都返回 TURI 统一 envelope 和 EvidenceReceipt。
