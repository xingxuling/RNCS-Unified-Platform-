# TaoWind Reality MCP v0.1.0-alpha.1

TaoWind Reality MCP 是 ChatGPT 到 RNCS + Aetherworld 的远程 MCP 入口。它通过 Reality One Gateway 发现和调用现有运行时，让模型能够搜索权威资料、检查世界状态，并在不写入正式世界的前提下编译、创建和模拟候选现实。

## 当前能力

- Streamable HTTP MCP；
- 14 个 RNCS/Aetherworld 运行时发现与健康检查；
- OpenAI 兼容 `search` / `fetch`；
- 中文、CSL、IAL 到 Compilation Plan；
- 候选分支、差异、隔离模拟与调用收据；
- Docker、Render、Railway 部署模板。

## 权威边界

第一版只开放只读和候选现实能力。明确不开放：AAF 授权、候选合并、RFE 回滚/重放、Git 主分支写入、发布、任意 Shell、任意文件读取。

候选组合工作流会校验执行前后的正式 `revision` 与 `state_root`；任一发生变化即失败。

## 验收

- MCP：12/12 PASS
- Smoke：PASS
- Gateway：12/12 PASS
- Native Bridge：14/14 PASS
- 根级统一集成：19/19 PASS
- 运行时健康：14/14 healthy
- 发布结构：PASS，29 个模块
- npm audit：0 vulnerabilities

完整可运行源码位于 `RNCS_Aetherworld_Unified_v0.12.0-alpha.1_TaoWind_Reality_MCP_Runtime_完整源码与运行包.zip`。本目录作为 GitHub 可审查入口与版本锚点；模块化源码、测试、部署模板及完整母工程由对应发布 ZIP 交付。

## 运行

```bash
npm install
npm run test:mcp
npm run serve:mcp
```

本地默认端点为 `http://127.0.0.1:8787/mcp`。ChatGPT 网页版需要部署成远程 HTTPS MCP 地址。公网 Alpha 部署必须设置私有路径令牌与 Host 白名单；生产级多人使用应升级到 OAuth 2.1。