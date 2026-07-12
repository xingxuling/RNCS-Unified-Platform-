# TaoWind Reality MCP v0.2.0-alpha.1 创始人权威升级验收报告

**母工程版本：** `RNCS + Aetherworld Unified 0.13.0-alpha.1`  
**基础版本：** `0.12.0-alpha.1`  
**验收日期：** `2026-07-04`

## 1. 任务结论

本次不是单纯增加几个高权限按钮，而是把 MCP 从“候选现实观察入口”升级为“创始人正式权威入口”。ChatGPT 现在可以经 MCP 调用 RNCS 原生 AAF/RFE 能力，完成候选授权、正式合并、行为注册、正式 Loopback、Generation 回滚/重放和运行时 Manifest 声明动作。

## 2. 已解决异常

`rncs_list_runtimes` 与 `rncs_invocation_receipts` 在旧远端版本中返回顶层数组，导致 MCP 客户端在 `structuredContent` 校验阶段报错。v0.2 对所有普通工具结果执行对象化，并为列表工具提供具名对象结构。

修复后，服务器调用结果不再出现：

```text
Input should be a valid dictionary ... input_type=list
```

## 3. 权限升级

新增三档配置：

- `read`：只读；
- `candidate`：只读＋候选写入；
- `founder`：正式权威写入。

私有构建默认 `founder`，创始人身份默认为：

```text
subject:duhengjie
roles: owner, security
```

新增 12 个权威工具，总工具数由 15 增至 27。

## 4. 正式执行链

`rncs_authoritative_workflow` 已实现：

```text
自然语言 / CSL / IAL
→ Compilation Plan
→ Candidate Reality
→ 隔离模拟
→ AAF 授权
→ 行为注册（需要时）
→ RFE 正式合并
→ 可选双客户端 Loopback
→ 新 Generation / Revision / State Root
```

Smoke 验证中，正式工作流前后状态根发生变化，证明不是伪造返回或只写日志。

## 5. 安全与并发边界

正式破坏性动作要求最新：

- `expected_state_root`；
- `expected_revision`。

如果另一调用已改变正式世界，旧调用会被拒绝。`rncs_runtime_action` 只能调用运行时 Manifest 已声明动作，不能构造不存在的动作，也不能执行任意 Shell 或读取任意文件。

## 6. 没有伪造的能力

- **发布：** 当前 14 个运行时没有正式 `publish` 动作，因此本版没有制造一个只改标签却声称发布成功的工具。
- **任意 Shell：** 当前不存在带工作区隔离、命令策略、密钥排除、证据和回滚契约的 Developer Execution Runtime，因此不裸开放。
- **远程部署：** 当前执行环境没有目标 GitHub/Vercel 的写连接器或部署凭据，故交付的是可部署源码与运行包，不声称远端实例已经替换。

## 7. 验收结果

| 验收项 | 结果 |
|---|---:|
| MCP 专项测试 | `21/21 PASS` |
| MCP Founder Smoke | `PASS` |
| 工具目录 | `27` |
| 动态运行时 | `14` |
| 列表结构对象化 | `PASS` |
| 正式世界状态变化 | `PASS` |
| Reality One Gateway | `12/12 PASS` |
| Aetherworld Native Bridge | `14/14 PASS` |
| 根级统一集成 | `19/19 PASS` |
| Runtime Health | `healthy` |
| npm audit | `0 vulnerabilities` |
| npm pack dry-run | `PASS`，16 个包文件 |

详细原始输出位于 `evidence/`。

## 8. 验收裁决

`TaoWind Reality MCP v0.2.0-alpha.1` 已达到：

> **可由 ChatGPT 调用、可读取与制造候选现实、可经 AAF/RFE 改变正式世界、可回滚和重放、可操作全部已声明运行时动作，同时保留状态并发、证据和恢复边界。**

远程已连接实例必须重新部署并刷新工具目录后，以上能力才会在线生效。
