# TaoWind Founder Engineering Execution Plane v0.14 部署手册

## 1. 部署结构

```text
ChatGPT / MCP Client
        ↓ HTTPS
TaoWind Reality MCP（Vercel 控制面）
        ↓ Bearer Token
Developer Execution Worker（持久容器 / VM）
        ├─ 绑定项目工作区
        ├─ Git / Node / Python / JDK / Gradle / Android SDK
        ├─ RSR / VSR
        └─ GitHub / Vercel Provider Adapter
```

控制面负责工具发现、权威状态、候选计划、Founder 授权、Generation、收据与任务派发；Worker 负责文件、命令、构建、测试、Git、Provider 写入、RSR/VSR 和产物导出。

不要把完整 Android/GPU 构建塞进 Vercel Function。Vercel 仅承载控制面；耗时任务必须交给持久 Worker。

## 2. 第一步：部署执行 Worker

### 2.1 Docker

```bash
docker build \
  -f packages/operations/developer-execution-runtime/Dockerfile \
  -t taowind/developer-execution-runtime:0.1.0-alpha.1 .

docker run -d --name taowind-execution \
  -p 8790:8790 \
  -v /srv/taowind/workspace:/workspace \
  --env-file packages/operations/developer-execution-runtime/.env \
  taowind/developer-execution-runtime:0.1.0-alpha.1
```

也可使用：

- `packages/operations/developer-execution-runtime/deploy/render.yaml`
- `packages/operations/developer-execution-runtime/deploy/railway.json`
- 根目录 `docker-compose.execution.yml`

### 2.2 必填环境变量

```text
TAOWIND_EXECUTION_WORKER_TOKEN=<独立高熵令牌>
TAOWIND_EXECUTION_WORKSPACE_ROOT=/workspace
TAOWIND_EXECUTION_MODE=founder
TAOWIND_EXECUTION_ENABLE_SHELL=false
TAOWIND_EXECUTION_WORKER_PUBLIC_BASE_URL=https://worker.example.com
```

建议：

```text
TAOWIND_EXECUTION_TIMEOUT_MS=120000
TAOWIND_EXECUTION_EXPORT_TTL_MS=3600000
TAOWIND_EXECUTION_MAX_OUTPUT_BYTES=1000000
```

### 2.3 工具链

普通 RNCS/Node/Python Worker：

```text
Git + Node.js 20+ + npm + Python 3 + zip
```

Android Worker：

```text
JDK 17/21 + Android SDK + build-tools + platform-tools
项目必须包含 gradlew / gradlew.bat 与 Gradle Wrapper 文件
```

RSR/VSR 高质量渲染 Worker：

```text
项目所需原生依赖 + GPU 驱动/软件渲染后端 + 可写 output 目录
```

## 3. 第二步：部署 Vercel 控制面

项目根目录已提供：

- `server.mjs`：导出 Express 应用
- `vercel.json`：Vercel Function 配置
- `scripts/test-vercel-entry.mjs`：入口自验证

Vercel 环境变量：

```text
TAOWIND_MCP_PATH_TOKEN=<MCP路径令牌>
TAOWIND_MCP_PUBLIC_BASE_URL=https://你的项目.vercel.app
TAOWIND_MCP_ALLOWED_ORIGINS=https://chatgpt.com,https://chat.openai.com
TAOWIND_MCP_AUTHORITY_MODE=founder
TAOWIND_MCP_ENABLE_CANDIDATE_WRITES=true
TAOWIND_MCP_ENABLE_AUTHORITY_WRITES=true
TAOWIND_MCP_ENABLE_EXECUTION_TOOLS=true
TAOWIND_MCP_REQUIRE_STATE_PRECONDITIONS=true

TAOWIND_EXECUTION_PROVIDER=remote
TAOWIND_EXECUTION_MODE=founder
TAOWIND_EXECUTION_WORKER_URL=https://worker.example.com
TAOWIND_EXECUTION_WORKER_TOKEN=<与Worker一致>
TAOWIND_EXECUTION_REMOTE_TIMEOUT_MS=1800000
```

部署后，MCP URL 形如：

```text
https://你的项目.vercel.app/<TAOWIND_MCP_PATH_TOKEN>/mcp
```

## 4. 第三步：配置 GitHub Provider

在 Worker 而不是前端或项目源码中配置：

```text
TAOWIND_GITHUB_TOKEN=<fine-grained token>
TAOWIND_GITHUB_OWNER=xingxuling
TAOWIND_GITHUB_REPO=RNCS-Unified-Platform-
```

最小权限：

```text
Contents: Read and write
Pull requests: Read and write
Actions: Read and write（只有需要 workflow_dispatch 时开启）
Metadata: Read
```

令牌只绑定指定仓库。不要使用跨组织全权限经典 Token。

## 5. 第四步：配置 Vercel Provider

优先使用项目级 Deploy Hook：

```text
TAOWIND_VERCEL_DEPLOY_HOOK=<preview deploy hook>
```

需要查询部署状态或 API 模式时再配置：

```text
TAOWIND_VERCEL_TOKEN=
TAOWIND_VERCEL_PROJECT_ID=
TAOWIND_VERCEL_TEAM_ID=
```

## 6. 权限模式

| 模式 | 能力 |
|---|---|
| `disabled` | 不暴露工程工具 |
| `project` | 工作区文件与本地验证 |
| `founder` | 构建、Git、GitHub/Vercel、RSR/VSR、完整工作流 |
| `founder-unrestricted` | 在显式开启后额外暴露裸 Shell |

裸 Shell 还必须设置：

```text
TAOWIND_EXECUTION_ENABLE_SHELL=true
```

默认 Founder 模式使用 executable + argv，不经过 Shell 展开，已足够执行绝大多数工程任务。

## 7. 安全边界

1. Worker 只挂载专用项目目录，不挂载宿主 `/`、Docker socket 或 SSH 主目录。
2. 路径解析拒绝绝对路径、`..`、符号链接逃逸和常见密钥文件。
3. 项目子进程默认剥离 GitHub、Vercel、MCP、Worker 等令牌。
4. 外部写操作经专用 Provider Adapter，并要求权威状态前置条件。
5. 完整工作流先建分支和收据，失败执行本地 Git 回滚。
6. 导出目录时跳过密钥与符号链接，下载链接带时效令牌。

## 8. 上线验收

```bash
npm ci --ignore-scripts
npm run test:execution
npm run test:gateway
npm run test:mcp
npm run smoke:mcp
npm run test:integration
npm run health
npm run verify
npm run test:vercel-entry
```

远程 Worker 验收：

```bash
curl https://worker.example.com/healthz
```

随后通过 MCP 依次调用：

```text
developer_execution_status
workspace_list_files
execution_run_command
git_status
rsr_simulate
vsr_render
workspace_export_artifact
```

正式写入 GitHub/Vercel 前，必须带当前 `state_root` 与 `revision`。

## 9. 回滚

- 代码任务失败：工程工作流自动恢复任务前 Git 状态。
- GitHub：回退任务分支或建立修复提交，不建议覆盖主分支历史。
- Vercel：调用 Provider 回滚/重新部署上一有效版本。
- RNCS 权威状态：调用 `rncs_rollback_revision` 或 `rncs_replay_generation`，以新 Generation 留痕。
