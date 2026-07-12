# TaoWind Execution Plane v0.14 验证矩阵

| 验收对象 | 验证方式 | 证据 | 结果 |
|---|---|---|---|
| 工作区路径隔离 | 绝对路径、父目录、符号链接、密钥路径负向测试 | `evidence/v0.14/developer-execution-tests.log` | PASS |
| 文件读写与补丁 | 创建、读取、精确替换、删除 | 同上 | PASS |
| 受控命令 | executable+argv、超时、输出收据 | 同上 | PASS |
| 子进程密钥隔离 | Provider/MCP Token 不继承 | 同上 | PASS |
| Break-glass Shell | 双条件开关测试 | 同上 | PASS |
| Git | 分支、状态、差异、提交 | 同上 | PASS |
| GitHub/Vercel 适配器 | Mock Provider 请求与错误处理 | 同上 | PASS |
| 自动工作流 | 成功提交与失败自动回滚 | 同上 | PASS |
| 产物导出 | 文件与过滤目录 ZIP、下载令牌 | 同上 | PASS |
| 远程 Worker | Bearer 鉴权、调用、健康检查、下载 | 同上 | PASS |
| Gateway | 第15运行时注册与动作路由 | `evidence/v0.14/gateway-tests.log` | PASS |
| MCP 工具层 | 48默认工具、49 Break-glass 工具与参数校验 | `evidence/v0.14/mcp-tests.log` | PASS |
| MCP Smoke | 15运行时、权威状态推进、执行工具发现 | `evidence/v0.14/mcp-smoke.log` | PASS |
| 母工程集成 | 统一集成测试 | `evidence/v0.14/root-integration-tests.log` | PASS |
| 运行时健康 | 15个运行时健康检查 | `evidence/v0.14/rncs-health.log` | PASS |
| Vercel入口 | 根 Express 导出与健康请求 | `evidence/v0.14/vercel-entry-test.log` | PASS |
| RSR | 母工程真实模拟与状态/碰撞/投影产物 | `evidence/v0.14/rsr-vsr-execution.json` | PASS |
| VSR | 母工程真实 PNG 渲染 | `output/execution-plane-vsr-v014.png` | PASS |
| 依赖安全 | npm audit | `evidence/v0.14/npm-audit.json` | 0 vulnerabilities |
| Android Profile | Gradle Wrapper 参数、Debug Profile、CI模板 | 执行层测试＋GitHub Actions | PASS（Profile） |
| Android真实 APK | 需要带 Wrapper 的 Android 项目与 SDK Worker | 当前母工程不含可构建 Android App | NOT RUN |
| 线上 GitHub/Vercel 写入 | 需要部署后凭证与 Provider 环境 | 本地源码不保存凭证 | NOT RUN |
