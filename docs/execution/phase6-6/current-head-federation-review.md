# Phase 6.6 Current-Head Federation Review

审计对象：`9c8f92f` on `codex/rncs-anime-forge-phase6-6-native-drawing-infrastructure-v01`  
基线：`origin/main-95=dc7cc8c`  
总裁决：`CANDIDATE`，先闭合 P0 Raster/证据/审片门；Face Grammar 暂不进入正式实现。

每个文明均回答：真实问题、最大结构风险、本轮不做什么、进入下一阶段所需证据。

## Founder Twin

- 真实问题：已有 Phase 6.6 代码还没有在当前 HEAD 形成可复现的真实媒体证据闭环。
- 最大结构风险：把“模块存在”或“PR 曾经失败”误当成当前 HEAD 已验证。
- 本轮不做什么：不把候选视觉结果提升为 Episode authority，不自动接受人审，不自动合并 #66。
- 下一阶段证据：当前 HEAD 的 120 帧、MP4、逐帧 Raster Receipt、Ledger、ZIP 和可复现日志。

## 柳清莲 Gate

- 真实问题：身份、几何、DrawingIR、art direction 与 raster execution 的边界需要落到回执字段。
- 最大结构风险：Raster Provider 通过绝对路径或隐含默认值改变 root，造成伪稳定性。
- 本轮不做什么：不允许 Provider 拥有 identity、canonical geometry、DrawingIR 或 art direction authority。
- 下一阶段证据：严格 logical path 校验、固定 provider pin、authority 全 false、跨 checkout root 稳定测试。

## 洞哥 Grounding

- 真实问题：Windows、FFmpeg、Playwright/Chromium、Node/npm 和 resvg/librsvg 才是当前可运行性的物理约束。
- 最大结构风险：本地缺工具时脚本仍输出“成功”，或把 billing 阻断写成代码失败。
- 本轮不做什么：不伪造 raster、MP4、ffprobe、CI clean-runner 或 Windows VERIFIED。
- 下一阶段证据：doctor 的 backend-aware 结果、真实工具版本、失败负例和环境日志。

## 产品文明

- 真实问题：交付目标是 Candidate → Executable Evidence → Human Review Ready，而不是继续堆视觉模块。
- 最大结构风险：没有可播放的媒体和审片入口，用户无法判断是否值得进入下一轮。
- 本轮不做什么：不在 P0 红项存在时进入 Face Grammar 或宣称商业动画质量。
- 下一阶段证据：一键入口从安装/doctor 到证据 ZIP 和 Human Review 的完整成功或明确失败链。

## UX / 设计文明

- 真实问题：Human Review 首屏必须显示能否播放、Raster 后端、证据根和失败原因。
- 最大结构风险：旧 JSON 残留、Accept 语义和开发预览混用，导致审片者看错 Artifact。
- 本轮不做什么：不让 partial validation 打开正式 Accept，不隐藏 Raster mismatch。
- 下一阶段证据：正确 bundle 可 ready、错误 root 为 integrity-failed、旧 accepted root 被标 stale，桌面/手机无异常。

## 数学 / 形式方法文明

- 真实问题：receipt set、manifest、backend receipt、Ledger、summary 必须形成单向一致性链。
- 最大结构风险：数量、集合、root 或版本只检查其中一层，允许部分伪通过。
- 本轮不做什么：不降低 SSIM/temporal 阈值，不用加权分数抵消失败，不把缺失证据当空集合通过。
- 下一阶段证据：3 + 120 = 123 的派生计数、集合等价、root 重算、fail-closed 负例。

## 图形 / 渲染文明

- 真实问题：AnimeDrawingIR → SVG → explicit raster 要有 librsvg 正式 baseline 和 resvg 兼容性证据。
- 最大结构风险：resvg 结果替代正式 librsvg baseline，或 SVG 几何差异被静默掩盖。
- 本轮不做什么：不改 canonical geometry 来迎合 rasterizer，不把 provider 变成创作权威。
- 下一阶段证据：同一真实 `static-gates/front.svg` 的 1280×720 A/B PNG、FFmpeg SSIM、版本和 receipt。

## 工程文明

- 真实问题：workflow、Windows runner、packager 和 verifier 还没有围绕同一 full-validation 状态闭合。
- 最大结构风险：跳过 full regression/browser review 仍打包正式 ZIP，或依赖安装污染 lockfile。
- 本轮不做什么：不让失败继续打包正式证据，不让 `-Skip*` 改变正式 Accept 语义。
- 下一阶段证据：一键步骤 fail-fast、skip 状态不可发布、完整 manifest/sha256、可复现重跑。

## 代码文明

- 真实问题：现有 Provider API、receipt schema 和路径语义不足以支撑跨环境审计。
- 最大结构风险：在多个脚本中复制 backend 判断，修一处漏一处。
- 本轮不做什么：不另造第二套 Raster Provider，不用隐式 `path.resolve` 生成 evidence identity。
- 下一阶段证据：单一 Provider contract、共享验证函数、节点测试覆盖正常/错误/缺依赖路径。

## 测试文明

- 真实问题：现有 focused tests 偏 source/unit，缺真实 120 帧、Receipt Ledger 和 Review root 负例。
- 最大结构风险：只跑容易的单测，遗漏真实构建和浏览器回归。
- 本轮不做什么：不删除 Phase 3/6.5/6.6 测试，不通过放宽阈值消除失败。
- 下一阶段证据：focused suite、workspace suite、real build、spatial、temporal、raster、binding、browser 全部有日志。

## 安全文明

- 真实问题：logical evidence path、ZIP 内容和 launcher 输入必须防止路径穿越与错误 Artifact 读取。
- 最大结构风险：绝对路径/`..` 进入 root，或旧目录 JSON 被复用。
- 本轮不做什么：不信任用户提供的 receipt root，不在 packager 中跟随工作树外路径。
- 下一阶段证据：路径拒绝测试、Artifact 目录替换测试、manifest/sha256 校验和失败关闭。

## 发布文明

- 真实问题：发布状态必须区分工程证据通过、等待人审、CI billing 阻断和代码失败。
- 最大结构风险：ZIP 或 GitHub Checks 造成过度承诺。
- 本轮不做什么：不将本地 PASS 冒充 clean-runner PASS，不发布 human_visual_acceptance=accepted。
- 下一阶段证据：证据包 manifest、ZIP/sha256、CI 原始状态、PR 差异审阅和明确未决项。

## Integration Court

- 预裁决：`CANDIDATE`，因为 Raster P0 尚未在当前 HEAD 运行。
- 当前阻断：Raster receipt root 语义、123 receipt set、Review stale/root gate、Windows full-validation gate、真实媒体重跑均未验证。
- 允许进入 READY 的条件：十项集成问题全部为“否”，且不存在 CI 状态误标、人审自动推进、旧证据复用或依赖污染。

## Evidence Ledger

- 当前状态：只有候选源代码和历史 PR 运行事实；不承认旧 Artifact 为本轮 Ledger。
- 需要绑定：Static Gates ↔ Frame Manifest ↔ Raster Provider Receipts ↔ Backend Receipt ↔ Direct Visual Bridge ↔ Temporal Evidence ↔ Evidence Ledger ↔ Evidence Summary。
- 人审边界：工程证据成功后仍只允许 `human_visual_acceptance=pending`；只有真人审片后才可改变该字段。
- 下一阶段产物：当前 HEAD Evidence Ledger、receipt set root、ffprobe report、MP4/ZIP SHA-256、验证日志和 Human Review bundle。

## Federation Gate

本轮允许开始 P0 代码修复，原因是问题、风险、禁止事项和所需证据已记录，且新 worktree 已从最新 `main-95` 隔离建立。任何 Face Grammar 实现都必须等待 P0 engineering closure 通过。

## Federation Execution Record

执行顺序保持为：Founder Twin → 柳清莲 Gate → 洞哥 Grounding → 产品文明 → UX / 设计文明 → 数学 / 形式方法文明 → 图形 / 渲染文明 → 工程文明 → 代码文明 → 测试文明 → 安全文明 → 发布文明 → Integration Court → Evidence Ledger。

- `Founder Twin / 柳清莲 Gate / 洞哥 Grounding`: 当前头已形成真实媒体与工具边界证据；identity、genome、morphology、DrawingIR、art direction 和 Raster backend authority 分离，机器路径不再进入 ffprobe/raster identity。
- `产品文明 / UX / 设计文明`: 一键本地链路可执行；Reality Studio 首屏增加 Raster backend、provider、version、receipt count、root 和失败原因；旧 schema 需要显式迁移，Accept 不自动提交或改变 Episode authority。
- `数学 / 形式方法文明`: 3 static + 120 frame = 123 receipts、set root、backend root、frame manifest、continuity、temporal、Ledger 和 summary 已绑定并由 verifier 重算；fail-closed 负例通过。
- `图形 / 渲染文明`: Windows `resvg-js@2.6.2` 真实 raster 已运行；同一 `static-gates/front.svg` 的 librsvg A/B 仍等待 Linux/CI，SSIM 阈值未降低。
- `工程 / 代码文明`: doctor 按 backend 选择依赖；VideoMuxProvider 的 ffprobe 证据路径已逻辑化；Windows runner、workflow、packager 和 verifier 使用同一 full-validation 边界。
- `测试文明`: Focused `78/78`、完整 workspace `117/117`、Runtime media contract `7/7`、Reality Studio 桌面/手机浏览器回归均通过；确定性双构建 `10/10` 比较字段一致。
- `安全文明`: absolute/UNC/traversal receipt path、旧 review root、Raster provider mismatch、缺 MP4 和缺 FFmpeg 负例均 fail closed；未跟踪的旧工作树未被读取为当前 Artifact。
- `发布文明`: 证据摘要只标记 `engineering-evidence-passed-awaiting-human-review`；ZIP 仅作 review handoff，不自动 commit/merge；最终状态仍 `CANDIDATE`。
- `Integration Court`: 工程媒体闭环可进入 `Executable Evidence`，但不能进入最终 `VERIFIED`，阻断项为 Linux librsvg parity、有效 GitHub CI、人工视觉接受和商业画质声明边界。
- `Evidence Ledger`: 当前本地 Ledger root 为 `6bd85f6b182f417f2cf67821d539163be3e338f11081da5bcf1be0f636b9a919`；Raster receipt set root 为 `ae6c298d47dc4ac2b9ed6476d3ed56d7c89ed0c395ca6a0ab65682cca788525e`；direct visual、temporal、character/cut/sync roots 均已写入摘要和证据包。

### Federation Verdict

`CANDIDATE / EXECUTABLE_EVIDENCE / HUMAN_REVIEW_READY`。本记录不授权自动合并、不授权自动接受视觉结果，也不把本机 Windows provider 运行冒充 Linux librsvg parity。
