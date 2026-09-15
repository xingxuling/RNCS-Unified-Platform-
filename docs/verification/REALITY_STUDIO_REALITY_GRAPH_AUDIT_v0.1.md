# RNCS Reality Studio Reality Graph Audit v0.1

- 日期：2026-09-15（Asia/Shanghai）
- 目标 checkout：`C:\Users\User\Documents\RCL\_worktrees\rncs-visual-factory-v01`
- 分支：`codex/rncs-engine-stack-archaeology-v01`
- 基线 commit：`aafb291f1d54505be75cfe2559b07a92e6e46d3a`
- 本轮状态：`PRODUCTIZATION_CANDIDATE / LOCAL_RUNTIME_VERIFIED`
- 详细根、测试与浏览器证据：[`REALITY_STUDIO_EVIDENCE_LEDGER_v0.1.json`](./REALITY_STUDIO_EVIDENCE_LEDGER_v0.1.json)
- 后续 integration epoch / isolated replay 增量证据：[`REALITY_STUDIO_INTEGRATED_REPLAY_EVIDENCE_v0.1.json`](./REALITY_STUDIO_INTEGRATED_REPLAY_EVIDENCE_v0.1.json)

## 1. 事实边界

参考截图 A/B 只作为产品视觉与 UX 基线：深色专业桌面壳、Reality Graph 主视图、Inspector 决策面板、Viewport 现实投影、底部可审计依据。截图中的节点数量、数值、健康状态、FPS、GPU、生产部署等不被当作后端事实。

当前源码和真实运行时是唯一功能真相来源。本轮没有复制 RNCS Canonical Core，也没有把 HTML/CSS 的视觉层声明成 RCL/RNCS 语义所有者。Reality Studio 负责 Product Body / Projection；RNCS/RCL、已有 Runtime 与 Provider 保留各自 owner。

工作树在本轮开始前已经包含来自其他工程的修改和未跟踪文件；本轮只在 `apps/reality-studio` 与本证据文档范围内追加/修改，没有 reset、checkout、清理或覆盖其他改动。

## 2. 基线 UI 问题清单

| 基线问题 | 源码/运行表现 | 产品风险 |
| --- | --- | --- |
| 图区域更像平铺节点编辑器 | 节点状态真实，但缺少 Authoritative / Candidate / Promotion 的视觉分层 | 用户难以先判断“什么是真实权威、什么是候选” |
| Inspector 接近表格 dump | 选中节点后技术字段与 root 混在同一信息流 | 关键健康状态、API、root、receipt 不够先决策 |
| Viewport 权重偏低 | 底部预览与日志竞争同一空间，投影失败/等待态容易弱化 | 现实投影不承担产品主路径中的验证角色 |
| 全局运行状态分散 | runtime、tick、branch、gate 各自出现在不同区域 | 用户无法一眼判断当前现实系统是否可运行、候选是否可提交 |
| 左导航偏 IDE 树 | 功能存在但密度均匀、语义层级不够产品化 | 入口像调试器工具树，不像现实系统工作区 |
| 底部日志抢注意力 | 真实事件可见，但没有与 Receipts / Evidence / Problems / Performance 分层 | 审计依据与主图争夺视觉焦点 |
| Viewport 数据 URL 曾存在边界风险 | `Uint8Array.toString('base64')` 不能生成 PNG base64 | 可能出现“状态 VERIFIED 但图片无法显示”的伪一致性 |

## 3. 截图能力 → 真实模块/API/运行时 → 缺口

| 截图/产品能力 | 真实复用模块/API | 当前事实状态 | 缺口或边界 |
| --- | --- | --- | --- |
| Data Source / 项目入口 | `UnifiedManufacturingSession`、`session.project`、现有 `/api/unified/session/new` | `LOCAL_VERIFIED`；项目 root、asset count、scene node count 来自 session | 文件打开/持久化项目保存仍 unavailable |
| Semantic Compiler | `session.networkCompile()`、`apps/reality-studio/src/network-world-compiler.mjs` | `LOCAL_VERIFIED`；compilation envelope 与本地 compiler 双验证 | 不宣称 RCL 新语义；仅投影现有编译结果 |
| Reality Kernel / Authoritative Reality | `RealityNetworkRuntime.createSessionFromCompilation()`、`getSessionHealth()` | `LOCAL_VERIFIED`；loopback server healthy，tick/state root 真实 | 无 WAN/WebSocket/UDP/QUIC/WebRTC/TLS/relay 生产证据 |
| World Body IR | `compileStudioWorldBodyCandidate()`、`verifyStudioWorldBodyCandidate()`、`summarizeStudioWorldBodyCandidate()` | `CANDIDATE`；6 entities / 6 bodies / 4 unmapped scene nodes | 4 个场景节点和 temporal/event/material/controller 等 facet 仍是 bridge gap |
| RSR Runtime | `network_runtime.pullSnapshot()`、`rsrSnapshot`、RSR state/body roots | `LOCAL_VERIFIED`；真实 tick、bodies、contacts、state root | isolated Behavior+Network replay 已有本地 candidate evidence；Canonical shared receipt owner 仍缺失 |
| VSR Viewport | 现有 `renderNetworkAssetViewport()`、`network-world-compiler.mjs` | `LOCAL_VERIFIED`；GLB-backed PNG，640×360，frame/pixel/viewport roots | 真实画面可用；更复杂的实时相机/渲染控制仍依赖现有 VSR API |
| Behavior Fabric / live update | `session.step()`、`proposeLiveUpdate()`、`authorizeLiveUpdate()`、`commitLiveUpdate()` | `LOCAL_VERIFIED`；propose → authorize → explicit confirmed commit 的阶段分开；Adapter 记录相对 integration epoch | 行为 tick 与 Network tick 尚无 Canonical shared Studio coordinator |
| Reality Branch | `createWorkspace()`、`createBranch()`、`simulateBranch()`、`compareBranches()`、`createMergeProposal()`、`createAuthorityRequest()` | `CANDIDATE / LOCAL_VERIFIED`；推荐 `branch:behavior-safety`，comparison root 有记录 | branch 仍是 review/candidate 投影，不等于生产 promotion |
| Commit Gate | `_commitGate()`、RFE/live-update engine 的本地候选阶段 | `LOCAL_VERIFIED`；无 authority 时 locked；授权后 awaiting confirmation；确认后 `candidate-committed` | `production_promotion_permitted=false`；外部 authority/key custody/deploy unavailable |
| Evidence Ledger / Receipts | adapter `_buildEvidenceLedger()`、event roots、source roots | `LOCAL_VERIFIED`；11 类 entries（含 integration timeline / isolated replay）、ledger root、event head root 可复现记录 | ledger 是记录器，不拥有 commit authority 或 Canonical shared receipt owner |
| Network Runtime / Authority Fabric | `RealityNetworkRuntime`、`joinCompiledSlot()`、delegation roots、transport profile/fabric roots | `LOCAL_VERIFIED`；本地 loopback authority session、2 players、sent/delivered 可见 | transport profile 标记 `candidate_only=true`、`authoritative=false` |
| Agent Hub / 输出与应用 | 截图产品概念中的 Agent Hub、部署/发布入口 | `UNAVAILABLE`；UI 明确显示 unavailable，不创建假节点数或假任务 | 没有真实 Agent Hub endpoint、生产发布 authority 或部署凭据 |
| CPU / RAM / GPU / FPS | 当前 RNCS Runtime API 未发出对应指标 | `UNAVAILABLE`；Inspector/Performance 不渲染假数字 | 需要 Runtime 真实 metrics contract 后再接入 |

## 4. REUSE / ADAPT / KEEP_SEPARATE / UNKNOWN 裁决

| 对象 | 决策 | 说明 |
| --- | --- | --- |
| Unified Manufacturing / RFE / Behavior Runtime | `REUSE` | 继续作为项目、行为、live-update 与 authority phase 的真实 owner |
| Network World Compiler / RSR Runtime | `REUSE` | 不另建第二套网络世界或空间快照；Studio Adapter 只读取/驱动既有 API |
| World Body Studio Bridge | `ADAPT` | 复用其 candidate ingress、verify、summary；未覆盖 facet 保持 gap，不另写 World Body runtime |
| Reality Branch Fabric | `REUSE` | 复用 branch workspace、simulation、comparison、proposal、authority request |
| VSR Projection | `REUSE` | 复用 GLB-backed viewport，并修复真实 PNG base64 边界 |
| Reality Studio Adapter | `ADAPT` | 新增最薄 projection seam，把真实 state、roots、controls、events 汇聚给产品 UI |
| HTML/CSS/JS Product Body | `KEEP_SEPARATE` | 只拥有产品壳、布局、视觉分层与交互投影，不拥有 Canonical semantics |
| Production promotion / external authority | `KEEP_SEPARATE` | 本地候选提交与生产 promotion 明确分开，不能由 UI 自行补齐 |
| WAN transport、Agent Hub、resource metrics | `UNKNOWN` | 当前路径没有真实 contract/evidence；显示 unavailable，等待 donor/API/owner 裁决 |

## 5. 本轮 Productization Pass

### 中央 Reality Graph

- `apps/reality-studio/web/reality-graph.html` 增加 Authoritative Reality、Candidate Reality、Commit / Promotion Path 三层产品投影标签。
- `reality-studio.css` 放大 graph 行高、强调 Reality Kernel、提高真实连接线层级，并用 teal/amber/violet/gray 分离 runtime、candidate、evidence、unavailable。
- 节点位置仍来自 adapter 的 `GRAPH_LAYOUT`，节点状态、metrics、root、evidence refs 仍来自 `inspect()`，三层框只是视觉分组，不制造后端事实。

### Inspector

- `reality-studio.js` 先渲染 selected node summary：节点名、owner/subtitle、真实 status、最多 4 项 metrics、API、root、receipt。
- Technical details、Roots & receipts、Backend gaps、Reality Branch candidates 使用折叠 `details`；状态/权限/日志页保持与真实 state 对应的展开区。

### Viewport / 状态 / 导航 / 底部

- Viewport 改成更宽的 lower panel，保留 frame root、source state root、真实 VERIFIED/UNAVAILABLE 文案；增加本地展开模式，不改变 runtime。
- workspace status strip 展示真实 runtime/control/active reality/branch/gate；生产 promotion 仍显示 `UNAVAILABLE`。
- 左侧保留真实功能分组但减轻 IDE 树感；底部保留事件流，并分出 Issues、Performance、Receipts。
- “新建”只创建新的本地 adapter session；打开、保存、部署等未连接能力被禁用并标记 unavailable。
- 修复 PNG wire boundary：`Buffer.from(this.last_viewport.png).toString('base64')`，并由测试验证 PNG signature。

## 6. 真实主路径

```text
RNCS Unified Session
  -> networkCompile / verified compilation envelope
  -> RealityStudioAdapter
  -> Reality Graph + Inspector
  -> step / run / pause / snapshot / replay
  -> Reality Branch evaluation
  -> Behavior Fabric candidate simulation
  -> explicit local authority
  -> separate confirmed local candidate commit
  -> Evidence Ledger / event roots
  -> RSR snapshot + VSR verified viewport
```

本地 probe 的关键事实：initial runtime `healthy`, tick `0`；step 后 Behavior/Network tick 都为 `1`，blue client `synchronized`，transport sent 为 `3`；当前 Replay 为 `scope=isolated-behavior-network-replay`，使用真实 Behavior snapshot 与 Network checkpoint，在隔离 runtime 中核对 roots，并明确 `canonical_state_mutated=false`；candidate 的 `simulated → authorized → committed` 阶段均有真实 roots；commit 后 Gate 为 `candidate-committed`，但 production promotion 仍为 `false`。

## 7. 本地验证与证据

### Targeted tests

- Reality Studio Adapter：`3/3 PASS`（含 isolated replay mismatch 不可伪成功的负例）
- Reality Studio HTTP server：`1/1 PASS`
- Reality Graph web structure：`9/9 PASS`
- `@taowind/reality-network-runtime`：`31/31 PASS`
- Browser smoke（Python Playwright，桌面 1600×1000 + 移动 390×844）：`PASS`；HTTP 200、14 nodes、PNG 640×360、Viewport expand、Replay 初始 disabled / run 后 enabled、isolated replay evidence、无 console/page/request error、无横向溢出。

### 组合工程测试

- `@taowind/reality-studio-native`：`250 PASS / 3 FAIL / 1 SKIP / 254 total`。3 个失败不是本轮产品化代码引入：缺少 `evidence/anime-forge-phase6-3-geometric-truth-v0.1` 使 geometric truth status 为 blocked；稀疏工作树缺少 `@taowind/rncs-asset-cache/src/index.mjs` 使 gateway health 与旧 server health 断言为 degraded。
- `@taowind/world-body-studio-bridge`：`BLOCKED`，启动即因同一稀疏工作树缺失 `@taowind/rncs-asset-cache/src/index.mjs` 无法加载；没有把 adapter 自身的 candidate verification 冒充为该 workspace 全量测试通过。

### K400 九 Gate（本轮裁决）

| Gate | 状态 | 说明 |
| --- | --- | --- |
| EXPRESS | `CANDIDATE` | UI 能表达 runtime/candidate/gate，但不宣称 RCL 已吸收产品壳语义 |
| COMPILE | `LOCAL_VERIFIED` | 现有 Unified → Network compilation 双验证通过 |
| LOWER | `LOCAL_VERIFIED` | 现有 Network Runtime / RSR / VSR lowering 被真实驱动 |
| EXECUTE | `LOCAL_VERIFIED` | local loopback runtime tick、input、join、health 可执行 |
| CORRECT | `LOCAL_VERIFIED` | roots、PNG signature、client synchronization、candidate phase 有断言 |
| ROBUST | `CANDIDATE` | 正例与 authority/confirmation 负例覆盖；外部 transport 与稀疏环境仍开口 |
| PERFORMANCE | `NOT_RUN` | 未取得真实 CPU/GPU/FPS contract；不以布局截图冒充 runtime performance |
| AI_GENERATE | `NOT_RUN` | 本轮没有 AI 生成语义或生产资产声明 |
| EVIDENCE | `LOCAL_VERIFIED` | Evidence Ledger、event roots、source roots、浏览器截图和测试结果已记录 |

## 8. RCL Gap / Stress Case / 下一轮

- `RCL_GAP_STUDIO_COMBINED_RUNTIME_TICK`：Behavior Fabric 与 Network Runtime 都真实，Adapter 已有相对 epoch 与 isolated replay evidence，但 Canonical coordinator/IR seam 仍未裁决。
- `GAP_NETWORK_REPLAY_COUPLING`：isolated replay 已为 `candidate-verified`；仍未拥有一条由 RCL/RNCS Canonical owner 管理的共享 receipt chain。
- `GAP_NETWORK_EXTERNAL_TRANSPORT`：本地 deterministic loopback 不能升级成公网、relay 或生产 authority 证据。
- `GAP_PRODUCTION_PROMOTION_AUTHORITY`：local candidate commit 不等于 production promotion；外部 key custody、时间/撤销、部署审批仍是独立 gate。
- `GAP_WORLD_BODY_BRIDGE_FACET`：bridge 已明确 6/6/4 coverage 与 facet gaps；下一步应由 World Body owner 决定补 contract 或保持 sidecar，而不是在 Studio 内另建语义。
- `GAP_RUNTIME_RESOURCE_METRICS` 与 `GAP_AGENT_HUB_API`：继续显示 unavailable，直到真实 provider/API 可审计接入。

当前最高杠杆顺序：先取得 RCL/RNCS 对 Canonical combined-tick IR/coordinator 的 owner 裁决；随后由 asset-cache / geometric-truth 各自 owner 恢复稀疏工作树依赖和缺失 evidence；再评估项目 open/save persistence 或真实 VSR camera control。视觉层继续以真实状态为约束，不扩张假按钮和假指标。

## 9. Integration Epoch / Isolated Replay 增量（2026-09-15）

本增量完成的是**已有 Runtime 的局部证据闭合**：它创建隔离的既有 Runtime 实例来重放，但没有新增 Runtime 实现、live/canonical owner 或 Canonical Core。对应的完整、可复核根值见 [`REALITY_STUDIO_INTEGRATED_REPLAY_EVIDENCE_v0.1.json`](./REALITY_STUDIO_INTEGRATED_REPLAY_EVIDENCE_v0.1.json)。

### 真实复用与最薄适配

| 原有 owner | 直接复用 API | Adapter 增量 | 不宣称的能力 |
| --- | --- | --- | --- |
| `BehaviorEditorSession` | `runtime.snapshot()`、`runtime.restore()`、`step()` | 每个 integration epoch 捕获真实 Behavior base snapshot，隔离实例重放真实有效输入 | 不拥有新 Behavior Runtime 或新的 Behavior Canon |
| `RealityNetworkRuntime` | `createCheckpoint()`、`createSessionFromCheckpoint()`、`submitInputPacket()`、`advanceServerTick()` | 每个 epoch 捕获真实 Network checkpoint；以隔离的既有 Runtime 实例重放原始已授权 input packet 并核对 state/receipt root | 不创建第二个 live/canonical authoritative owner；不宣称 WAN/production transport |
| Reality Studio Adapter | 既有 `session.step()` / `networkRuntime` 调用链 | 用相对 `epoch_tick` 绑定 Behavior 与 Network 的 base offsets、entry root、timeline root 和 replay receipt | 不拥有 Canonical shared tick 或 shared receipt owner |
| RCL Canonical Core | 无新增 primitive | 保持 `KEEP_SEPARATE` | 不把 Product Body 的组合逻辑误报成 RCL 吸收 |

候选提交后，Behavior state 可以保留而 Network Runtime 会按现有路径重新打开。为避免伪造“全局 tick 永远相等”，Adapter 会在每次 runtime rebuild 后开启新 epoch，并只核对该 epoch 内相对于各自 base tick 的偏移；这是可审计的适配约束，而不是新的语义 owner。

### 实际 probe

- 真正运行两步：每步同时传入 Behavior input 与 blue player 的已授权 Network move；得到 `entry_count=2`、`tick_aligned=true`。
- epoch root：`8c479b208f3620cc90d1c8b12bc2eecadb42ab6308b37204d366df2b34ed9c34`；timeline root：`85356c8ca510cd905c468c1b9678a7fbfd8418bee43ea6b5c80f94ef5de662c2`。
- 隔离 Replay 使用新的 `BehaviorEditorSession` 与新的 `RealityNetworkRuntime.createSessionFromCheckpoint()`；两条 entry 的 Behavior root、Network state root、Network receipt root、entry integrity、input submission 都匹配。
- replay root：`e5a18311671ab4b680bcb5d9567f44e5fa120e682ef361e8ea2d51df7ae48eff`；`deterministic=true`、`canonical_state_mutated=false`、`active_runtime_unchanged=true`。
- 另以 6 个真实 UI run ticks 复测，无 Network input 时也产生 6 条 epoch entry，隔离重放仍为 verified，replay root：`3589070247a17b1a414fad0c53693dedf987ea1eb3f09f75b5c0ebd5e2ce749d`。
- 负例测试只在测试内篡改一条期望 Network root；Replay 如实返回 `failed`，`network_match=false`、`entry_integrity_match=false`，而活跃 runtime 仍未变化。没有写入生产数据，也没有把失败伪装成 success。

因此 `GAP_NETWORK_REPLAY_COUPLING` 在**本地 isolated candidate evidence**范围内从 `open` 降为 `candidate-verified`；`RCL_GAP_STUDIO_COMBINED_RUNTIME_TICK` 保持 `open`：尚无 RCL/RNCS 认可的 Canonical coordinator、IR 或 shared receipt owner。

### 产品投影与浏览器验证

- 顶部运行状态现在真实显示 `epoch N · replay <status>`；未运行 entry 时 Replay 禁用，运行后才启用。
- Inspector Runtime status 展示实际 `integration epoch`、entry count、timeline root、tick alignment、replay scope、deterministic 与 active-runtime-unchanged；数值均来自 Adapter inspect payload。
- Browser plugin 当前不可用，因此使用本地 Python Playwright 回归：桌面 `1600×1000` 和移动 `390×844` 均 HTTP 200、14 nodes、真实 `640×360` VSR 图像、无横向溢出、无 console/page/request error；初始 Replay disabled，run 后 enabled，Replay evidence 可见。
- 截图：[`desktop`](C:/Users/User/.codex/visualizations/2026/09/15/rncs-reality-studio/integrated-replay-desktop.png)、[`expanded viewport`](C:/Users/User/.codex/visualizations/2026/09/15/rncs-reality-studio/integrated-replay-desktop-expanded.png)、[`mobile`](C:/Users/User/.codex/visualizations/2026/09/15/rncs-reality-studio/integrated-replay-mobile.png)。

### 本轮验证与真实阻塞

- Studio focused adapter/server/web：`13/13 PASS`。
- `@taowind/reality-network-runtime`：`31/31 PASS`。
- `@taowind/reality-studio-native`：`250 PASS / 3 FAIL / 1 SKIP / 254 total`。新增 Adapter、HTTP、UI 回归均通过；3 个失败仍是既有环境/证据缺口：`evidence/anime-forge-phase6-3-geometric-truth-v0.1` 缺失，以及 sparse worktree 中 `packages/control/rncs-asset-cache/src/index.mjs` 被标记 `S` 且不在磁盘，造成旧 gateway/server health 为 degraded。
- `@taowind/world-body-studio-bridge`：仍 `BLOCKED`，同一缺失 asset-cache source 导致 `ERR_MODULE_NOT_FOUND`。没有修改或恢复该不属于本轮的稀疏工作树资产。
- `git diff --check`：`PASS`（仅有既有 CRLF 提示）。没有使用 GitHub Actions。

### No Silent RCL Bypass / 下一步

- task：在不复制 Behavior 或 Network Runtime 的前提下，闭合本地 network-aware replay evidence。
- missing capability：Canonical shared Studio tick coordinator 与 shared receipt owner。
- workaround：Product Body 内的 relative integration epoch + isolated replay evidence。
- donor advantage：Behavior/Network 已有 snapshots、checkpoint restore、authorized input packet 和 deterministic receipts；无需重写底层。
- gap type / generality：跨 runtime 的协调与 receipt ownership，具有潜在通用性；暂不自动吸收 RCL。
- affected K400：`EXPRESS / LOWER / EXECUTE / CORRECT / ROBUST / EVIDENCE`。本轮只是 `LOCAL_CANDIDATE_VERIFIED`，不自行宣布 K400 总体 PASS。

下一最高杠杆是要求 RCL/RNCS owner 对 Canonical combined-tick IR/coordinator 作明确裁决；这属于重大 Canonical Owner 决策，不能由 Studio UI 自动越权。可并行的安全工作是由各自 owner 恢复 sparse `rncs-asset-cache` 源和缺失 geometric-truth evidence 后重跑被阻塞 package 测试。

## 10. Concept Product Body Pass（2026-09-15）

本节对应“概念图级外观 + 真实运行时内核”的前端重构。范围严格限定在 Product Body：没有改写 RNCS Runtime、RSR、VSR、Behavior Fabric、Reality Branch、Authority 或 Evidence Ledger 的 owner/API。参考概念图继续只提供视觉基线，不提供任何节点、指标、成功状态或世界画面事实。

### 结构与可见状态

| 产品区域 | 本次 Product Body 变化 | 真实来源/边界 |
| --- | --- | --- |
| 双层全局栏 | 品牌与 workspace/runtime chrome 分开；第二行保留真实 run/pause/step/snapshot/replay/candidate/authority/commit control，并将未接入的搜索、打开、保存、部署保留 disabled/unavailable | control 与 availability 来自 Adapter；搜索/文件/部署没有伪接入 |
| 中央 Reality Graph | Graph 扩大为中心主视觉，加入 Data & Input / Output & Application 区，以及 Authoritative / Candidate / Commit-Promotion 三个舞台层；连接线改为可读的曲线路径 | node position、edge、status、root、metric 仍由 Adapter inspect() 投影；舞台层只是产品分组 |
| Inspector | 增加 live projection kicker、摘要优先的 selected node 卡；技术字段、roots/receipts 与 backend gaps 继续折叠 | API、source、root、receipt、health metric 均为 selected node 的真实 payload |
| Viewport | VSR/RSR 区在底部右侧获得更大面板和可展开模式；保留 verified root/footer/overlay | 使用真实 GLB-backed 640×360 PNG；无 frame 时仍显示 unavailable/waiting |
| Logs / Evidence | 日志降为左下审计窗，Receipts、Issues、Performance 保留真实 tab | 没有植入样例日志；performance provider 不存在时继续显示 unavailable |
| 状态一致性 | 增加 viewport response revision guard：旧的图像请求不能覆盖较新的 Replay/Runtime 响应；若 viewport root 相同，仅合并真实 PNG 像素 | 修复的是 UI 状态竞态，不改变 Runtime；避免将已验证 Replay 错报为 unavailable |

### 本轮产品验收证据

- 桌面 Playwright（本地回退，Browser plugin 未安装）：1680×946、HTTP 200、14 个后端节点、初始 Replay disabled、run 6 个真实 tick 后 Replay enabled 并显示 verified；Inspector 可见 integration timeline root、active runtime unchanged、canonical state mutated=false。
- 真实 VSR 图像：640×360，footer 仍显示对应 viewport/source state root，状态 VERIFIED，未替换为参考图城市图或任何合成占位画面。
- 桌面布局实测：Reality Graph 1066×421；Inspector 388×846；Viewport 672.6×260；展开 Viewport 1074×806。中央图为最大交互区，Viewport 为底部主投影，Inspector 是独立决策栏。
- 移动 Playwright：390×844、14 nodes、computed lower grid 为单列 374px、scrollWidth=390，无横向溢出，无 console/page/request error。
- 截图：[concept desktop](C:/Users/User/.codex/visualizations/2026/09/15/rncs-reality-studio/concept-product-body-desktop.png)、[verified replay](C:/Users/User/.codex/visualizations/2026/09/15/rncs-reality-studio/concept-product-body-desktop-after-replay.png)、[expanded viewport](C:/Users/User/.codex/visualizations/2026/09/15/rncs-reality-studio/concept-product-body-desktop-expanded.png)、[mobile](C:/Users/User/.codex/visualizations/2026/09/15/rncs-reality-studio/concept-product-body-mobile.png)。

### 本轮改动与裁决

| 文件 | 变化 | 裁决 |
| --- | --- | --- |
| apps/reality-studio/web/reality-graph.html | 产品 chrome、概念图式 graph zones、Inspector kicker、明确 unavailable search | KEEP_SEPARATE：HTML 只拥有展示 |
| apps/reality-studio/web/reality-studio.css | 桌面产品构图、视觉 token、主/次关系、响应式布局 | KEEP_SEPARATE：CSS 不拥有 RNCS 语义 |
| apps/reality-studio/web/reality-studio.js | 曲线图边、真实 viewport/replay response 的 revision guard、可见 canonical-mutation 边界 | ADAPT：只消费 Adapter state，不复制 Runtime |
| apps/reality-studio/tests/web.test.mjs | 固化 Product Body 真实入口与无 offline/sample fallback 的静态回归 | EVIDENCE |

### 尚未完成项与风险

- 外观已向概念图的主次关系和桌面产品壳收敛，但不会用概念城市视频、CPU/GPU/FPS 数字、Agent Hub 任务或生产部署状态填满未接入区域。
- 搜索、打开、保存、场景视图、仿真配置、代码编辑器、部署仍为 disabled/unavailable；它们不是空成功按钮。
- Canonical combined tick、外部网络 transport、生产 authority、Agent Hub API、资源指标仍保持第 8/9 节的真实 gap 状态。
- 本次没有新增 RCL primitive，故无 Silent RCL Bypass；压力样本仍是“跨 Runtime 状态在 Product Body 中异步返回时不得回写旧证据”。该样本影响 CORRECT / ROBUST / EVIDENCE，但不构成 Canonical owner 晋升。

完整机器可读记录：[REALITY_STUDIO_CONCEPT_PRODUCT_BODY_EVIDENCE_v0.1.json](./REALITY_STUDIO_CONCEPT_PRODUCT_BODY_EVIDENCE_v0.1.json)。

## 11. 本地入口保护（2026-09-15）

用户截图验证到真实入口问题：浏览器地址是 file:///.../web/reality-graph.html。该 origin 没有 Reality Studio Adapter HTTP API；Edge 还会拒绝 file:// 页加载 ES module，因此前端请求逻辑没有执行。此前显示的“等待后端投影”是诚实的空态，但入口说明不足。

本次没有让 file:// 伪造 session。改动如下：

- HTML 初始态直接说明“直接打开 HTML 不包含 Runtime API”，并提供可点击的 http://127.0.0.1:17608/ 入口；此静态内容即使 ES module 被浏览器拦截也可见。
- JavaScript 在支持 file:// module 的环境中仍会主动进入 file-entry-required 状态，而不是尝试构造离线 Runtime。
- 启动Reality Studio原生版.bat 先检查现有 health endpoint；服务未启动时以隐藏本地 Node 进程启动真实服务、等待 health=200，再打开 HTTP 地址。它不再回退到旧离线工作台。

本地浏览器证据：file:// 页面为 protocol=file:、0 个 runtime node、无 Adapter API fetch、可见本地服务说明与目标链接；HTTP 页面为 200、14 个后端节点、runtime=healthy、初始入口说明已由真实 Graph 替换，且无 console error。

这项改动只解决 Product Body 的入口与真实性表达。它没有把 file:// 页面升级成离线 RNCS Runtime，也没有改变 production authority、external transport、Agent Hub 或资源指标的 unavailable/open 边界。

## 12. 参考色板与短屏投影适配（2026-09-15）

用户在真实 HTTP Studio 截图中指出尺寸失衡。复测确认这不是 Runtime 数据问题：高 DPI 桌面可在宽度充足的同时只有约 `680 CSS px` 的页面高度；此前主区域的最小行高会把下方 VSR 面板压到固定状态栏之后，且 VSR `<img>` 的 grid intrinsic size 会裁掉真实帧的下半部。

- Product Body 主色改为参考图的深海军蓝表面（`#0d1b24` / `#12212b`）和冷青蓝结构色（`#55caf6` / `#8be8ff`）；绿色、琥珀、红色继续只对应真实 healthy、pending、failed Runtime 状态。
- 宽屏短高度规则在 `max-height: 820px` 时为 header / graph / lower projection 分配 `78px / minmax(200px, 1fr) / 180px`，不通过浏览器缩放掩盖裁切。
- VSR 图像恢复为 `width/height: 100%`、`min-width/min-height: 0` 和 `object-fit: contain`：其 DOM box 被限制在真实 frame 内，画面完整显示；没有更换为概念图、合成城市画面或假 Preview。

本地 Playwright `1920×680` 证据：HTTP `200`、14 个 Adapter 节点、`scrollHeight=680`、无纵向溢出、Viewport `826×175`、Frame `814×106`、真实 verified 图像 box 在 frame 内、无 console/page error。标准桌面 `1680×946` 同样通过，真实 VSR 图像完整可见。截图：[标准桌面](C:/Users/User/.codex/visualizations/2026/09/15/rncs-reality-studio/reference-palette-desktop-final-fit.png)、[短屏桌面](C:/Users/User/.codex/visualizations/2026/09/15/rncs-reality-studio/reference-palette-short-desktop-final-fit.png)。

回归：`node --check web/reality-studio.js`、Adapter / Server / Web focused suite `16/16 PASS`、`git diff --check PASS`（只输出既有 CRLF 提示）。这轮没有修改任何 Runtime、Canonical owner 或真实 API；未接入能力仍保持 unavailable/experimental 边界。

## 13. 概念图级交互与审计窗产品化（2026-09-15）

本轮继续以参考概念图作为 Product Body 的 UI/UX 基线，但只消费当前 Adapter 的真实响应。重点不是增加一批“像节点”的装饰，而是让现有真实路径在产品界面中可读、可操作、可追溯。

### 变化与真实来源

| 区域 | 改动 | 真实性边界 |
| --- | --- | --- |
| Reality Graph | `projection` edges 增加类型颜色与 SVG 箭头；选中节点时由真实 `graph.edges` 推导相关链路高亮；候选区直接显示 `graph.branch_rows` 的 3 条 Reality Branch 评估与推荐分支 | 不新增 graph node，不复制 Branch Fabric；卡片 score/eligibility/recommended 全来自 Adapter |
| Commit / Promotion | 图层内增加 Gate 摘要，显示真实 Gate 状态、待处理 check 数和 local/production 边界 | production promotion 仍由后端明确返回 unavailable，不因视觉状态变成可用 |
| 投影视图控制 | 增加 zoom in/out、fit、grid toggle；状态只保存在浏览器 Product Body projection，按钮 tooltip 明确“不改写 RNCS 状态” | 不修改 canonical state、Runtime tick、selection 或 Evidence root |
| Logs | 后端事件由完整 JSON 改为关键标量 + 短 root 摘要；完整 `event.details` 保留在 row title，其他 Evidence/Inspector 仍可追溯 | 没有压缩或篡改事件事实；没有新增日志 |
| Logs search | `consoleSearch` 对真实 `event_tail` 做本地筛选 | 仅筛选当前 Session 已返回的数据，不冒充跨资源/全局索引 |

### 浏览器证据

- 本地 Python Playwright（Browser plugin 不可用）桌面 `1680×946`：HTTP `200`、14 nodes、16 edges、16 edge markers、3 branch cards、真实 VSR `VERIFIED`、无 page/console error。
- 交互路径：zoom `100%→110%`、grid off、fit 回 `100%`、点击 `RSR Runtime` 后真实 Inspector/导航同步，Run 到 tick `6`，Replay `verified` 且 `active runtime unchanged=true` / `canonical state mutated=false`；Candidate propose → authorize → local commit 后 Gate 为 `candidate-committed`，production promotion 仍 `UNAVAILABLE`。
- 日志摘要首行高度 `38px`，真实搜索 `viewport` 将日志过滤到 2 行；没有把完整 JSON 挤成不可读的长列。
- 短桌面 `1920×680`：document `scrollHeight=680`、无纵向溢出、Graph `1308×326`、Viewport `826×175`、Frame `814×106`、真实帧仍在 frame 内。
- 移动 `390×844`：document/body `scrollWidth=390`、单列 lower layout、14 nodes、真实 VSR VERIFIED、无横向溢出。
- 截图：[产品化图与真实分支](C:/Users/User/.codex/visualizations/2026/09/15/rncs-reality-studio/product-pass-console-summary.png)、[短屏桌面](C:/Users/User/.codex/visualizations/2026/09/15/rncs-reality-studio/product-pass-short-desktop.png)、[移动](C:/Users/User/.codex/visualizations/2026/09/15/rncs-reality-studio/product-pass-mobile.png)、[真实本地提交路径](C:/Users/User/.codex/visualizations/2026/09/15/rncs-reality-studio/product-pass-runtime-path-committed-local.png)。参考图仍为视觉基线：[reference](C:/Users/User/Downloads/ChatGPT%20Image%202026%E5%B9%B49%E6%9C%8815%E6%97%A5%20%E4%B8%8A%E5%8D%8801_27_59.png)。

### 本轮验证与缺口

- `node --check apps/reality-studio/web/reality-studio.js`：`PASS`。
- Adapter / Server / Web focused suite：`17/17 PASS`。
- `@taowind/reality-network-runtime`：`31/31 PASS`（已有能力回归）。
- `@taowind/reality-studio-native` 与 `world-body-studio-bridge` 的既有 sparse worktree / geometric-truth evidence blockers 未触碰、未伪装成通过。
- 未完成：真实全局 search index、open/save persistence、独立 camera state、Agent Hub、CPU/memory/GPU/FPS provider、外部 transport、production authority，以及 Canonical combined-tick owner。

### REUSE / ADAPT / KEEP_SEPARATE 裁决

- `REUSE`：Reality Branch rows、Commit Gate、VSR/RSR viewport、event/evidence roots 和所有现有 Runtime command API。
- `ADAPT`：Reality Studio JS 只把真实 edge/branch/event payload 投影成可读的产品层交互。
- `KEEP_SEPARATE`：zoom/grid/fit、搜索过滤、摘要排版、SVG marker 与 canonical RNCS semantics。
- No Silent RCL Bypass：没有新增 primitive 或迁移 owner；本轮压力样本继续映射 `CORRECT / ROBUST / EVIDENCE`，不自行宣布 K400 总体 PASS。

下一轮最高杠杆仍是：在不复制 Runtime 的前提下，等待/取得真实 camera/search/persistence owner contract；并继续保持 `unavailable / experimental` 的缺口可见。
