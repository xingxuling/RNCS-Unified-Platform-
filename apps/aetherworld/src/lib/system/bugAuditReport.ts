// Aetherworld 内测 Bug 检查报告（v0.1）
// 本文件为静态报告数据，由人工 + 代码上下文综合扫描后产出。
// 仅用于 /system-bug-audit 页面展示，不参与生产链路。

export type BugSeverity = "BLOCKER" | "HIGH" | "MEDIUM" | "LOW";
export type BugStatus = "AUTO_FIXED" | "NEEDS_REVIEW" | "OPEN" | "WONT_FIX";

export interface BugItem {
  id: string;
  module: string;
  page: string;
  severity: BugSeverity;
  description: string;
  reproduce: string;
  suggestion: string;
  status: BugStatus;
}

export interface PendingFeature {
  id: string;
  category: string;
  title: string;
  current: string;
  blocking: boolean;
  priority: "P0" | "P1" | "P2" | "P3";
  nextStep: string;
}

export const BUG_REPORT: BugItem[] = [
  {
    id: "BUG-001",
    module: "模型提供者",
    page: "/llm-providers/settings",
    severity: "MEDIUM",
    description: "Ollama 连接失败原本只显示 raw 'Failed to fetch'，缺少中文诊断。",
    reproduce: "未启动 Ollama 时点击检测。",
    suggestion: "已新增中文诊断卡片与终端命令复制。",
    status: "AUTO_FIXED",
  },
  {
    id: "BUG-002",
    module: "日历",
    page: "/trigger-calendar",
    severity: "LOW",
    description: "旧入口未重定向。",
    reproduce: "访问 /trigger-calendar。",
    suggestion: "已 Navigate 重定向到 /calendar。",
    status: "AUTO_FIXED",
  },
  {
    id: "BUG-003",
    module: "对话 Chat",
    page: "/chat",
    severity: "HIGH",
    description: "当所有 Provider 不可用时，Chat 仍应能进入规则模式 fallback，需确认未出现卡死。",
    reproduce: "禁用 WebLLM + Ollama + Lovable AI 后发送消息。",
    suggestion: "在 aetherChatRuntime 中确保 catch 后降级到规则模板，并写入 DISPLAY_RESULT。",
    status: "NEEDS_REVIEW",
  },
  {
    id: "BUG-004",
    module: "代码沙箱",
    page: "/code-sandbox",
    severity: "MEDIUM",
    description: "v0.2 仍为模拟执行，UI 必须始终标注「模拟 / Demo」字样，禁止伪装为真实运行。",
    reproduce: "运行任意代码任务，观察结果卡。",
    suggestion: "已在 codeSandboxQaBridge 检查模拟越权声明，UI 需保留 modeNote。",
    status: "OPEN",
  },
  {
    id: "BUG-005",
    module: "Patch 草案",
    page: "/code-sandbox",
    severity: "MEDIUM",
    description: "高风险 Patch 必须强制 requiresHumanReview=true，避免被误认为「已应用」。",
    reproduce: "生成 HANDOFF_PATCH / FILE_REWRITE 类型 Patch。",
    suggestion: "codePatchDraftEngine 已强制 requiresHumanReview，UI 文案需明示「未写入文件」。",
    status: "NEEDS_REVIEW",
  },
  {
    id: "BUG-006",
    module: "社交",
    page: "/social/publish",
    severity: "HIGH",
    description: "默认可见性必须为 PRIVATE，禁止默认 PUBLIC，防止内测期意外泄漏。",
    reproduce: "进入发布面板，查看默认 visibility。",
    suggestion: "SocialVisibilitySelector 应默认 PRIVATE，QA BLOCK 时禁止提交。",
    status: "NEEDS_REVIEW",
  },
  {
    id: "BUG-007",
    module: "社交",
    page: "/social/publish",
    severity: "BLOCKER",
    description: "Founder-only 内容、Full60 原始数列、apiKey/token 必须在发布闸中阻断。",
    reproduce: "尝试发布带敏感字段的对象。",
    suggestion: "已新增 socialPublishPermissionGuard + socialSecretFilter + 发布审计；BLOCK 不可被覆盖。",
    status: "AUTO_FIXED",
  },
  {
    id: "BUG-008",
    module: "工作区",
    page: "/workspace",
    severity: "MEDIUM",
    description: "保存对象后页面未刷新，需要确认 Chat 结果保存后能在 Workspace 立刻可见。",
    reproduce: "在 Chat 中点击「保存到工作区」后切到 /workspace。",
    suggestion: "wrapResultAsMessage 写入后应触发 workspace 列表 invalidation。",
    status: "OPEN",
  },
  {
    id: "BUG-009",
    module: "商店",
    page: "/store",
    severity: "MEDIUM",
    description: "WebXXM 安装状态目前为 localStorage 模拟，需明确「未真实下载」提示。",
    reproduce: "安装任意能力包后查看状态。",
    suggestion: "在 StoreItemCard 顶部增加「内测：状态为本地模拟」徽标。",
    status: "OPEN",
  },
  {
    id: "BUG-010",
    module: "Lovable 能力",
    page: "/integrations/lovable",
    severity: "LOW",
    description: "部分能力（GitHub Sync / MCP）目前仅有建议文案，缺少真实连接状态。",
    reproduce: "查看 Lovable 能力页。",
    suggestion: "标注「未接入」与「建议」状态，避免误以为已配置。",
    status: "OPEN",
  },
  {
    id: "BUG-011",
    module: "导航",
    page: "全局",
    severity: "LOW",
    description: "移动端底部导航与左侧导航存在重复入口，需要保持选中态一致。",
    reproduce: "在移动视口切换路由。",
    suggestion: "MobileBottomNav 与 MinimalSidebar 共用 activeProps 规则。",
    status: "NEEDS_REVIEW",
  },
  {
    id: "BUG-012",
    module: "对话结果卡",
    page: "/chat",
    severity: "MEDIUM",
    description: "部分结果卡缺少 QA 状态徽标或下一步动作。",
    reproduce: "触发 WebCodeM / App Runtime / Patch 等结果。",
    suggestion: "normalizeDisplayResult 应保证 qa 与 actions 至少有缺省值。",
    status: "NEEDS_REVIEW",
  },
  {
    id: "BUG-013",
    module: "Real WebLLM",
    page: "/real-webllm",
    severity: "HIGH",
    description: "WebGPU 不可用时需明确中文降级提示，禁止界面长时间无反馈。",
    reproduce: "在不支持 WebGPU 的浏览器打开页面。",
    suggestion: "RealWebLlmPanel 在加载失败时显示降级卡片，并指向规则模式。",
    status: "OPEN",
  },
  {
    id: "BUG-014",
    module: "系统",
    page: "/system-audit",
    severity: "LOW",
    description: "审计表中部分模块缺少最新状态，建议接入自动统计。",
    reproduce: "打开系统审计页。",
    suggestion: "下一轮接入 runtime metric。",
    status: "OPEN",
  },
  {
    id: "BUG-015",
    module: "运行时",
    page: "全局",
    severity: "BLOCKER",
    description: "偶发 'Failed to fetch dynamically imported module: virtual:tanstack-start-client-entry'，通常是 dev server 重启或网络抖动导致。",
    reproduce: "Vite dev server 重启后首屏。",
    suggestion: "需在 __root errorComponent 中提供「刷新页面」按钮（已有），并监控复现频率。",
    status: "NEEDS_REVIEW",
  },
  {
    id: "BUG-016",
    module: "安全",
    page: "全局",
    severity: "BLOCKER",
    description: "apiKey / token / secret 需要在模型上下文、社交发布、Workspace 保存前统一脱敏。",
    reproduce: "向 Chat 输入含 sk-/ghp_/Bearer 等字符串。",
    suggestion: "已新增 secretGuard / secretRedactor / modelContextSanitizer，并接入 LlmProviderRuntime 与 SocialPublishGuard。",
    status: "AUTO_FIXED",
  },
  {
    id: "BUG-017",
    module: "社交",
    page: "/social/publish",
    severity: "HIGH",
    description: "PUBLIC 发布需要确认弹窗 + 后端化；Demo / 未登录态不得真实公开。",
    reproduce: "在 Demo 模式选择 PUBLIC 发布。",
    suggestion: "已新增 PUBLIC 二次确认、socialVisibilityGuard 检测 Demo / 匿名态自动降级 PRIVATE。",
    status: "AUTO_FIXED",
  },
  {
    id: "BUG-018",
    module: "社交",
    page: "/social/audit",
    severity: "MEDIUM",
    description: "社交发布缺少行为审计，无法追溯 PUBLISH / BLOCK 历史。",
    reproduce: "发布或被阻断后查看审计页。",
    suggestion: "已新增 SocialPublishAudit，Founder 可在 /social/audit 查看完整审计。",
    status: "AUTO_FIXED",
  },
  {
    id: "BUG-019",
    module: "模型提供者",
    page: "/llm-providers/settings",
    severity: "HIGH",
    description: "前端直连 Ollama 容易被浏览器 CORS / HTTPS→HTTP 限制阻断（终端 curl 可用但页面 Failed to fetch）。",
    reproduce: "在 https 站点上让前端 fetch http://localhost:11434/api/tags。",
    suggestion: "已引入 Aether Local Gateway 架构：前端优先经本地网关（默认 18777）转发到 Ollama，并在「模型提供者」页新增 Gateway 状态卡 + 自动发现；不可用时回落 WebLLM / 规则模式。Gateway 模板见 /local-gateway。",
    status: "AUTO_FIXED",
  },
  {
    id: "BUG-SCHED-001",
    module: "调度中枢",
    page: "/scheduler",
    severity: "LOW",
    description: "缺少统一任务编排层，跨模块任务难以追踪。",
    reproduce: "Chat 创建 App / 设置提醒 / 触发预测 复查 时无统一入口。",
    suggestion: "新增 Aether Scheduler Runtime v0.1：统一 AetherTask 数据结构 + 状态机 + Chat/Prediction/Calendar/Workspace/Store/Social/Code 桥接 + MSL / 货币 / 记忆审计接入。",
    status: "AUTO_FIXED",
  },
  {
    id: "BUG-LEGACY-001",
    module: "旧模块治理",
    page: "/system/legacy-modules",
    severity: "LOW",
    description: "项目中存在大量历史 / 老系统资产，缺少统一登记与接入规划。",
    reproduce: "查询「虚拟生活 OS / 产品自进化 / 记录中心」等模块的当前状态时无统一入口。",
    suggestion: "新增 Aether Legacy Module Registry v0.1：建立 LegacyModule 数据结构 + 登记表 + Activation Map + Chat / Scheduler / Prediction 桥接 + /system/legacy-modules 页面。",
    status: "AUTO_FIXED",
  },
  {
    id: "BUG-AGENT-001",
    module: "数列 Agent",
    page: "/system/agents",
    severity: "LOW",
    description: "已有数列角色 / 数字角色未升级为可被 Chat / Scheduler / Fusion 调用的 Agent 运行时。",
    reproduce: "Chat 输入「让架构 Agent 分析下一步」时无法触发多 Agent 评审。",
    suggestion: "新增 Sequence Agent Runtime v0.1：复用 DIGITAL_ROLE_REGISTRY + 初始化 10 位系统 Agent + Router / Coordinator / Safety / Permission + Chat / Scheduler / MSL / Currency / Memory / Analytics 桥接 + /system/agents 页面 + Chat 结果卡。",
    status: "AUTO_FIXED",
  },
  {
    id: "BUG-MANUAL-001",
    module: "总说明书",
    page: "/system/manual",
    severity: "LOW",
    description: "Aetherworld 缺少统一的项目内部宪法 / 架构总览 / 开发索引 / 路线图文档。",
    reproduce: "新一轮开发或外部 AI 接续时需要重新拼凑上下文，容易遗漏安全边界和已建系统。",
    suggestion: "新增 Aetherworld 总说明书 v0.1：/system/manual 页面 + 章节折叠 + 复制系统总览 / 开发接续摘要按钮 + Chat 桥接。",
    status: "AUTO_FIXED",
  },
  {
    id: "BUG-RECORD-001",
    module: "记录中心",
    page: "/system/record-center",
    severity: "LOW",
    description: "缺少统一事实记录层，回验中心 / 记录权重 / 产品自进化无法读取原始事实。",
    reproduce: "Chat / Model / Fusion / Memory / Currency / MSL / Prediction / Scheduler 完成后无统一 RecordEvent 写入。",
    suggestion: "新增 Aether Record Center Bridge v0.1：RecordEvent 数据结构 + Store + ImportanceScorer + SafetyPolicy + 14 类来源 Bridge 统一函数 + /system/record-center 页面 + Chat 查询桥接。预留回验中心 / 记录权重字段。",
    status: "AUTO_FIXED",
  },
  {
    id: "BUG-OA-001",
    module: "开源架构吸收",
    page: "/system/open-architecture",
    severity: "LOW",
    description: "缺少把外部开源项目 / Agent 架构 / 插件系统结构化吸收为 Aetherworld 内部资产的统一运行时。",
    reproduce: "用户粘贴 README / 描述时无统一分析、映射、桥接计划生成路径。",
    suggestion: "新增 Aether Open Architecture Absorption Runtime v0.1：OpenArchitectureSource / Analysis / BridgePlan / WebXXMPackageDraft 数据结构 + Scanner + Analyzer + AetherMapper + BridgePlanner + SafetyPolicy + Runtime 编排 + Chat 桥接 + /system/open-architecture 工作台 + 9 类内部桥接（Record / Memory / MSL / Currency / Workspace / Scheduler / Agent / Sequence AI / Store）容错调用。严格禁止自动执行 / 自动安装 / 自动复制源码 / 绕过 License。",
    status: "AUTO_FIXED",
  },
  {
    id: "BUG-NET-001",
    module: "联网中心",
    page: "/system/network",
    severity: "LOW",
    description: "缺少受控联网层：读取公开网页 / GitHub README / 官方文档 / API 文档 / 模型卡片的统一入口缺失。",
    reproduce: "用户给出 URL 时系统无法只读读取并转成 Aetherworld 内部对象。",
    suggestion: "新增 Aether Network Runtime v0.1：NetworkSource / NetworkReadRequest 数据结构 + WebReader（CORS 失败回退手动粘贴）+ SourceExtractor + TrustScorer + SafetyPolicy + PermissionGuard + 9 类内部桥接（Record / MSL / Memory / Currency / Workspace / Scheduler / OpenArchitecture / Verification） + Chat 桥接 + /system/network 工作台。严格禁止自动登录 / 表单 / 安装 / 运行 / 公开发布。",
    status: "AUTO_FIXED",
  },
  {
    id: "BUG-PF-001",
    module: "项目融合",
    page: "/system/project-fusion",
    severity: "LOW",
    description: "缺少把同账号其他 Lovable 项目的代码、组件、数据结构、UI 模式系统化融合进 Aetherworld 的统一运行时。",
    reproduce: "面对「同账号项目里有什么可以融合？」类问题，系统无法做扫描 → 识别 → 映射 → 对比 → 冲突检测 → 桥接计划 → 审计。",
    suggestion: "新增 Aether Same-Account Project Fusion Runtime v0.1：SameAccountProjectCandidate / ProjectFusionPlan / ProjectFusionResult 数据结构 + Scanner（11 类项目类型识别）+ Analyzer + Mapper（→ Aetherworld 主干）+ ConflictDetector（路由 / 类型 / Shell 守卫）+ BridgePlanner（按风险分级 LOW/MEDIUM/HIGH）+ SafetyPolicy（敏感信息脱敏 + 高风险黑名单）+ Record / Workspace / Scheduler 桥接 + Chat 桥接 + /system/project-fusion 工作台。严格禁止自动迁移 Auth / Payment / DB schema / 外部 API。",
    status: "AUTO_FIXED",
  },
  {
    id: "BUG-IF-001",
    module: "畅想融合",
    page: "/system/imaginative-fusion",
    severity: "LOW",
    description: "缺少把同账号项目的概念、UI 模式、玩法机制、世界观跨域组合为 Aetherworld 新模块 / 子产品 / 能力包 / Agent 工具的畅想运行时。",
    reproduce: "用户提出「畅想 / 脑暴跨项目融合」时，系统只能复用代码级 project-fusion，无法生成产品级 / 工作流 / 世界 / 商业组合创意。",
    suggestion: "新增 Aether Imaginative Project Fusion Runtime v0.1：ProjectConceptSeed / ImaginativeFusionIdea / ImaginativeFusionReport / WebXXMPackageIdea 数据结构 + ConceptExtractor + IdeaGenerator（9+ 跨域模板，覆盖 PRODUCT / WORKFLOW / AGENT / WORLD / STORE / BUSINESS）+ Scorer（价值 / 难度 / 契合 / 新颖）+ RoadmapBuilder + Workspace / Scheduler / Store / Agent / Record / MSL / Memory 桥接 + Chat 桥接 + /system/imaginative-fusion 工作台。仅生成创意与草案，禁止自动改代码 / 合并项目 / 引入依赖 / 创建后端表 / 调外部 API / 公开发布 / 上架 / 部署。",
    status: "AUTO_FIXED",
  },
  {
    id: "BUG-LPF-001",
    module: "项目融合",
    page: "/system/project-fusion · /system/lovable-pass",
    severity: "MEDIUM",
    description: "原 /system/project-fusion 与 Chat 卡片用词暗示「Aetherworld 运行时正在扫描你的 Lovable 同账号项目」，但运行时并无此能力，存在误导。",
    reproduce: "在 Chat 询问「同账号项目里有什么可以融合？」时，旧实现会基于示例模板伪生成扫描结果。",
    suggestion: "新增 Aether Lovable Same-Account Project Fusion Pass v0.1：(1) 由 Lovable 开发环境通过 cross_project 工具真实读取 50 个同账号项目元数据 + 4 个项目（Local Logic Shell / Cognitive Console / NPC Dialogue Weaver / Aetherion Seed）目录采样后，写入 src/lib/project-fusion/lovablePassScanReport.ts；(2) 新增只读页 /system/lovable-pass 展示真实报告 / 高价值项目 / Bridge Plan / 阻断列表；(3) 修改 /system/project-fusion 文案，明确为「离线登记工作台」，不再声称扫描账号；(4) 修改 Chat Bridge：增加 runtimeDisclaimer，消费已保存报告而非伪造，未登记候选时如实告知去 /system/lovable-pass。本轮未自动迁移任何源代码，所有 LOW 项保留为待 Founder 确认的皮肤/接入策略，MEDIUM/HIGH 项一律为 Bridge Plan。",
    status: "AUTO_FIXED",
  },
  {
    id: "BUG-LSGA-001",
    module: "分层审计",
    page: "/system/layer-audit",
    severity: "MEDIUM",
    description: "缺少按 L0-L10 + 骨架 / 肌肉 / 血液 / 神经四象进行系统级缺口审计的统一入口，导致补丁化开发难以收敛。",
    reproduce: "用户提出「Aetherworld 现在哪一层最缺 / 哪些层没接 Record / 用系统式补法分析」时，无统一报告可参考。",
    suggestion: "新增 Aether Layered System Gap Audit v0.1：LayerGapReport / LayerGapItem / LayerAspectStatus / LayerCompletionAction + LAYER_DEFINITIONS（L0-L10）+ LAYER_ASPECT_SNAPSHOTS（44 个静态四象快照）+ Scanner + Planner（按缺口自动产出 P0/P1 动作 + Lovable 提示词草案）+ Chat Bridge（detectLayerAuditIntent + ChatLayerAuditCard）+ /system/layer-audit 工作台 + Workspace / Bug Audit 桥接。仅做读静态分析与建议，不修改源代码、不创建表、不调外部 API。",
    status: "AUTO_FIXED",
  },
  {
    id: "BUG-PMF-001",
    module: "个人模型铸造工坊",
    page: "/system/personal-model-forge",
    severity: "MEDIUM",
    description: "缺少把 Lovable / Ollama / Cursor / Codex / WorkBuddy / Aetherworld / 本机 PC / GPU 服务器 / 受控联网纳入统一训练文明工坊的运行时，导致「本机能否训练 AetherSeed」长期被误判为不可行。",
    reproduce: "用户作为单人文明编译者询问「我的电脑能训练什么 / 晚上慢慢跑什么 / Lovable / Ollama / Cursor / Codex 在训练体系里分别是什么角色」时，缺少统一的工具链地图、本机慢速训练计划、服务器爆发计划与 AetherSeed 血统线。",
    suggestion: "新增 AetherSeed Personal Model Forge v0.1：ForgeTool / ForgeExperiment / ModelBloodlineStage / PersonalModelForgeReport 数据结构 + ToolchainRegistry（9 个工具登记，含本机=慢速训练炉 / 服务器=爆发训练炉定位）+ LocalForgePlanner（Tokenizer / 10M / 50M / 100M / Router / MSL / LoRA 7 项夜间可跑实验）+ ServerForgePlanner（300M / 700M / 1.5B / 3B / 7B 5 项 + 上服务器检查清单）+ ModelBloodlinePlanner（AetherSeed 8 级血统线）+ SlowTrainingScheduler（夜间 / 白天 / 周末窗口建议）+ DataFlowPlanner（语料资产 + 文明种子编译法 6 象解释 + 单人时间模型）+ Workspace / Record / MSL / Analytics / Toolchain 桥接 + Safety Policy（禁止自动上传 / 调外部服务器 / 假训练 / 误判耗时长不可行）+ Chat Bridge（detectPersonalModelForgeIntent + 8 类焦点 + ChatPersonalModelForgeCard）+ /system/personal-model-forge 工作台。仅生成训练计划与工具链地图，不真正执行训练。",
    status: "AUTO_FIXED",
  },
  {
    id: "BUG-IF-001",
    module: "投喂式训练数据铸造炉",
    page: "/system/intake-forge",
    severity: "MEDIUM",
    description: "缺少把「粘贴 / 文件 / 文件夹」一键转成训练样本候选与评测候选的入口，导致 ChatGPT 压缩对话 / Lovable Prompt / Lovable 返回 / MSL / 项目文件夹等高价值语料必须手动整理，沉淀效率低。",
    reproduce: "用户希望「我只负责扔进来，剩下你自己搞定」时，没有统一的投喂窗口与流水线（识别 → 脱敏 → 切片 → 样本 → 评测 → 任务建议）。",
    suggestion: "新增 AetherSeed Intake Forge v0.1：IntakeItem / IntakeChunk / IntakeCompiledOutput / IntakeEvalItem / IntakeForgeRun 数据结构 + 20+ SourceType 与 25+ SampleType 自动分类 + 安全策略（允许后缀白名单 / 禁止后缀 / Full60 / Founder-only / 密钥脱敏，禁止全盘扫描与外部上传）+ Source Classifier / Text Extractor / Sanitizer / Chunker / Deduplicator / Sample Compiler / Eval Generator / Training Task Planner + Folder Processor（webkitdirectory 过滤）+ Runtime（runIntakeFromPaste / runIntakeFromFiles）+ Workspace / Record / MSL / Analytics 桥接草案 + Chat Bridge（detectIntakeForgeIntent + 6 类焦点 + ChatIntakeForgeCard）+ /system/intake-forge 工作台（粘贴 / 文件 / 文件夹三入口 + 实时分类切片 + 编译输出 + 评测候选 + 训练任务草案）。仅生成训练样本候选，不真正训练、不自动上传、不读取整盘。",
    status: "AUTO_FIXED",
  },
];

export const PENDING_FEATURES: PendingFeature[] = [
  // A. 核心链路
  { id: "PF-A1", category: "核心链路", title: "Code Sandbox 真实执行", current: "v0.2 模拟运行", blocking: false, priority: "P1", nextStep: "评估在浏览器 iframe 沙箱或 Lovable Cloud 中真实运行的可行性。" },
  { id: "PF-A2", category: "核心链路", title: "Patch 草案应用到文件", current: "仅生成文本草案", blocking: false, priority: "P1", nextStep: "通过 Handoff Pack 移交 Codex/Cursor/Lovable。" },
  { id: "PF-A3", category: "核心链路", title: "Handoff Pack 完整导出", current: "可生成摘要，缺少打包下载", blocking: false, priority: "P2", nextStep: "新增 zip 导出与 Lovable Build URL 一键跳转。" },

  // B. 模型层
  { id: "PF-B1", category: "模型层", title: "WebLLM 真实加载稳定性", current: "已接入 @mlc-ai/web-llm", blocking: false, priority: "P1", nextStep: "WebGPU 不支持降级、模型缓存清理。" },
  { id: "PF-B2", category: "模型层", title: "WebLCM / WebLKM 实现", current: "结构占位", blocking: false, priority: "P2", nextStep: "明确数据来源与索引格式。" },
  { id: "PF-B3", category: "模型层", title: "Ollama 真实流式调用", current: "配置 + 诊断完成", blocking: false, priority: "P1", nextStep: "接入 /api/chat 流式响应。" },
  { id: "PF-B4", category: "模型层", title: "Stop Generation", current: "未实现", blocking: false, priority: "P2", nextStep: "为流式 Provider 统一 AbortController。" },

  // C. 后端 / 用户
  { id: "PF-C1", category: "后端 / 用户", title: "Workspace 云同步", current: "localStorage", blocking: false, priority: "P1", nextStep: "迁移到 Lovable Cloud (Supabase) 并加 RLS。" },
  { id: "PF-C2", category: "后端 / 用户", title: "真实登录态", current: "基础 useAuth 已存在", blocking: false, priority: "P1", nextStep: "全量串接邮箱 + Google 登录。" },
  { id: "PF-C3", category: "后端 / 用户", title: "社交权限后端化", current: "云端表已建 + RLS 已配置 + 后端二次校验 server fn 就位", blocking: false, priority: "P0", nextStep: "登录态打通后切换到 securePublishPost；详见 /system-backend-security。" },

  // D. 商店
  { id: "PF-D1", category: "商店", title: "能力包真实下载/安装", current: "状态切换", blocking: false, priority: "P1", nextStep: "建立 manifest + 版本依赖检查。" },
  { id: "PF-D2", category: "商店", title: "更新/卸载流程", current: "占位", blocking: false, priority: "P2", nextStep: "完善 lifecycle 钩子。" },

  // E. 日历
  { id: "PF-E1", category: "日历", title: "定时触发真实执行", current: "提醒展示", blocking: false, priority: "P1", nextStep: "前台 tick + Service Worker 通知。" },
  { id: "PF-E2", category: "日历", title: "周期任务", current: "未完整", blocking: false, priority: "P2", nextStep: "扩展 trigger 类型，支持 RRULE。" },

  // F. 社交
  { id: "PF-F1", category: "社交", title: "动态流后端化", current: "social_posts / reactions / comments / collections / audits 已建表 + RLS 配置完成", blocking: false, priority: "P0", nextStep: "切换 socialCloudAdapter.available=true 并改写 publishPost → securePublishPost。" },
  { id: "PF-F2", category: "社交", title: "评论 / 点赞 / 收藏持久化", current: "本地", blocking: false, priority: "P1", nextStep: "迁移到 Cloud。" },

  // G. 工作区
  { id: "PF-G1", category: "工作区", title: "对象版本记录", current: "缺失", blocking: false, priority: "P2", nextStep: "新增 version 表与 diff 视图。" },
  { id: "PF-G2", category: "工作区", title: "对象搜索 / 筛选", current: "基础", blocking: false, priority: "P2", nextStep: "新增筛选条与全文搜索。" },

  // H. Lovable
  { id: "PF-H1", category: "Lovable 能力", title: "Build URL 一键打开", current: "已生成 URL", blocking: false, priority: "P1", nextStep: "在 Chat 结果卡内增加「在 Lovable 中继续」按钮。" },
  { id: "PF-H2", category: "Lovable 能力", title: "Lovable AI Provider", current: "已注册", blocking: false, priority: "P2", nextStep: "在 LLM Providers 列表中默认显示。" },
  { id: "PF-H3", category: "Lovable 能力", title: "GitHub Sync", current: "仅建议", blocking: false, priority: "P3", nextStep: "接入官方连接器。" },

  // I. UI / UX
  { id: "PF-I1", category: "UI / UX", title: "移动端结果卡简化", current: "已开始", blocking: false, priority: "P2", nextStep: "对所有 ChatDisplayResult 卡片做窄屏 QA。" },
  { id: "PF-I2", category: "UI / UX", title: "首次引导 Onboarding", current: "部分存在", blocking: false, priority: "P2", nextStep: "梳理首次进入主链路的引导。" },

  // J. 安全
  { id: "PF-J1", category: "安全 / 治理", title: "apiKey/token 上下文过滤", current: "已统一脱敏（modelContextSanitizer）", blocking: false, priority: "P0", nextStep: "后续接入更多 Provider 时保持调用链。" },
  { id: "PF-J2", category: "安全 / 治理", title: "Founder-only / Full60 边界", current: "前端过滤 + 后端 is_founder() helper + social_posts RLS FOUNDER_ONLY 仅 Founder 可读", blocking: false, priority: "P0", nextStep: "需人工授予首位 Founder 账号 user_roles.role='founder'。" },
  { id: "PF-J3", category: "安全 / 治理", title: "删除确认弹窗统一", current: "部分入口缺失", blocking: false, priority: "P2", nextStep: "封装通用确认组件并替换。" },
  { id: "PF-J4", category: "安全 / 治理", title: "审计日志", current: "已新增 Scheduler 审计 + 既有 System Audit", blocking: false, priority: "P2", nextStep: "统一审计日志通道。" },

  // K. Scheduler（v0.1 已接入）
  { id: "PF-K1", category: "调度", title: "Scheduler 后台持久队列", current: "localStorage 队列", blocking: false, priority: "P1", nextStep: "迁移到 Lovable Cloud 持久化。" },
  { id: "PF-K2", category: "调度", title: "跨会话任务恢复", current: "依赖 localStorage", blocking: false, priority: "P1", nextStep: "用户登录态打通后启用云端恢复。" },
  { id: "PF-K3", category: "调度", title: "Local Gateway 真实执行", current: "仅生成 ExecutionPlan", blocking: false, priority: "P1", nextStep: "对接 Local Gateway 真实派发。" },
  { id: "PF-K4", category: "调度", title: "多任务并发与时间线", current: "顺序推进", blocking: false, priority: "P2", nextStep: "新增并发执行器与任务时间线可视化。" },
  { id: "PF-K5", category: "调度", title: "失败自动修复", current: "重试策略已有，修复策略未实现", blocking: false, priority: "P2", nextStep: "结合 Code Sandbox / QA 自动生成修复任务。" },
  { id: "PF-K6", category: "调度", title: "任务权限策略细化", current: "基础安全策略", blocking: false, priority: "P2", nextStep: "对接 Tool Permission Guard 细化。" },
  { id: "PF-K7", category: "调度", title: "云端调度同步", current: "未实现", blocking: false, priority: "P2", nextStep: "Lovable Cloud + 推送通道。" },

  // L. 旧模块激活
  { id: "PF-L1", category: "旧模块", title: "记录中心 / 回验中心桥接", current: "登记完成，Bridge 草案", blocking: false, priority: "P0", nextStep: "新建 recordCenterEventBridge + verificationCenterPredictionBridge。" },
  { id: "PF-L2", category: "旧模块", title: "产品自进化激活", current: "P0，已有 evolutionRecommendationEngine", blocking: false, priority: "P0", nextStep: "读取 Bug Audit / Value Ledger / Prediction 输出 ProductEvolutionSuggestion。" },
  { id: "PF-L3", category: "旧模块", title: "记录权重 / 反馈权重接入", current: "常数已存在", blocking: false, priority: "P0", nextStep: "注入 Sequence Memory scoring 与 Prediction trajectory。" },
  { id: "PF-L4", category: "旧模块", title: "虚拟生活 OS 激活", current: "PARTIAL", blocking: false, priority: "P1", nextStep: "把生活事件接入 Sequence Memory + Calendar Trigger。" },
  { id: "PF-L5", category: "旧模块", title: "虚拟世界 OS 接入 Scheduler", current: "ACTIVE 子页", blocking: false, priority: "P1", nextStep: "世界事件 → Calendar Trigger + Prediction。" },
  { id: "PF-L6", category: "旧模块", title: "事件算法接入 Scheduler", current: "ACTIVE 引擎", blocking: false, priority: "P1", nextStep: "EventStage 输出 → AetherTask 建议。" },
  { id: "PF-L7", category: "旧模块", title: "虚拟日记 / 创造合并视图", current: "PARTIAL", blocking: false, priority: "P2", nextStep: "并入虚拟生活 OS。" },

  // M. 数列 Agent（v0.1 已接入）
  { id: "PF-M1", category: "数列 Agent", title: "Agent 私有长期记忆", current: "占位", blocking: false, priority: "P2", nextStep: "对接 Sequence Memory，为每个 Agent 建独立命名空间。" },
  { id: "PF-M2", category: "数列 Agent", title: "多 Agent 自动协作评分", current: "占位", blocking: false, priority: "P2", nextStep: "根据冲突 / 一致度自动打分并写入 Analytics。" },
  { id: "PF-M3", category: "数列 Agent", title: "Agent 冲突回验", current: "提示分歧", blocking: false, priority: "P2", nextStep: "把冲突结论写入回验中心。" },
  { id: "PF-M4", category: "数列 Agent", title: "Agent 能力商店化", current: "未实现", blocking: false, priority: "P3", nextStep: "与 Store / WebXXM 打通安装/卸载。" },
  { id: "PF-M5", category: "数列 Agent", title: "Agent 权限细化", current: "三级 LOW/MEDIUM/HIGH/FOUNDER_ONLY", blocking: false, priority: "P2", nextStep: "接入 Tool Permission Guard 细化按 tool 粒度。" },
  { id: "PF-M6", category: "数列 Agent", title: "Agent 与虚拟生活 / 虚拟世界 OS 深度绑定", current: "未实现", blocking: false, priority: "P2", nextStep: "WORLD_AGENT 与 Legacy Module Bridge 联动。" },

  // O. 总说明书（v0.1 已接入）
  { id: "PF-O1", category: "总说明书", title: "自动从代码状态生成说明书", current: "静态文档", blocking: false, priority: "P2", nextStep: "扫描 Registry / Scheduler / Analytics 自动生成完成状态。" },
  { id: "PF-O2", category: "总说明书", title: "说明书版本化", current: "v0.1 单版本", blocking: false, priority: "P2", nextStep: "新增版本快照与 diff 视图。" },
  { id: "PF-O3", category: "总说明书", title: "与 Analytics / Legacy Registry 自动同步", current: "未实现", blocking: false, priority: "P2", nextStep: "把统计与登记表数据回填到「当前完成状态」章节。" },
  { id: "PF-O4", category: "总说明书", title: "与产品自进化联动", current: "未实现", blocking: false, priority: "P2", nextStep: "由 Product Self-Evolution 自动写入「下一轮建议」。" },
  // P. 开源架构吸收
  { id: "PF-P1", category: "开源架构吸收", title: "GitHub API 真实拉取", current: "仅手工粘贴 README / 文件树", blocking: false, priority: "P1", nextStep: "通过 Local Gateway 或服务端代理拉取 repo 元数据，避免 CORS。" },
  { id: "PF-P2", category: "开源架构吸收", title: "License 自动识别", current: "正则启发式", blocking: false, priority: "P1", nextStep: "接入 SPDX 数据库 + 风险分级表。" },
  { id: "PF-P3", category: "开源架构吸收", title: "代码级深度扫描", current: "仅文本启发式", blocking: false, priority: "P2", nextStep: "接入 AST 解析与依赖图。" },
  { id: "PF-P4", category: "开源架构吸收", title: "Local Gateway 安全运行", current: "禁止自动执行", blocking: false, priority: "P1", nextStep: "在 Code Sandbox / Local Gateway 中提供受控运行通道。" },
  { id: "PF-P5", category: "开源架构吸收", title: "自动生成可安装插件", current: "仅生成 WebXXM 草案", blocking: false, priority: "P2", nextStep: "由 Store Packager 把草案打包为可安装能力包。" },
  { id: "PF-P6", category: "开源架构吸收", title: "多项目对比吸收", current: "单项目分析", blocking: false, priority: "P2", nextStep: "支持多 Source 对比 + 推荐最佳组合。" },
  { id: "PF-P7", category: "开源架构吸收", title: "架构吸收回验", current: "未接回验中心", blocking: false, priority: "P2", nextStep: "落地后由回验中心对接入效果打分。" },

  // P. 记录中心（v0.1 已接入）
  { id: "PF-P1", category: "记录中心", title: "回验中心真实执行", current: "字段已预留", blocking: false, priority: "P0", nextStep: "新增 verificationCenterRunner 读取 canVerify 记录。" },
  { id: "PF-P2", category: "记录中心", title: "记录权重完整接入", current: "importance + confidence 已实现", blocking: false, priority: "P1", nextStep: "补全 reuseCount / verifiedScore / decayScore 实时更新。" },
  { id: "PF-P3", category: "记录中心", title: "记录去重", current: "无", blocking: false, priority: "P2", nextStep: "对相同 (eventType + relatedIds + 5min 窗口) 合并。" },
  { id: "PF-P4", category: "记录中心", title: "记录长期归档", current: "localStorage 500 条上限", blocking: false, priority: "P1", nextStep: "迁移到 Lovable Cloud 持久化。" },
  { id: "PF-P5", category: "记录中心", title: "云端同步 / 多用户隔离", current: "未实现", blocking: false, priority: "P1", nextStep: "Cloud 表 + RLS 按 user_id。" },
  { id: "PF-P6", category: "记录中心", title: "回放中心联动", current: "未实现", blocking: false, priority: "P2", nextStep: "RecordEvent → ReplaySession 桥接。" },
  { id: "PF-P7", category: "记录中心", title: "Analytics 自动同步", current: "提供 getRecordCenterAnalytics", blocking: false, priority: "P2", nextStep: "Analytics Runtime 自动拉取记录中心指标。" },

  // Q. 联网中心（v0.1 已接入）
  { id: "PF-Q1", category: "联网中心", title: "搜索引擎接入", current: "未启用", blocking: false, priority: "P1", nextStep: "评估 Brave / DuckDuckGo / Tavily / Firecrawl Search 接入。" },
  { id: "PF-Q2", category: "联网中心", title: "GitHub API 深度接入", current: "仅只读 README", blocking: false, priority: "P1", nextStep: "接入 GitHub REST/GraphQL：releases / commits / topics。" },
  { id: "PF-Q3", category: "联网中心", title: "多源事实校验", current: "回验接口预留", blocking: false, priority: "P1", nextStep: "Verification Center 联动多源比对。" },
  { id: "PF-Q4", category: "联网中心", title: "网页变化监控", current: "仅手动复查任务草案", blocking: false, priority: "P2", nextStep: "Scheduler 自动周期复查 + diff。" },
  { id: "PF-Q5", category: "联网中心", title: "私有仓库授权", current: "未支持", blocking: false, priority: "P2", nextStep: "走 Secret Guard 注入 token，仅允许只读 API。" },
  { id: "PF-Q6", category: "联网中心", title: "License 自动识别", current: "未实现", blocking: false, priority: "P2", nextStep: "扫描 LICENSE / package.json 并标注合规风险。" },
  { id: "PF-Q7", category: "联网中心", title: "外部数据回验自动化", current: "PENDING 占位", blocking: false, priority: "P2", nextStep: "回验中心读取 NetworkSource 自动复测预测与文档版本。" },

  // R. 项目融合（同账号）
  { id: "PF-R1", category: "项目融合", title: "Lovable 同账号项目深度读取", current: "受工具能力限制，需手动登记或描述", blocking: false, priority: "P1", nextStep: "评估 cross_project 系列工具在运行时的可用边界，必要时改为构建期扫描清单。" },
  { id: "PF-R2", category: "项目融合", title: "复杂代码自动迁移", current: "仅生成 Bridge Plan，不真正搬运代码", blocking: false, priority: "P2", nextStep: "为 LOW 风险候选提供组件级补丁草案 + Handoff Pack。" },
  { id: "PF-R3", category: "项目融合", title: "依赖冲突自动解决", current: "未实现", blocking: false, priority: "P2", nextStep: "对照 package.json 检查版本冲突，给出降级 / 升级建议。" },
  { id: "PF-R4", category: "项目融合", title: "后端 schema 跨项目融合", current: "禁止自动迁移", blocking: false, priority: "P3", nextStep: "通过迁移工具 + 人工确认通道接入。" },
  { id: "PF-R5", category: "项目融合", title: "Auth / Payment / 外部 API 安全迁移", current: "高风险黑名单内", blocking: false, priority: "P3", nextStep: "走 Secret Guard + Founder 审批，不自动执行。" },
  { id: "PF-R6", category: "项目融合", title: "多项目自动合并回验", current: "未实现", blocking: false, priority: "P2", nextStep: "回验中心读取 PROJECT_FUSION_REPORT 进行多源比对。" },
  { id: "PF-R7", category: "项目融合", title: "融合任务自动调度", current: "Scheduler 仅生成 WAITING_CONFIRMATION 草案", blocking: false, priority: "P2", nextStep: "Founder 确认后由 Scheduler 串联执行 LOW/MEDIUM 项。" },

  // S. 畅想融合
  { id: "PF-S1", category: "畅想融合", title: "自动从同账号项目深度抽取全部概念", current: "依赖手动登记或描述", blocking: false, priority: "P1", nextStep: "评估 cross_project 工具批量读取项目首页 / README 后做概念抽取。" },
  { id: "PF-S2", category: "畅想融合", title: "创意回验", current: "未接入回验中心", blocking: false, priority: "P2", nextStep: "回验中心读取 FUSION_IDEA 进行假设复测。" },
  { id: "PF-S3", category: "畅想融合", title: "创意转真实 Bridge Plan", current: "仅生成下一步建议", blocking: false, priority: "P1", nextStep: "联动 project-fusion BridgePlanner 把 P0/P1 创意落成执行计划。" },
  { id: "PF-S4", category: "畅想融合", title: "创意商业评分校准", current: "启发式打分", blocking: false, priority: "P2", nextStep: "引入 Analytics 历史指标做校准。" },
  { id: "PF-S5", category: "畅想融合", title: "Product Self-Evolution 自动读取创意库", current: "未串联", blocking: false, priority: "P2", nextStep: "在产品自进化链路中读取最新 IMAGINATIVE_FUSION_REPORT。" },

  // T. 分层审计（v0.1 已接入）
  { id: "PF-T1", category: "分层审计", title: "自动整层补齐执行", current: "仅生成动作 + Lovable 提示词草案", blocking: false, priority: "P1", nextStep: "Founder 确认后联动 Scheduler 串联 P0 补齐动作。" },
  { id: "PF-T2", category: "分层审计", title: "与 Product Self-Evolution 自动联动", current: "未串联", blocking: false, priority: "P1", nextStep: "由自进化引擎读取 LayerGapReport 自动生成下一轮路线。" },
  { id: "PF-T3", category: "分层审计", title: "分层成熟度历史趋势", current: "仅单次快照", blocking: false, priority: "P2", nextStep: "把每次 LayerGapReport 落入 Analytics 时序。" },
  { id: "PF-T4", category: "分层审计", title: "每层自动回验", current: "未接入回验中心", blocking: false, priority: "P2", nextStep: "Verification Center 读取 LayerCompletionAction 完成度做复测。" },
  { id: "PF-T5", category: "分层审计", title: "四象补法自动生成 Lovable Prompt 包", current: "单条草案", blocking: false, priority: "P2", nextStep: "按层级 / 优先级批量打包成 Handoff Pack。" },

  // U. 训练工厂计算法（v0.1 已接入）
  { id: "PF-U1", category: "训练工厂计算法", title: "真正训练执行", current: "仅生成 ExperimentPlan / Runbook 草案", blocking: false, priority: "P1", nextStep: "由用户在本机 / 服务器手动执行，Aetherworld 不自动运行。" },
  { id: "PF-U2", category: "训练工厂计算法", title: "自动数据重加权", current: "权重计算已实现，重加权未自动落地", blocking: false, priority: "P1", nextStep: "回验中心结果回写 DatasetWeight，触发下一代 DatasetVersion。" },
  { id: "PF-U3", category: "训练工厂计算法", title: "自动评测执行", current: "EvalPlan 已草案，未自动跑", blocking: false, priority: "P2", nextStep: "EvalRunner 接入 Provider 运行时评测。" },
  { id: "PF-U4", category: "训练工厂计算法", title: "模型自动接入 Provider", current: "仅生成 ProviderImportPlan 步骤", blocking: false, priority: "P2", nextStep: "由 Founder 确认后由用户手动执行 Ollama / WebLLM 接入。" },
  { id: "PF-U5", category: "训练工厂计算法", title: "递归自举真实验证", current: "仅蓝图", blocking: false, priority: "P2", nextStep: "AetherSeed-300M 出炉后接入 SafetySanitization / SampleGeneration 实测。" },

  // V. AetherSeed Dataset Builder（v0.1 已接入）
  { id: "PF-V1", category: "AetherSeed 数据集", title: "数据集持久化", current: "内存 Store（页面刷新即丢）", blocking: false, priority: "P1", nextStep: "迁移到 Lovable Cloud（aether_objects / 专用表）+ RLS。" },
  { id: "PF-V2", category: "AetherSeed 数据集", title: "真实文件下载", current: "已接入：TXT / JSONL / ChatML / Alpaca / Eval / Manifest / 安全报告 / 完整训练包（多文件）", blocking: false, priority: "P2", nextStep: "进一步引入 zip 打包与大文件流式导出。" },
  { id: "PF-V3", category: "AetherSeed 数据集", title: "数据集血统线 / Diff", current: "v0.1 仅按 name 聚类近似", blocking: false, priority: "P2", nextStep: "新增 parentVersionId + sampleId diff 视图。" },
  { id: "PF-V4", category: "AetherSeed 数据集", title: "样本去重 / 冲突合并", current: "依赖 Intake 去重，未跨 Run 去重", blocking: false, priority: "P2", nextStep: "在 datasetBuilder 中按 (instruction+output) 指纹去重。" },
  { id: "PF-V5", category: "AetherSeed 数据集", title: "评测自动跑分", current: "EvalSample 仅描述，未跑分", blocking: false, priority: "P2", nextStep: "EvalRunner 读取 EvalSample 调用 Provider 打分，回写 qualityScore。" },
  { id: "PF-V6", category: "AetherSeed 数据集", title: "zip 打包导出", current: "完整训练包通过浏览器顺序下载 6 个文件", blocking: false, priority: "P2", nextStep: "在不破坏 Worker 兼容前提下引入 zip.js 实现单文件包。" },
  { id: "PF-V7", category: "AetherSeed 数据集", title: "大文件流式导出", current: "导出走内存字符串拼接", blocking: false, priority: "P2", nextStep: "接入 ReadableStream / showSaveFilePicker 分块写入。" },

  // W. Capability Asset Market（v0.1 已接入）
  { id: "PF-W1", category: "能力资产市场", title: "内部 / 外部 / 用户三类能力源", current: "Scanner + Candidate + Package + Manifest 已生成", blocking: false, priority: "P0", nextStep: "继续扩展真实能力源（读取 Workspace / NetworkSource / OpenArchitectureAnalysis）。" },
  { id: "PF-W2", category: "能力资产市场", title: "真实支付与结算", current: "未接入（明确禁止本轮触达）", blocking: false, priority: "P2", nextStep: "需引入 Stripe / Paddle，且必须与企业渠道审批联动。" },
  { id: "PF-W3", category: "能力资产市场", title: "真实公开上架", current: "仅生成 Store Draft（草稿）", blocking: false, priority: "P1", nextStep: "新增审核流后才允许进入 PUBLISHED_PUBLIC。" },
  { id: "PF-W4", category: "能力资产市场", title: "License 自动验证", current: "依赖 seed 声明", blocking: false, priority: "P1", nextStep: "接入开源 license 识别（SPDX）并自动标注 ownershipStatus。" },
  { id: "PF-W5", category: "能力资产市场", title: "能力包安装运行时", current: "仅生成 installMode 描述", blocking: false, priority: "P1", nextStep: "联动 WebXXM 已有安装链路真正落地一键安装。" },
  { id: "PF-W6", category: "能力资产市场", title: "用户发布审核流", current: "USER 候选默认 NEEDS_REVIEW", blocking: false, priority: "P1", nextStep: "新增 Founder/审核员双签审核 → PUBLISHED_PRIVATE/PUBLIC。" },
  { id: "PF-W7", category: "能力资产市场", title: "评分 / 评论 / 版本升级", current: "未接入", blocking: false, priority: "P2", nextStep: "在 Store 接入 Reactions / Comments / SemVer 升级链。" },

  // X. AetherSeed Local Training Runner（v0.1 已接入）
  { id: "PF-X1", category: "本机训练", title: "本机训练运行器", current: "已接入：Plan / Config / Script / Runbook / EvalPlan + /system/local-training + Chat 桥", blocking: false, priority: "P0", nextStep: "继续完善多 dataset 合并训练计划。" },
  { id: "PF-X2", category: "本机训练", title: "AetherSeed-10M / 50M / 100M 训练计划", current: "可生成三档草案（FROM_SCRATCH_TOY / SFT_TINY）", blocking: false, priority: "P1", nextStep: "结合训练工厂计算法估算成本曲线。" },
  { id: "PF-X3", category: "本机训练", title: "Router / MSL / Format Tiny Model 计划", current: "可生成三种 Tiny Model 配置草案", blocking: false, priority: "P1", nextStep: "与 MSL Engine 联动写入真实 frame 训练目标。" },
  { id: "PF-X4", category: "本机训练", title: "train.py / eval.py / config.yaml / requirements / README", current: "可生成完整本机训练包草案", blocking: false, priority: "P1", nextStep: "增加 tokenizer 训练脚本与多卡 DDP 模板。" },
  { id: "PF-X5", category: "本机训练", title: "本机训练包下载", current: "已支持多文件浏览器下载", blocking: false, priority: "P2", nextStep: "改造为单一 zip 包。" },
  { id: "PF-X6", category: "本机训练", title: "自动执行训练", current: "明确禁止本轮触达（不自动执行 shell）", blocking: false, priority: "P3", nextStep: "保留人工执行边界，不在云端代跑。" },
  { id: "PF-X7", category: "本机训练", title: "checkpoint 自动读取与登记", current: "未实现", blocking: false, priority: "P1", nextStep: "新增 LocalTrainingCheckpointRegistry，由用户手动登记 hash + 路径。" },
  { id: "PF-X8", category: "本机训练", title: "自动 eval / 跑分回写", current: "EvalPlan 仅生成脚本", blocking: false, priority: "P2", nextStep: "训练结束后由用户运行 eval.py 并回填 qualityScore。" },
  { id: "PF-X9", category: "本机训练", title: "Ollama / WebLLM 导入", current: "未接入", blocking: false, priority: "P2", nextStep: "checkpoint 完成后导出 GGUF / ONNX 并登记进 Provider 列表。" },
  { id: "PF-X10", category: "本机训练", title: "tokenizer 训练", current: "未接入", blocking: false, priority: "P2", nextStep: "新增 tokenizer_train.py（BPE / SentencePiece）。" },
  { id: "PF-X11", category: "本机训练", title: "GPU / CPU / 内存自动检测", current: "未实现（仅静态建议）", blocking: false, priority: "P2", nextStep: "通过 navigator.gpu / WebGPU 信息提示硬件档位。" },
  { id: "PF-X12", category: "本机训练", title: "大模型服务器训练", current: "明确禁止本轮触达（不上传数据）", blocking: false, priority: "P3", nextStep: "保留本机训练边界，远端训练走企业渠道单独审批。" },
  { id: "PF-X13", category: "本机训练", title: "实验结果可视化趋势", current: "Experiment Store 仅有状态字段", blocking: false, priority: "P2", nextStep: "扩展 LossCurve / EvalScoreCurve 并接入 Analytics。" },

  // Y. Aether Store App-Market UI Upgrade（v0.1 已接入）
  { id: "PF-Y1", category: "能力商店", title: "应用商店式首页布局", current: "已升级：搜索 + 入口胶囊 + Hero + 内部/外部/用户分区 + 侧栏筛选", blocking: false, priority: "P0", nextStep: "接入真实 Hero 图与轮播。" },
  { id: "PF-Y2", category: "能力商店", title: "商品卡片信息升级", current: "已增强：来源 / 类型 / 风险 / 安全 / 价格 / 状态徽章 + 安装预览入口", blocking: false, priority: "P1", nextStep: "补全评分 / 安装量 / 创作者头像。" },
  { id: "PF-Y3", category: "能力商店", title: "商品详情页 Tabs", current: "已升级：简介 / 预览 / 权限 / Manifest / 所有权 / 版本", blocking: false, priority: "P1", nextStep: "为各 packageType 接入差异化预览（Prompt 复制片段 / Workflow 步骤等）。" },
  { id: "PF-Y4", category: "能力商店", title: "安装预览抽屉", current: "已接入：系统 / 权限 / 数据外传 / 阻断原因 + 高风险禁止一键安装", blocking: false, priority: "P1", nextStep: "接入 CapabilityAssetPackage 真实 manifest 字段。" },
  { id: "PF-Y5", category: "能力商店", title: "私有商店视图", current: "已接入：/store/private 分组草案 / 私有 / 待审 / 阻断 / 归档", blocking: false, priority: "P1", nextStep: "支持私有上架审批流。" },
  { id: "PF-Y6", category: "能力商店", title: "上传资产入口", current: "Store 顶部、入口胶囊、私有商店均接入 /system/user-assets（页面已落地）", blocking: false, priority: "P1", nextStep: "首页 Hero 增加上传引导卡。" },
  { id: "PF-Y7", category: "能力商店", title: "真实支付 / 公开上架 / 评分评论 / 推荐算法", current: "明确禁止本轮触达", blocking: false, priority: "P3", nextStep: "保留商业化边界，等待审核与法务流程。" },

  // Z. Aether User Asset Upload Market（v0.1 已接入）
  { id: "PF-Z1", category: "用户上传出售", title: "用户上传工作台", current: "已接入：/system/user-assets 支持选择文件 / 文件夹 / zip + Chat 桥 + 系统菜单", blocking: false, priority: "P0", nextStep: "增加拖拽上传与上传进度。" },
  { id: "PF-Z2", category: "用户上传出售", title: "ZIP 仅列目录、不解压执行", current: "已接入：inspectZipFile 只读中央目录", blocking: false, priority: "P1", nextStep: "增加压缩炸弹（zip bomb）尺寸预警。" },
  { id: "PF-Z3", category: "用户上传出售", title: "所有权声明门 + 高危后缀阻断", current: "已接入：未声明 / UNKNOWN 不能进入草案；.env/.key/.exe 等直接 BLOCK", blocking: false, priority: "P0", nextStep: "接入 SPDX license 自动识别建议项。" },
  { id: "PF-Z4", category: "用户上传出售", title: "真实支付 / 真实公开发布 / 自动解压执行", current: "明确禁止本轮触达", blocking: false, priority: "P3", nextStep: "保留商业化边界与执行边界。" },

  // AA. Aether Route Health Recovery（v0.1 已接入）
  { id: "PF-AA1", category: "路由健康", title: "全路由健康扫描", current: "已接入：/system/route-health 静态汇总系统菜单 / 验收清单页面状态", blocking: false, priority: "P0", nextStep: "接入运行时异常聚合，自动标红崩溃路由。" },
  { id: "PF-AA2", category: "路由健康", title: "菜单路径与 routeTree 校验", current: "本轮人工核对：system.tsx 全部菜单链接均存在对应 route 文件", blocking: false, priority: "P1", nextStep: "CI 中加入菜单 ↔ routeTree diff 检测。" },
  { id: "PF-AA3", category: "路由健康", title: "/system/bug-audit 别名", current: "已新增 Navigate 重定向至 /system-bug-audit", blocking: false, priority: "P2", nextStep: "下一轮统一系统页路径命名（system.* vs system-*）。" },
  { id: "PF-AA4", category: "路由健康", title: "Playwright 真实 e2e", current: "未接入", blocking: false, priority: "P2", nextStep: "对菜单中每个链接做最小冒烟点击。" },
  { id: "PF-AA5", category: "路由健康", title: "运行时异常聚合", current: "未接入", blocking: false, priority: "P1", nextStep: "ErrorBoundary 上报异常并按 route 归档。" },
];

export function bugSummary() {
  const total = BUG_REPORT.length;
  const fixed = BUG_REPORT.filter((b) => b.status === "AUTO_FIXED").length;
  const needsReview = BUG_REPORT.filter((b) => b.status === "NEEDS_REVIEW").length;
  const blockers = BUG_REPORT.filter((b) => b.severity === "BLOCKER").length;
  const high = BUG_REPORT.filter((b) => b.severity === "HIGH").length;
  return { total, fixed, needsReview, blockers, high, modulesChecked: 11 };
}
