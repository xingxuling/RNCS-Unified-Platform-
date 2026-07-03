# TaoWind Reality MCP v0.1.0-alpha.1

## 定位

把 ChatGPT 网页版可连接的远程 MCP 入口接入 Reality One Gateway，同时保持 AAF/RFE 正式权威边界。

## 工具

共 15 个：`taowind_server_info`、`search`、`fetch`、`rncs_list_runtimes`、`rncs_runtime_health`、`rncs_world_status`、`rncs_compile_plan`、`rncs_validate_plan`、`rncs_create_candidate`、`rncs_get_candidate`、`rncs_diff_candidate`、`rncs_simulate_candidate`、`rncs_candidate_workflow`、`rncs_history`、`rncs_invocation_receipts`。

## 安全结构

- Origin 与 Host 白名单；
- 私有 MCP 路径令牌；
- 可选静态 Bearer；
- 限流与会话 TTL；
- 不透明 Artifact ID；
- 敏感文件名排除；
- HTTP Artifact 位于受保护 MCP 路径；
- 不注册授权、合并、回滚、发布、Shell 或任意文件工具。

## 验收

| 项目 | 结果 |
|---|---:|
| MCP 专项 | 12/12 PASS |
| MCP Smoke | PASS |
| Gateway | 12/12 PASS |
| Native Bridge | 14/14 PASS |
| 根级统一集成 | 19/19 PASS |
| 运行时健康 | 14/14 healthy |
| 发布结构 | PASS，29 个模块 |
| npm audit | 0 vulnerabilities |

候选现实 Smoke 完成了编译、分支、模拟和差异，结果 `simulation_status=completed`，且 `authority_unchanged=true`。

## 边界

当前环境没有 Render/Railway 凭据，因此本次不虚构已上线 HTTPS 地址；没有 Docker 命令，因此 Dockerfile 已提供但未在该环境构建镜像。OAuth 2.1 留待下一版。