# TaoWind Reality MCP v0.3.0-alpha.1

本版把 v0.2 的“创始人权威控制平面”升级为 **创始人工程执行平面**：ChatGPT 不只能够编译、模拟、授权、合并和回滚候选现实，还能够通过第15个运行时 `rncs.developer-execution` 修改真实项目、运行测试与构建、提交 Git、调用 GitHub/Vercel Provider，并执行真实 RSR 模拟和 VSR 渲染。

## 两层部署

```text
ChatGPT
  ↓
TaoWind Reality MCP（Vercel/Render/Railway：权威、工具目录、任务调度、收据）
  ↓ Bearer Token
Developer Execution Worker（持久容器/VM：源码、Git、Node/Python/Gradle/Android、RSR/VSR）
```

Vercel 适合控制平面，不适合持久工作区、长时间 Gradle 或 GPU 渲染。因此线上部署应把 `TAOWIND_EXECUTION_PROVIDER=remote`，指向持久 Worker。

## 工具数量

- 默认 Founder：51个工具（含 RCL 原生 authority-plan 编译、提交与行为执行工具）。
- Founder Unrestricted：52个工具，额外开放 `execution_run_shell`。
- 运行时：15个，第15个是 Developer Execution Runtime。

工程工具覆盖：工作区列出/读取/写入/精确补丁/删除/产物导出、命令与构建 Profile、Git 状态/Diff/分支/Commit/Push、GitHub PR和Actions触发、Vercel部署与状态查询、真实 RSR/VSR、完整自动工程工作流。

## 权限模式

| 模式 | 效果 |
|---|---|
| `disabled` | 不暴露工程执行工具 |
| `project` | 项目工作区与允许命令 |
| `founder` | 项目能力＋Provider写入；默认模式 |
| `founder-unrestricted` | 允许额外 executable，并可在显式开关后开放 Break-glass Shell |

即使是 Founder Unrestricted，也应只运行在专用容器/VM中；不要把宿主根目录或其他项目目录挂载进去。

## MCP 配置

```bash
TAOWIND_MCP_AUTHORITY_MODE=founder
TAOWIND_MCP_ENABLE_AUTHORITY_WRITES=true
TAOWIND_MCP_ENABLE_EXECUTION_TOOLS=true
TAOWIND_EXECUTION_MODE=founder
TAOWIND_EXECUTION_PROVIDER=remote
TAOWIND_EXECUTION_WORKER_URL=https://worker.example
TAOWIND_EXECUTION_WORKER_TOKEN=<独立随机令牌>
```

完整变量见 `.env.example`，Worker变量见 `packages/operations/developer-execution-runtime/.env.example`。

## 真实工程闭环

`rncs_engineering_workflow` 执行：

```text
检查干净工作区 → 创建任务分支 → 修改源码 → 运行声明测试/构建
→ 生成 Diff → Commit → 可选 Push/PR/Vercel部署
→ 成功时登记权威工程收据并形成新 Generation
→ 失败时 reset/clean/切回原分支并删除失败任务分支
```

外部写操作要求最新 `expected_state_root` 与 `expected_revision`，防止旧上下文覆盖新状态。

## 本地验收

```bash
npm ci --ignore-scripts
npm run test:execution
npm run test:gateway
npm run test:mcp
npm run smoke:mcp
```

RSR/VSR证据由 Developer Execution Runtime 直接调用实际 CLI 生成。

## 部署

- MCP Docker：`packages/integration/taowind-reality-mcp/Dockerfile`
- Worker Docker：`packages/operations/developer-execution-runtime/Dockerfile`
- 双服务：`docker-compose.execution.yml`
- GitHub Actions：`.github/workflows/taowind-execution-ci.yml`

源码推送并重新部署前，当前线上 MCP 不会自动获得新工具。
