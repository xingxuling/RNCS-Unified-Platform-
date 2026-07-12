# CODEBASE ARCHAEOLOGY v0.7

## 基线裁决

- 上传母工程 SHA-256：`bea02112ae9835e853dc697684b1bb6fefd075f2ad1884900f4f3a9760069494`
- GitHub `main-95` 最新基线：`a340a2839786f0409616645fe0aa5cd612e9892c`
- GitHub 记录的 v0.6 完整包 SHA-256 与上传包一致，因此以 `main-95` 为源码权威，ZIP 作为完整母工程载体；不存在用旧 ZIP 覆盖新实现的问题。

## 真实入口

| 层 | 入口 | 事实 |
|---|---|---|
| 母工程 | `package.json`、`scripts/rncs.mjs`、`rncs.modules.json` | 统一注册、健康、测试、发布 |
| Aetherworld | `apps/aetherworld/src/routes/world-runtime.tsx` | 原有网页运行表面；v0.7 嵌入 RNCS 世界驾驶舱 |
| Bridge | `packages/integration/aether-rncs-bridge/src/index.mjs` | v0.6 仅生成计划；v0.7 成为可执行原生运行时 |
| Gateway | `packages/control/reality-one-gateway/src/server.mjs` | `/api/runtimes`、`/api/health`、`/api/invoke` |
| RFE | `packages/kernel/rfe-core-sdk` | Generation、Revision、Snapshot、Evidence、State Root |
| RBF | `packages/control/reality-branch-fabric` | 候选分支、模拟、比较、合并 |
| AAF | `packages/control/agent-authority-fabric` | 动作级策略、批准、拒绝与证据根 |
| Behavior | `packages/control/reality-behavior-fabric` | 正式行为程序、事件总线、热更新和因果增量 |
| RSR | `packages/world/reality-simulation-runtime` | v0.7 权威状态帧、可验证增量、有限历史、预测重放 |
| Network | `packages/world/reality-network-runtime` | v0.2 服务端权威、Loopback、快照恢复和客户端校正 |
| VSR | `packages/world/visual-state-runtime` | v0.6 Hermite、最短角、有限外推、Teleport Snap、Correction Plan |
| Studio | `apps/reality-studio` | 世界、资产与运行证据检查 |

## 模块注册关系

```text
Aetherworld
  → HTTP Gateway
  → rncs.aetherworld-native
  → @taowind/aether-rncs-bridge
     ├─ RBF
     ├─ AAF
     ├─ Reality Behavior
     ├─ RFE
     ├─ RSR
     ├─ Reality Network Runtime
     └─ VSR temporal-presentation
```

## v0.6 中已经存在，禁止重复实现

- RSR：权威帧、可验证增量、有限历史、预测重放、固定时间步、碰撞与状态根。
- Network：服务端权威、双人 Loopback、输入权限、快照/增量、错误基线隔离、完整快照恢复、预测回滚。
- VSR：Hermite 插值、最短角旋转、有限外推、Teleport Snap、Correction Plan、独立 Presentation Root。
- RFE：持久事实、Generation、Revision、Snapshot、Evidence、状态根和恢复读取。
- RBF：候选分支、编译、模拟、比较、执行计划、合并提案。
- AAF：策略束、批准凭证和权威评估。
- Behavior：正式程序、规则、事件、Provider 调用和因果增量。

## 假融合与旁路位置

1. 旧 `aether-rncs-bridge` 只把输入转换成 `rncs.compilation-plan.v0.1` JSON，没有执行分支、授权、行为、RFE、RSR、Network 或 VSR。
2. Aetherworld 原有 `src/lib/realityOneGateway.ts` 明确是浏览器前端状态模型，不是 RNCS Gateway 权威运行时。
3. Aetherworld 健康检查过去验证路由、源码和构建产物存在，不验证 `rncs.aetherworld-native` Provider、协议和实际调用。
4. 模块注册表声称 Bridge 存在，但没有 Aetherworld → Gateway → Bridge 的正式用户链。

## 最小修改面

- 升级 `packages/integration/aether-rncs-bridge`，不改写 RSR/VSR/Network 内核。
- 为 Gateway 增加一个正式 Provider、清晰协议和 HTTP 调用测试。
- 在 Aetherworld 现有世界运行页嵌入驾驶舱，不建立第二套应用。
- 更新注册表、版本、测试、示例、文档和发布脚本。

## 当前测试基线

v0.6 记录为 1246 项直接计数测试全部通过。本次保留原套件并增加 Bridge、Native Integration 与统一集成测试；最终直接计数为 1267 项通过。
