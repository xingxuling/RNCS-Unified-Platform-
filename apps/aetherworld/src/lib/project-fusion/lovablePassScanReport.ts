// Lovable Same-Account Project Fusion Pass · 真实扫描报告（开发期）
//
// ⚠ 重要：本报告由 Lovable 开发环境（cross_project 工具）在开发期真实读取
// 同账号项目清单与少量目录结构后产出。Aetherworld 运行时不会、也不应当
// 直接读取 Lovable 账号项目；运行时仅能读取本文件这份"已保存的开发期报告"。
//
// 生成时间：2026-05-25
// 扫描范围：当前 Lovable 工作区可访问的 50 个同账号项目
// 实际进入目录读取的样本项目：Local Logic Shell / Cognitive Console / NPC Dialogue Weaver / Aetherion Seed
// 其余项目仅基于项目名 / 描述 / URL 元数据分类，未深入读取源码。

export type FusionRisk = "LOW" | "MEDIUM" | "HIGH";

export interface LovablePassProject {
  projectName: string;
  projectId: string;
  url?: string;
  /** Aetherworld 内最相关的目标系统 */
  targetAetherSystems: string[];
  reusableParts: string[];
  riskLevel: FusionRisk;
  /** 是否实际进入源码目录（true）或仅基于元数据（false） */
  deepRead: boolean;
  recommendation:
    | "FUSE_NOW"        // LOW 风险 + 高价值，可在本轮直接融合
    | "BRIDGE_PLAN"     // MEDIUM，仅生成 Bridge Plan
    | "BLOCKED"         // HIGH 风险，禁止迁移
    | "REFERENCE_ONLY"  // 仅参考思路，不迁移代码
    | "SKIP";           // 与 Aetherworld 主干无关
  notes: string;
}

export interface LovablePassFusionPlan {
  sourceProjectName: string;
  reusablePart: string;
  targetAetherSystem: string;
  riskLevel: FusionRisk;
  conflicts: string[];
  requiredChanges: string[];
  recommendedSteps: string[];
  shouldApplyNow: boolean;
}

export interface SameAccountProjectScanReport {
  generatedAt: string;
  generatedBy: "LOVABLE_DEV_ENV_CROSS_PROJECT_TOOLS";
  totalAccessibleProjects: number;
  inaccessibleProjects: string[];
  deepReadSampleCount: number;
  highValueProjects: LovablePassProject[];
  lowValueOrUnrelated: { projectName: string; reason: string }[];
  fusionPlans: LovablePassFusionPlan[];
  appliedNow: { sourceProjectName: string; targetAetherSystem: string; what: string }[];
  blockedOrSkippedItems: string[];
  notes: string[];
}

const HIGH_VALUE: LovablePassProject[] = [
  {
    projectName: "Local Logic Shell",
    projectId: "9a779539-84fd-4a5b-826d-09afba57a560",
    url: "https://love-ose-mind.lovable.app",
    targetAetherSystems: ["Local Gateway / Model Provider", "Sequence AI", "MSL State Language"],
    reusableParts: [
      "engine/intentClassifier.ts · 意图分类",
      "engine/semanticClassifier.ts · 语义分类",
      "engine/oseTypes.ts · OSE 状态类型",
      "engine/oseCycle.ts / oseCycleV2.ts · 状态机循环",
      "engine/fateRuntime.ts · 运行时模式",
    ],
    riskLevel: "MEDIUM",
    deepRead: true,
    recommendation: "BRIDGE_PLAN",
    notes:
      "engine/* 是一套自洽的本地推理 / 状态机引擎，含约 25 个模块。直接整体迁入会与 Aetherworld 的 Fusion Runtime / MSL 产生概念重叠，必须先抽象 adapter 再桥接。" +
      "可立即参考其分层（classifier → controller → cycle → interpreter），但代码本体走 Bridge。",
  },
  {
    projectName: "Cognitive Console",
    projectId: "16361001-9cde-45fe-a9bb-22161ff07e4b",
    url: "https://cog-twin-console.lovable.app",
    targetAetherSystems: ["Chat 主链路", "Workspace", "MSL Terminal"],
    reusableParts: [
      "components/TerminalInput.tsx · 终端式输入框",
      "components/MessageHistory.tsx · 消息历史卡",
      "components/ResponseOutput.tsx · 响应输出卡",
      "components/StatusBar.tsx · 状态栏",
      "components/MainLineTracker.tsx · 主线追踪",
      "components/ConversationSidebar.tsx · 会话侧栏",
    ],
    riskLevel: "LOW",
    deepRead: true,
    recommendation: "FUSE_NOW",
    notes:
      "纯前端 UI 组件，与 Aetherworld Chat / MSL Terminal 同构。可作为「终端式对话外观」的备选皮肤，无需迁移业务逻辑。",
  },
  {
    projectName: "NPC Dialogue Weaver",
    projectId: "ffef2c39-a93a-4021-bc80-69237e67deca",
    url: "https://npc-dialogue-weaver.lovable.app",
    targetAetherSystems: ["Sequence Agent", "World Engine", "Sequence AI"],
    reusableParts: [
      "NPC 角色 → 对话生成的 prompt 模式",
      "contexts/* · 角色上下文上下文容器",
      "对话节点 / 分支结构",
    ],
    riskLevel: "MEDIUM",
    deepRead: true,
    recommendation: "BRIDGE_PLAN",
    notes: "适合作为 World Engine 中 NPC 对话子系统的灵感来源；走 Bridge，不直接合并。",
  },
  {
    projectName: "Aetherion Seed",
    projectId: "19de0b14-1f7e-468f-93f3-c5daedea79e2",
    url: "https://aether-seed-forge.lovable.app",
    targetAetherSystems: ["World Engine", "Virtual World OS", "Sequence Memory"],
    reusableParts: [
      "seed-runtime/seedRuntime.ts · 世界种子运行时",
      "seed-runtime/universeForge.ts · 宇宙锻造",
      "agi-shell/* · AGI 外壳",
      "ial/* · 内部抽象层",
      "workers/* · Web Worker 模式",
    ],
    riskLevel: "MEDIUM",
    deepRead: true,
    recommendation: "BRIDGE_PLAN",
    notes:
      "与 Aetherworld 世界引擎理念高度重叠，但代码量大（10+ 顶级目录），直接合并会与现有 world-* 路由冲突。仅生成 Bridge Plan。",
  },
  {
    projectName: "Cognitive Console OS",
    projectId: "c1646b70-1b99-4da3-93d0-1fb7ea04f293",
    url: "https://mind-sculptor-os.lovable.app",
    targetAetherSystems: ["Workspace", "Command Center", "Personal OS"],
    reusableParts: ["仪表盘 / 模块卡片布局", "命令面板风格"],
    riskLevel: "LOW",
    deepRead: false,
    recommendation: "REFERENCE_ONLY",
    notes: "未深入读取，但定位与 Aetherworld 的 command-center / workspace 高度相似，可作为信息架构参考。",
  },
  {
    projectName: "Aether Forecast Engine",
    projectId: "60cdf5fb-a828-4c6e-a3a0-449c166a2c50",
    url: "https://aether-track-engine.lovable.app",
    targetAetherSystems: ["Sequence Prediction Engine", "Analytics Runtime"],
    reusableParts: ["DTFM × 以太语言 的结构预测引擎模型"],
    riskLevel: "MEDIUM",
    deepRead: false,
    recommendation: "BRIDGE_PLAN",
    notes: "未深入读取；与本项目 Sequence Prediction 同源，应桥接而非合并。",
  },
  {
    projectName: "Event Dynamics Engine",
    projectId: "dcbf0ac6-191b-48fd-8cc8-a0b8e2ae85df",
    url: "https://intuition-dynamics-forge.lovable.app",
    targetAetherSystems: ["事件算法", "Scheduler Runtime", "Sequence Prediction"],
    reusableParts: ["数理直觉模型 / 事件动力学规则"],
    riskLevel: "MEDIUM",
    deepRead: false,
    recommendation: "BRIDGE_PLAN",
    notes: "未深入读取；事件算法层值得桥接。",
  },
  {
    projectName: "Digital Genesis Lab",
    projectId: "55221de6-043a-435e-b01e-1c2a89371528",
    url: "https://subject-nexus-lab.lovable.app",
    targetAetherSystems: ["Virtual Life OS", "数字主体", "主体状态"],
    reusableParts: ["数字主体原胚生命周期", "主体状态机"],
    riskLevel: "MEDIUM",
    deepRead: false,
    recommendation: "BRIDGE_PLAN",
    notes: "未深入读取；与 Aetherworld subject.* 路由同构，仅桥接。",
  },
  {
    projectName: "Aether E-Lang Studio",
    projectId: "dbddfb85-8544-4334-82fd-547831fff2dd",
    url: "https://aether-e-builder.lovable.app",
    targetAetherSystems: ["MSL State Language", "Sequence Language"],
    reusableParts: ["以太语言编译器结构", "Web 编辑器布局"],
    riskLevel: "MEDIUM",
    deepRead: false,
    recommendation: "BRIDGE_PLAN",
    notes: "未深入读取；适合作为 MSL 编辑器 UX 参考。",
  },
  {
    projectName: "Mind Map Studio",
    projectId: "81f77555-2d88-45e4-a656-dc6adf9977c9",
    url: "https://thinking-style-atlas.lovable.app",
    targetAetherSystems: ["WebLCM 概念图", "system-evolution-map"],
    reusableParts: ["节点-边可视化组件"],
    riskLevel: "LOW",
    deepRead: false,
    recommendation: "REFERENCE_ONLY",
    notes: "未深入读取；可作为图谱可视化参考。",
  },
  {
    projectName: "Executive Insight Hub",
    projectId: "b5dfd3dd-e0bb-4300-bb9f-bc3d6fb53712",
    url: "https://command-spark.lovable.app",
    targetAetherSystems: ["Command Center", "Workspace"],
    reusableParts: ["决策仪表盘卡片", "高密度信息布局"],
    riskLevel: "LOW",
    deepRead: false,
    recommendation: "REFERENCE_ONLY",
    notes: "未深入读取；可参考其卡片密度与排版。",
  },
  {
    projectName: "Advisor Chat",
    projectId: "63f09e3b-3a58-4d42-ab1e-0f498d00d72d",
    url: "https://junshi.lovable.app",
    targetAetherSystems: ["Chat 主链路", "Sequence Agent"],
    reusableParts: ["顾问式对话 UI"],
    riskLevel: "LOW",
    deepRead: false,
    recommendation: "REFERENCE_ONLY",
    notes: "未深入读取；可参考顾问角色对话外观。",
  },
  {
    projectName: "biz-skills-bridge",
    projectId: "9ef6e4b3-6e75-4aae-afea-2424ff057857",
    url: "https://biz-skills-bridge.lovable.app",
    targetAetherSystems: ["Store / WebXXM", "Workspace"],
    reusableParts: ["技能/能力市集结构（仅结构层）"],
    riskLevel: "HIGH",
    deepRead: false,
    recommendation: "BLOCKED",
    notes: "未深入读取；含支付 / 用户体系，禁止直接迁移。仅可借鉴 Store 信息架构。",
  },
  {
    projectName: "storyzen-ai",
    projectId: "a504bfe8-46ee-42c2-90dc-7f0bf0dd42c7",
    url: "https://storyzen-ai.lovable.app",
    targetAetherSystems: ["World Engine", "narrative-engine", "story-forge"],
    reusableParts: ["小说写作节点 / 章节结构 UI"],
    riskLevel: "MEDIUM",
    deepRead: false,
    recommendation: "BRIDGE_PLAN",
    notes: "未深入读取；与 story-forge / narrative-engine 同向，桥接即可。",
  },
  {
    projectName: "Echo Weaver AI",
    projectId: "6368439d-ee02-41f4-9fc2-2313b76be529",
    targetAetherSystems: ["world-audio", "vocal-engine"],
    reusableParts: ["AI 配音流程 / 故事生成结构"],
    riskLevel: "MEDIUM",
    deepRead: false,
    recommendation: "BRIDGE_PLAN",
    notes: "未深入读取；桥接到 world-audio / vocal-engine。",
  },
  {
    projectName: "NineCore Trader AI",
    projectId: "0ab375e6-0f65-4902-abac-861d340f5939",
    url: "https://ninecore-trader-ai.lovable.app",
    targetAetherSystems: [],
    reusableParts: [],
    riskLevel: "HIGH",
    deepRead: false,
    recommendation: "BLOCKED",
    notes: "金融自动化交易系统，与 Aetherworld 无直接业务交集，且涉及高风险逻辑，禁止迁移。",
  },
  {
    projectName: "destiny-seeker-ai",
    projectId: "bf60d5b8-647a-4dc1-9471-1bf705f7a118",
    url: "https://destiny-seeker-ai.lovable.app",
    targetAetherSystems: [],
    reusableParts: [],
    riskLevel: "HIGH",
    deepRead: false,
    recommendation: "BLOCKED",
    notes: "Next.js + Supabase 招聘 SaaS，含 Auth / DB schema，禁止直接迁移。",
  },
  {
    projectName: "Cognition Forge",
    projectId: "35b7814a-8b8b-4789-9992-68c20e9ee33b",
    url: "https://taowind-insight.lovable.app",
    targetAetherSystems: ["Store / WebXXM"],
    reusableParts: [],
    riskLevel: "HIGH",
    deepRead: false,
    recommendation: "BLOCKED",
    notes: "Shopify 商店项目，含支付，禁止迁移；可仅借鉴信息架构。",
  },
];

const LOW_VALUE: { projectName: string; reason: string }[] = [
  { projectName: "Pixel Perfect / Pixel Perfect Replica / Exact Screenshot Match", reason: "像素复刻工具，与 Aetherworld 主干无关。" },
  { projectName: "Done, Made", reason: "占位项目，无可复用内容。" },
  { projectName: "Zenith Core", reason: "单页落地舱，仅营销页。" },
  { projectName: "TaoWind 官网 / Chenzhou Roots HK / 宏福支援 Hub / CountyConnect Hub", reason: "纯营销/社区官网，仅可借鉴文案结构。" },
  { projectName: "Plan AI / Plan AI (08)", reason: "商业计划 SaaS，业务方向不重叠。" },
  { projectName: "Character Match / Harmony Hub / Prob Soccer Advisor / Alpha 基因向导", reason: "垂直消费类应用，与主干弱相关。" },
  { projectName: "blue-sky-oracle 系列 / I-Ching Insight / wise-augur-ai / mystic-mind / Cosmic Compass", reason: "命理/玄学应用群，仅可作 World Engine 题材参考。" },
  { projectName: "Judgment Dynamics / Life Layer Dialogues / Cognitive Navigator / Cognitive Architect Hub / Blue-Sky Cognitive Compass", reason: "哲学理论展示型站点，UI 风格可参考，无核心逻辑可迁移。" },
  { projectName: "Wind Whisperer Strategy / Aetherion Oracle / Du-Heng Realm Sovereign / Equilibrium Seed / Clear Mind", reason: "未深入读取；定位偏咨询/展示，REFERENCE_ONLY。" },
];

const FUSION_PLANS: LovablePassFusionPlan[] = [
  {
    sourceProjectName: "Cognitive Console",
    reusablePart: "components/TerminalInput.tsx + StatusBar.tsx + MessageHistory.tsx",
    targetAetherSystem: "MSL Terminal · /msl-terminal",
    riskLevel: "LOW",
    conflicts: [],
    requiredChanges: ["按 Aetherworld 设计 token 重新着色", "对接 mslConsole 状态而非原项目 store"],
    recommendedSteps: ["读取 3 个组件源码", "在 src/components/msl/terminal/ 下创建中文化的同类组件", "在 /msl-terminal 内提供「终端皮肤」切换"],
    shouldApplyNow: false, // 本轮不直接迁，待 Founder 确认皮肤策略
  },
  {
    sourceProjectName: "Local Logic Shell",
    reusablePart: "engine/intentClassifier + semanticClassifier + oseTypes",
    targetAetherSystem: "Sequence AI · MSL State Language",
    riskLevel: "MEDIUM",
    conflicts: ["与现有 chatMessageEngine 的意图识别重叠"],
    requiredChanges: ["抽象 Classifier 接口", "用 adapter 包装，不直接挂入运行时"],
    recommendedSteps: ["读取 4 个 engine/*.ts", "在 src/lib/sequence-ai/adapters/ose-classifier.ts 中实现 adapter", "通过 Sequence AI Runtime 注入"],
    shouldApplyNow: false,
  },
  {
    sourceProjectName: "Aetherion Seed",
    reusablePart: "seed-runtime/universeForge + workers/*",
    targetAetherSystem: "World Engine · world-runtime",
    riskLevel: "MEDIUM",
    conflicts: ["与现有 world-* 路由 / world-runtime 强重叠"],
    requiredChanges: ["先做架构对齐评审", "确认是否替换、并存或仅吸收 API 形态"],
    recommendedSteps: ["Founder 审阅本计划", "选择并存或合并方案", "如并存：在 world-runtime 下新增 seed 适配层"],
    shouldApplyNow: false,
  },
  {
    sourceProjectName: "NPC Dialogue Weaver",
    reusablePart: "NPC 上下文容器 + 分支对话结构",
    targetAetherSystem: "Sequence Agent · world-character / npc-agents",
    riskLevel: "MEDIUM",
    conflicts: [],
    requiredChanges: ["统一对话节点 schema 到 Aetherworld MSL"],
    recommendedSteps: ["读取 contexts/* 与对话引擎", "在 sequence-agent 下增加 npc-dialogue 子模块（占位）"],
    shouldApplyNow: false,
  },
  {
    sourceProjectName: "Aether Forecast Engine",
    reusablePart: "DTFM × 以太语言 结构预测核",
    targetAetherSystem: "Sequence Prediction Engine",
    riskLevel: "MEDIUM",
    conflicts: ["与 Aetherworld Sequence Prediction 模型选择重叠"],
    requiredChanges: ["将其作为可选预测后端通过 adapter 接入"],
    recommendedSteps: ["读取该项目核心 engine 文件（未在本轮完成）", "拟定 adapter 接口", "Founder 确认后再桥接"],
    shouldApplyNow: false,
  },
];

const APPLIED_NOW: { sourceProjectName: string; targetAetherSystem: string; what: string }[] = [
  // 本轮没有 LOW 风险 + 高紧迫性 + 不影响 Responsive Shell 的内容被直接合并。
  // 已识别的 LOW 项（Cognitive Console UI 组件）需要 Founder 先确认是否要增加「终端皮肤」，故仅留 Plan。
];

const BLOCKED_OR_SKIPPED = [
  "biz-skills-bridge：含支付/用户体系，禁止直接迁移。",
  "destiny-seeker-ai：Supabase Auth + DB schema，禁止直接迁移。",
  "Cognition Forge：Shopify 支付链路，禁止直接迁移。",
  "NineCore Trader AI：金融自动化交易，禁止迁移。",
  "Pixel Perfect 系列 / Done Made / Zenith Core：与主干无关，跳过。",
];

export const LOVABLE_PASS_SCAN_REPORT: SameAccountProjectScanReport = {
  generatedAt: "2026-05-25",
  generatedBy: "LOVABLE_DEV_ENV_CROSS_PROJECT_TOOLS",
  totalAccessibleProjects: 50,
  inaccessibleProjects: [
    // 本轮在 50 个 accessible 项目内完成元数据扫描；未发现无法访问的项目。
    // 若未来访问受限，请在此追加。
  ],
  deepReadSampleCount: 4, // Local Logic Shell / Cognitive Console / NPC Dialogue Weaver / Aetherion Seed
  highValueProjects: HIGH_VALUE,
  lowValueOrUnrelated: LOW_VALUE,
  fusionPlans: FUSION_PLANS,
  appliedNow: APPLIED_NOW,
  blockedOrSkippedItems: BLOCKED_OR_SKIPPED,
  notes: [
    "本报告由 Lovable 开发期 cross_project 工具真实读取生成，仅元数据 + 4 个项目的目录采样。",
    "其余项目仅基于项目名 / 描述分类，未深入源码，结论标注为 deepRead=false。",
    "Aetherworld 运行时不会主动读取 Lovable 账号；运行时仅消费本静态报告。",
    "本轮未自动合并任何源代码：所有 LOW 项都需要 Founder 先确认皮肤/接入策略，MEDIUM/HIGH 项一律留 Bridge Plan。",
  ],
};

export function getLovablePassScanReport(): SameAccountProjectScanReport {
  return LOVABLE_PASS_SCAN_REPORT;
}
