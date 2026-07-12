# Developer Execution Runtime v0.1.0-alpha.1

TaoWind Reality MCP 的持久工程执行节点。它把“计划、授权、Generation”连接到真实源码、命令、Git、构建、GitHub、Vercel、RSR、VSR与可下载构建产物。

## 边界

- 文件工具只能访问绑定工作区，拒绝 `..`、绝对路径、符号链接逃逸和常见密钥文件。
- 普通命令使用 executable + argv，不经过 shell 展开。
- 子进程默认不会继承 GitHub、Vercel、MCP、Worker 等令牌环境变量。
- 裸 Shell 仅在 `founder-unrestricted` 且 `TAOWIND_EXECUTION_ENABLE_SHELL=true` 时可用。
- 真正的安全隔离边界是专用容器或专用 VM；不要把宿主机根目录挂载为工作区。

## 启动

```bash
export TAOWIND_EXECUTION_WORKER_TOKEN="$(node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))")"
export TAOWIND_EXECUTION_WORKSPACE_ROOT="$PWD"
npm run serve:execution-worker
```

健康检查：`GET /healthz`。执行接口：`POST /v1/invoke`，必须使用 Bearer Token。`exportArtifact` 会为 APK、ZIP、PNG 和报告生成限时高熵下载地址；目录导出会跳过密钥文件与符号链接。

## 构建能力

内置 Profile：Node 测试/构建、Python 测试、Gradle 测试、Android Debug/Release、RNCS/MCP、RSR、VSR。Android Profile要求绑定项目自带 Gradle Wrapper，并且 Worker 已安装 JDK 与 Android SDK。

## 远程部署

- Dockerfile：`packages/operations/developer-execution-runtime/Dockerfile`
- Render：`deploy/render.yaml`
- Railway：`deploy/railway.json`
- MCP＋Worker 本地组合：`docker-compose.execution.yml`
