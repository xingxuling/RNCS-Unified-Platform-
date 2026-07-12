# AetherDev AGI 自进化开发链计划 v0.1

## 1. 总结论

- 新增一个**开发执行型智能体** `AetherDev AGI`（自进化开发总脑），定位区别于 Local AGI / AetherBoss / 无人工厂：它只负责"观察项目 → 生成开发任务 → 桥接 Codex/Cursor/VSCode → 触发本地检查 → 写入记录与训练样本"。
- MVP 阶段**默认权限 L2~L3**：只生成任务包、提示词、只读检查命令；**不写文件、不删文件、不部署**。L4/L5/L6 全部留接口、默认关闭。
- 优先目标是**降低 Lovable 调用成本**：每个任务必须给出 CostDecision，把小修复推给 Codex/Cursor/VSCode，把大 UI/新页面才推给 Lovable。
- 全部中文化，最终 `tsc --noEmit` 必须通过。

## 2. 现有能力复用盘点

直接复用、不重写：

| 现有模块 | 复用方式 |
| --- | --- |
| `src/lib/local-gateway` + `/system/local-gateway` | 作为唯一执行通道，新增 `/dev/*` 命名空间接口（先 mock） |
| `src/routes/system-bug-audit.tsx` + 现有 bugAudit store | 作为 DevAgentRun 结果落地点之一 |
| `src/routes/system.page-completeness.tsx` | 作为"项目状态摘要"数据源之一 |
| `src/lib/aetherworld-autonomous-factory` | 新增"开发工厂"卡片接入，但不重写工厂调度 |
| `src/lib/aetherboss` / `local-agi` | AetherBoss 增加一个 `dispatchDevAgent()` 入口，不复制其调度逻辑 |
| `src/lib/record-center` / `msl` / `msl-state` | DevAgentRun 完成后写入 Record + MSL frame |
| `src/lib/audit` | 复用现有 audit log 写入，不另起一套 |
| `src/lib/chat` | 新增 AetherDev 卡片，复用 chat bridge 模式 |
| `src/lib/aetherseed-auto-training` | 训练样本候选写入复用现有 sample store |

需要**新增**的最小模块（见第 3 节），其余一律复用。

## 3. 新增最小模块

新目录：`src/lib/aetherdev-agent/`

```
aetherdev-agent/
  aetherDevTypes.ts              // DevAgentRun / DevTask / DevCommandCheck / DevPatchProposal / CostDecision
  aetherDevStore.ts              // localStorage 持久化 + 订阅
  aetherDevProjectScanner.ts     // 聚合 page-completeness / bug-audit / route 列表 / last tsc
  aetherDevTaskPlanner.ts        // 根据扫描结果生成 DevTask[]，含 issueType 分类
  aetherDevPromptCompiler.ts     // 一次性产出 codexPrompt / cursorPrompt / vscodeSteps
  aetherDevCostDecider.ts        // 输出 CostDecision，推荐工具
  aetherDevSafetyPolicy.ts       // 权限分级 L0~L6，白名单/黑名单，默认拒写
  aetherDevGatewayBridge.ts      // 调用 local-gateway /dev/* 接口（mock fallback）
  aetherDevChatBridge.ts         // 为 chat 提供 AetherDevAgentCard
  aetherDevRuntime.ts            // 统一入口：observe() / plan() / dryRunCheck() / record()
```

新页面：`src/routes/system.aetherdev-agent.tsx`（中文名：自进化开发总脑）。

## 4. 数据流

```text
[现有 page-completeness / bug-audit / route 列表 / local-gateway 健康]
                │
                ▼
        aetherDevProjectScanner  ──► DevProjectSnapshot
                │
                ▼
         aetherDevTaskPlanner    ──► DevTask[] (含 issueType / risk / 目标文件)
                │
                ├─► aetherDevPromptCompiler  ──► codex/cursor/vscode 提示词
                ├─► aetherDevCostDecider     ──► CostDecision
                │
                ▼
       aetherDevSafetyPolicy 评估（默认 L2/L3）
                │
                ├─ L3：aetherDevGatewayBridge → /dev/run-command (只读：tsc/build/test/route)
                │        └─► DevCommandCheck
                │
                ├─ L4：生成 DevPatchProposal（仅预览，不落地）
                │
                └─ L5/L6：默认关闭
                │
                ▼
       记录写入：Bug Audit + Record + MSL + Audit Log + TrainingSampleCandidate
                │
                ▼
        AetherDevAgentCard → chat / 无人工厂 / AetherBoss
```

## 5. 工具链桥接方案

1. **Codex Bridge**：仅产出任务包（title / targetFiles / 验收 / codexPrompt）。MVP 不调用 Codex API。
2. **Cursor Bridge**：产出"按文件 + 按目标 + 按验收"的可复制提示词。MVP 不直接驱动 Cursor。
3. **VSCode Bridge**：产出本地操作步骤数组（打开文件 / 搜索关键词 / 修改点 / 运行命令）。
4. **Local Gateway Dev Bridge**：在现有 `local-gateway` 上预留：

   ```
   GET  /dev/health
   POST /dev/read-file
   POST /dev/list-files
   POST /dev/run-command          // 只允许白名单：tsc/build/test/route-check
   POST /dev/apply-patch-preview  // 仅 diff 计算，不落盘
   POST /dev/apply-patch-confirmed// MVP 关闭，返回 NEEDS_CONFIRMATION
   GET  /dev/last-command
   GET  /dev/project-status
   ```

   浏览器侧无网关时全部返回 `NEEDS_LOCAL_GATEWAY`，与现有 `daemonBridge` 一致。

## 6. 成本裁决方案

`aetherDevCostDecider` 输出 `CostDecision`，规则（MVP 启发式）：

- `issueType` 为 `TYPE_ERROR` / `STATE_SYNC` / `UI_ONLY 小改` / `ROUTE 单文件` → 推荐 **CODEX** 或 **CURSOR**。
- `issueType` 为 `LOCAL_GATEWAY` / `DATA_FLOW` 多文件 → 推荐 **VSCODE_MANUAL**（需要本机验证）。
- 新页面 / 大幅 UI 重构 / 跨多模块的 P0 / 需要设计 → 推荐 **LOVABLE**。
- 不在能力边界内 / 风险 HIGH / 涉及部署或删除 → **DEFER**，等创始人确认。
- `manualCost = LOW` 且 `apiCostRisk = LOW` 优先压到本地工具，避免 Lovable 额度消耗。

UI 上每个任务卡显示：推荐工具 + 理由 + 三种成本风险条。

## 7. MVP 页面设计 `/system/aetherdev-agent`

布局四区，符合工作区规范：

1. **顶部状态条**：项目根目录 / local-gateway 状态 / 上次 tsc 状态 / route 完整度 / bug 数。
2. **左侧任务队列**：按 P0~P3 分组，显示 issueType 徽章、推荐工具徽章、风险等级。
3. **中部任务详情**：原因 / 目标文件 / 预期修改 / 验收标准 / Codex Prompt / Cursor Prompt / VSCode Steps（带"复制"按钮）/ CostDecision。
4. **右侧执行与记录**：命令检查列表（tsc/build/test/route）、Patch 预览（只读）、是否已写入 Bug Audit / Record / 训练样本。

空/异常态：未检测到 local-gateway 时显示"仅生成任务，不能执行检查"提示；扫描无问题时显示"项目当前无可自动识别的开发缺口"。

## 8. P0 实施步骤（按顺序，单 PR 可控）

P0-1 建类型与存储：`aetherDevTypes.ts` + `aetherDevStore.ts`。
P0-2 扫描器：`aetherDevProjectScanner.ts`（只读复用已有 store，不新增数据源）。
P0-3 规划器 + 提示词编译器 + 成本裁决器。
P0-4 安全策略：默认 L2，拒写、拒删、拒部署。
P0-5 网关桥：`aetherDevGatewayBridge.ts`，未连接时返回 `NEEDS_LOCAL_GATEWAY`，连接后只允许白名单只读命令。
P0-6 页面 `/system/aetherdev-agent`：状态条 + 队列 + 详情 + 执行区，全中文。
P0-7 Chat 卡：`AetherDevAgentCard` + FAQ（"最该修什么"/"该用 Codex 还是 Lovable"/"生成 Codex 任务"等）。
P0-8 记录联动：扫描结果与执行结果写入 Bug Audit / Record / MSL / Audit Log / TrainingSampleCandidate。
P0-9 无人工厂 / AetherBoss / 公司驾驶舱接入：新增"开发工厂"卡（只读摘要）。
P0-10 `tsc --noEmit` 全绿。

每步独立，可中断、可回滚。

## 9. 后续自动写代码路线（非 MVP，仅规划）

- P1：开启 L4 `apply-patch-preview`，在 UI 显示 diff，仍不落盘。
- P2：开启 L5，仅对 `riskLevel=LOW` 且白名单文件（如纯文案、单文件 UI 微调）应用 patch，必须创始人单击确认。
- P3：开启 L6 无人值守，仅对白名单 issueType（如 `UI_ONLY` 文案修正、`TYPE_ERROR` 单点修复）自动修，并强制写入 Record + 训练样本，任何失败立即降级。
- 任何阶段都不解锁：自动 `rm`、自动迁移、自动部署、自动改 secrets / supabase 配置。

## 10. 验收标准

1. 存在 `/system/aetherdev-agent` 页面，全中文。
2. 能扫描出当前项目状态摘要并展示。
3. 能基于扫描结果生成 DevTask 列表并分级。
4. 每个任务都有 CostDecision 与推荐工具。
5. 能生成 Codex Prompt / Cursor Prompt / VSCode Steps 并可复制。
6. 能在已连接 local-gateway 时触发只读 `tsc --noEmit`，未连接时优雅降级。
7. 扫描与执行结果能写入 Bug Audit / Record / 训练样本候选。
8. 默认不写文件、不删文件、不部署；高风险任务标记 `NEEDS_CONFIRMATION`。
9. Chat 能返回 AetherDevAgentCard，覆盖 9 类典型问题。
10. 无人工厂、公司驾驶舱、AetherBoss 能看到"开发工厂"摘要。
11. 工程层 `tsc --noEmit` 通过；不破坏既有模块与命名。

---

**等待确认后再进入 build 模式实施 P0-1 ~ P0-10。**
