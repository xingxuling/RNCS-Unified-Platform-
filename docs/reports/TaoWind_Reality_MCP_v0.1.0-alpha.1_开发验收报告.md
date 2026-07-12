# TaoWind Reality MCP v0.1.0-alpha.1 开发验收报告

**母工程版本：** `RNCS + Aetherworld Unified 0.12.0-alpha.1`  
**基础版本：** `0.11.0-alpha.1`  
**生成时间：** `2026-07-03T11:12:59Z`

## 1. 交付目标

把 ChatGPT 网页版可连接的远程 MCP 入口接入 Reality One Gateway，使模型能够读取 RNCS/Aetherworld 权威资料、发现运行时并执行候选现实工作流，同时保持 AAF/RFE 的正式权威边界。

## 2. 实际实现

- 基于 `@modelcontextprotocol/sdk@1.29.0` 的 Streamable HTTP MCP 服务。
- 有状态会话、JSON 响应、会话 TTL 和优雅关闭。
- Reality One Gateway 14 个运行时的动态发现与健康检查。
- OpenAI 兼容 `search` / `fetch`，仅索引文档、Manifest 与验收材料。
- 中文、CSL、IAL 到 Compilation Plan 的编译与验证。
- 候选分支创建、读取、差异、隔离模拟与组合工作流。
- Gateway 调用收据和 Generation 历史读取。
- Dockerfile、Render 与 Railway 部署模板。

## 3. 权威边界

第一版只开放只读和候选现实能力。以下动作没有注册为 MCP 工具：

- AAF 授权；
- 候选现实合并；
- RFE 回滚或重放；
- Git 主分支写入；
- 发布；
- 任意 Shell；
- 任意文件路径读取。

候选组合工作流会在执行前后读取正式 `revision` 与 `state_root`；任一发生变化即返回 `AUTHORITY_INVARIANT_VIOLATION`。

## 4. 安全结构

- Origin 白名单；
- 公网 Host 白名单强制要求；
- 私有 MCP 路径令牌；
- 可选静态 Bearer；
- 默认不信任 `X-Forwarded-For`，仅显式配置可信代理后使用；
- 按客户端地址限流；
- 会话过期清理；
- 文档索引排除 `.env`、密钥、签名、Token 等敏感命名；
- 文件只以不透明 Artifact ID 读取；
- HTTP Artifact 路由位于受保护的 MCP 私有路径下。

## 5. 工具清单

共 15 个：

`taowind_server_info`、`search`、`fetch`、`rncs_list_runtimes`、`rncs_runtime_health`、`rncs_world_status`、`rncs_compile_plan`、`rncs_validate_plan`、`rncs_create_candidate`、`rncs_get_candidate`、`rncs_diff_candidate`、`rncs_simulate_candidate`、`rncs_candidate_workflow`、`rncs_history`、`rncs_invocation_receipts`。

## 6. 验收证据

| 验收项 | 结果 |
|---|---:|
| MCP 专项测试 | `13/13 PASS` |
| MCP 端到端 Smoke | `PASS` |
| Reality One Gateway | `13/13 PASS` |
| Aetherworld Native Bridge | `14/14 PASS` |
| 根级统一集成 | `19/19 PASS` |
| 动态运行时健康 | `14/14 healthy` |
| 发布结构验证 | `PASS`，29 个模块，无 banned/duplicate |
| npm 安装审计 | `0 vulnerabilities` |
| Node 语法检查 | `PASS` |
| npm pack dry-run | `PASS`，15 个包文件（加入 manifest 后为 16） |

候选现实 Smoke 结果：

- 工具数：15；
- Native Runtime：`ok`；
- Simulation：`completed`；
- 正式状态：`authority_unchanged=true`。

## 7. 母工程兼容修复

清洁安装发现旧内部版本约束会错误访问外部 npm 仓库。已将工作区内部依赖统一为本地 workspace 解析，并重新生成 `package-lock.json`。随后 `npm install --ignore-scripts` 成功，审计为 0 漏洞。

## 8. 未完成边界

- 尚未实现 MCP OAuth 2.1 授权服务器；
- 当前环境没有 Render/Railway 凭据，因此没有伪造“已上线”的 HTTPS 地址；
- 当前环境没有 Docker 命令，Dockerfile 已完成但未在这里构建镜像；
- 母工程历史全量 `npm test` 超过 600 秒执行窗口；在窗口内未出现测试失败。MCP 直接依赖链、Gateway、Native Bridge 与根级集成已分别完整通过。

## 9. 验收结论

`TaoWind Reality MCP v0.1.0-alpha.1` 已达到：**可本地运行、可远程部署、可由标准 MCP 客户端调用、可读取权威状态、可制造和模拟候选现实、不可越权写入正式世界。**
