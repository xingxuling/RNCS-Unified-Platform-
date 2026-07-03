# TaoWind Reality MCP v0.3 / RNCS Unified v0.14 执行平面验收证据

日期：2026-07-04

## 基线

- 完整母工程：`RNCS_Aetherworld_Unified_v0.14.0-alpha.1_TaoWind_Founder_Execution_Plane`
- 完整包 SHA-256：`f5aafb3af3b804b08f17346917d032be5f7ca05e086dda6d43ab32b7043b4491`
- MCP：`0.3.0-alpha.1`
- Founder 默认工具：`52`
- Founder Unrestricted 工具：`53`
- 运行时：`15`
- Developer Execution Runtime：`healthy`

## 最终回归

| 测试组 | 结果 |
|---|---:|
| Developer Execution Runtime | 13/13 PASS |
| Reality One Gateway | 13/13 PASS |
| TaoWind Reality MCP | 25/25 PASS |
| 母工程集成 | 19/19 PASS |
| Runtime Health | 15/15 healthy |
| Smoke MCP | 52 tools / 15 runtimes PASS |
| Release Verification | PASS |
| Vercel Entry | PASS |
| npm audit | 0 vulnerabilities |

## 现场闭环

- 文件写入、读取、精确补丁、Diff：PASS
- Node 命令与项目测试：PASS
- Git 分支、Commit、干净工作区：PASS
- 成功任务 Commit：`da0b12e516edbe220907792091a0b045b70fc49a`
- 失败任务自动回滚：PASS；HEAD、分支、工作树和文件内容均恢复
- 子进程敏感变量清洗：GitHub、Vercel、Worker、MCP Token 均未继承
- RNCS 权威状态：Generation 22 → 23，Revision 22 → 23，State Root 按提交推进
- 失败任务未推进 Generation、Revision 或 State Root
- 调用收据：23 条

## RSR / VSR

- RSR：180 Tick，确定性重放 PASS，确定性恢复 PASS
- RSR State Root：`fnv1a64:ae339aab5727a0ae`
- RSR 导出 SHA-256：`1eb288c8ab3c64dea5f3fd8eb0763734f0bc3cc1f203755afcea4ecc2c4faf6f`
- VSR：真实离屏 PNG，32,462 bytes，PNG 签名有效
- VSR PNG SHA-256：`0b36cc8488b6ec9d7287e5f8e0fbb2576f0f8b3554394ad80ffa3cdc60f37f3b`

## 现场发现并修复

1. `workspace_list_files` 目录项输出 `size: undefined`，触发规范化哈希失败；已改为目录项省略 `size` 并补回归测试。
2. v0.3 遗漏 v0.2 的发布 Revision、Authority Bundle 导入/导出及数字 Revision 回滚兼容入口；已恢复并将 Founder 默认工具数提升到 52。
3. Authority Bundle 导入被 Express 默认 100 KB JSON 上限拦截；已加入受控 `TAOWIND_MCP_MAX_REQUEST_BYTES`，默认 16 MB、硬边界 100 KB–64 MB。

## 安全边界

- 路径穿越、绝对路径、符号链接逃逸：阻断
- `.env`、私钥、签名与令牌文件：读取/导出阻断
- 命令执行：`executable + argv`，默认无裸 Shell
- 超时、输出上限、环境变量白名单：启用
- Founder Unrestricted：必须显式启用，默认关闭

## 部署门禁

当前此证据证明源码与本地真实运行闭环通过。生产上线仍必须具备：

1. 一个持久容器或 VM 作为 Developer Execution Worker；
2. Worker 与 Vercel MCP 控制面的一致高熵令牌；
3. GitHub/Vercel Provider 凭据仅配置在 Worker 安全环境；
4. Vercel 项目环境变量写入和生产部署权限；
5. 部署后通过 ChatGPT MCP 再执行一次在线文件、Git、RSR、VSR、导出和失败回滚验收。

在上述生产资源没有实际连接并通过在线调用前，不把本地通过包装成线上完成。