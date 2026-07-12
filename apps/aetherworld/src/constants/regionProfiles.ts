// 地区用户画像
import type { UXModeKey } from "./userExperienceModes";

export interface RegionProfile {
  key: string;
  regionName: string;          // 中文名
  regionEn: string;
  flag: string;                // emoji 旗
  languagePreference: string[];
  trustPath: string;
  culturalSensitivity: string[];
  productComprehensionLevel: number; // 0-100
  mysticalTolerance: number;        // 0-100  神秘 / 命理可接受度
  aiAcceptance: number;             // 0-100
  paymentReadiness: number;         // 0-100
  privacySensitivity: number;       // 0-100
  preferredTone: string;
  preferredOnboarding: string;
  bestEntryPoint: string;
  riskWarningStyle: string;
  monetizationFit: string;
  uxStrategy: string[];
  defaultMode: UXModeKey;
  // 首页文案
  copy: {
    heading: string;
    subheading: string;
    primaryCta: string;
    secondaryCta: string;
  };
  // 功能优先级（id 引用现有路由 / dashboard 区块）
  featurePriority: string[];
  primaryUserFear: string;
  primaryUserDesire: string;
}

export const REGION_PROFILES: RegionProfile[] = [
  {
    key: "hk", regionName: "香港", regionEn: "Hong Kong", flag: "🇭🇰",
    languagePreference: ["English", "繁體中文"],
    trustPath: "专业文档 + 隐私声明 + 案例 + 高级 UI + 可信品牌包装",
    culturalSensitivity: ["金融 / 法律语境", "身份与隐私敏感", "公开表达需专业"],
    productComprehensionLevel: 85, mysticalTolerance: 55,
    aiAcceptance: 85, paymentReadiness: 80, privacySensitivity: 85,
    preferredTone: "专业、克制、结构化、双语",
    preferredOnboarding: "Demo Persona → Private Model → Documentation",
    bestEntryPoint: "Dashboard + 行动许可",
    riskWarningStyle: "Clear & Legal-friendly Disclaimer",
    monetizationFit: "Pro Subscription (HKD / USD)",
    uxStrategy: [
      "首页定位为 Personal Forecast & Decision OS",
      "弱化神秘表达，强调结构与回验",
      "提供双语切换",
      "Demo 与真实主体严格隔离",
    ],
    defaultMode: "mystic_reduced",
    copy: {
      heading: "Aether Fate Engine",
      subheading: "A structured forecasting OS for timing, decisions, action permissions, and feedback loops. 以太命运引擎 · 用于时间窗口、结构判断、行动许可与回验修正的个人预测操作系统。",
      primaryCta: "Explore Demo",
      secondaryCta: "Create Private Model",
    },
    featurePriority: ["今日定数", "触发日历", "行动许可", "产品活性", "地理因素", "回验"],
    primaryUserFear: "暴露隐私 / 不够专业 / 决策被神秘化误导",
    primaryUserDesire: "可信的结构化决策辅助 + 高密度时间窗口判断",
  },
  {
    key: "cn", regionName: "中国内地", regionEn: "Mainland China", flag: "🇨🇳",
    languagePreference: ["简体中文"],
    trustPath: "本地化表达 + 趋势/复盘叙事 + 具体行动建议",
    culturalSensitivity: ["避免绝对预言", "弱化命运决定论", "强调成长与决策"],
    productComprehensionLevel: 70, mysticalTolerance: 70,
    aiAcceptance: 80, paymentReadiness: 55, privacySensitivity: 60,
    preferredTone: "接地气、结构化、不玄、强行动",
    preferredOnboarding: "选择场景 → 体验模拟主体 → 创建我的模型",
    bestEntryPoint: "今日趋势 + 事业/关系窗口",
    riskWarningStyle: "温和但明确：不是命理结论，而是趋势与行动建议",
    monetizationFit: "订阅 / 单次解读 / 成长记录会员",
    uxStrategy: [
      "避免使用「命运决定论」",
      "改用「结构判断 / 趋势窗口 / 行动建议 / 复盘」",
      "回验做成成长记录",
      "预测结果必须配行动建议",
    ],
    defaultMode: "localized_chinese",
    copy: {
      heading: "以太命运引擎",
      subheading: "看清趋势，判断窗口，选择行动。一个结合数列结构、时间窗口、行动许可与回验记录的个人决策辅助系统。",
      primaryCta: "体验模拟主体",
      secondaryCta: "创建我的模型",
    },
    featurePriority: ["今日趋势", "事业/关系窗口", "行动建议", "回验记录", "常数解释", "提示词锻造炉"],
    primaryUserFear: "被绝对化预言绑架 / 失去主动权",
    primaryUserDesire: "看清趋势 + 知道下一步该做什么",
  },
  {
    key: "sg", regionName: "新加坡", regionEn: "Singapore", flag: "🇸🇬",
    languagePreference: ["English", "简体中文"],
    trustPath: "private-by-default + 清晰 UI + 数据本地化承诺",
    culturalSensitivity: ["多元文化", "隐私敏感", "效率导向"],
    productComprehensionLevel: 88, mysticalTolerance: 40,
    aiAcceptance: 88, paymentReadiness: 78, privacySensitivity: 88,
    preferredTone: "干净、专业、AI-native",
    preferredOnboarding: "Try Demo → Build My Model → Connect Use Case",
    bestEntryPoint: "Action Permission + Timing Window",
    riskWarningStyle: "Concise disclaimer, GDPR-style copy",
    monetizationFit: "SGD Pro Plan + Career / Productivity Use Case",
    uxStrategy: [
      "AI-powered Personal Timing & Strategy System",
      "强调 private by default / local-first",
      "聚焦 productivity、career、self-reflection",
    ],
    defaultMode: "mystic_reduced",
    copy: {
      heading: "AI-Powered Timing & Strategy OS",
      subheading: "Map your signals, timing windows, action permissions, and feedback loops in one private system.",
      primaryCta: "Try Demo",
      secondaryCta: "Build My Model",
    },
    featurePriority: ["Action Permission", "Timing Windows", "Private Model", "Feedback Loop", "Product / Career Strategy"],
    primaryUserFear: "Data leakage / pseudoscience perception",
    primaryUserDesire: "Private, AI-native timing & decision intelligence",
  },
  {
    key: "tw", regionName: "台灣", regionEn: "Taiwan", flag: "🇹🇼",
    languagePreference: ["繁體中文"],
    trustPath: "美感 + 陪伴感 + 自我覺察敘事",
    culturalSensitivity: ["心理 / 自我探索友善", "命理接受度高", "重視細膩表達"],
    productComprehensionLevel: 75, mysticalTolerance: 80,
    aiAcceptance: 75, paymentReadiness: 60, privacySensitivity: 65,
    preferredTone: "溫和、人格化、有星圖感",
    preferredOnboarding: "今日信號 → 關係/階段 → 建立主體",
    bestEntryPoint: "今日信號 + 人生階段",
    riskWarningStyle: "柔和但清楚的免責聲明",
    monetizationFit: "月訂閱 + 主題解讀",
    uxStrategy: [
      "保留仪式感 + 强调回验",
      "文案柔和 / 视觉星图",
      "强化今日信号 / 关系窗口 / 人生阶段",
    ],
    defaultMode: "reflective",
    copy: {
      heading: "以太命運引擎",
      subheading: "看見時間裡的訊號，理解自己正在走向哪裡。",
      primaryCta: "體驗 Demo",
      secondaryCta: "建立我的主體",
    },
    featurePriority: ["今日信號", "關係 / 自我階段", "時間窗口", "回驗", "星圖視覺"],
    primaryUserFear: "被冰冷工具化 / 失去人情味",
    primaryUserDesire: "被理解 + 看見自己當下的位置",
  },
  {
    key: "jp", regionName: "日本", regionEn: "Japan", flag: "🇯🇵",
    languagePreference: ["日本語", "English"],
    trustPath: "精致 UI + 仪式感 + 克制语言 + 长期陪伴",
    culturalSensitivity: ["避免强断", "克制表达", "尊重个人节奏"],
    productComprehensionLevel: 72, mysticalTolerance: 75,
    aiAcceptance: 65, paymentReadiness: 70, privacySensitivity: 80,
    preferredTone: "静谧、克制、仪式感",
    preferredOnboarding: "每日卡片 → 节奏图 → 关系相性",
    bestEntryPoint: "每日卡片 + Personal Rhythm",
    riskWarningStyle: "礼貌、低强度的注意书",
    monetizationFit: "JPY 月额 / 单卡片付费",
    uxStrategy: [
      "Personal Rhythm Forecast 定位",
      "克制表达，不强势",
      "每日卡片 / 节奏图 / 关系相性",
      "高美术完成度",
    ],
    defaultMode: "reflective",
    copy: {
      heading: "Personal Rhythm Forecast",
      subheading: "A quiet system for signals, timing, and self-alignment. 個人のリズムと意思決定のための静かなOS。",
      primaryCta: "Open Demo",
      secondaryCta: "Begin My Rhythm",
    },
    featurePriority: ["Daily Card", "Personal Rhythm", "Relationship Resonance", "Feedback", "Documentation"],
    primaryUserFear: "被强断 / 被打扰 / 节奏被打乱",
    primaryUserDesire: "安静、有节奏、可长期陪伴的工具",
  },
  {
    key: "us", regionName: "美国", regionEn: "United States", flag: "🇺🇸",
    languagePreference: ["English"],
    trustPath: "Clear value prop + disclaimers + free trial",
    culturalSensitivity: ["Avoid pseudoscience tone", "Privacy + ToS clarity"],
    productComprehensionLevel: 80, mysticalTolerance: 60,
    aiAcceptance: 90, paymentReadiness: 82, privacySensitivity: 80,
    preferredTone: "Direct, self-improvement, AI-native",
    preferredOnboarding: "Pick goal → demo forecast → create model",
    bestEntryPoint: "Daily Forecast + Action Permission",
    riskWarningStyle: "Not medical / legal / financial advice (explicit)",
    monetizationFit: "Freemium + USD Pro plan",
    uxStrategy: [
      "AI Forecasting Journal / Decision Timing OS",
      "Self-reflection + pattern tracking + feedback loops",
      "Avoid deterministic claims",
    ],
    defaultMode: "mystic_reduced",
    copy: {
      heading: "A Personal Forecasting OS",
      subheading: "Timing, decisions, and feedback — in one reflective AI system. Not medical, legal, or financial advice.",
      primaryCta: "Start Free Demo",
      secondaryCta: "Build My Model",
    },
    featurePriority: ["Daily Forecast", "Action Permission", "Pattern Tracking", "Feedback Loop", "Pro Plan"],
    primaryUserFear: "Pseudoscience labelling / privacy misuse",
    primaryUserDesire: "Reflective AI that supports real decisions",
  },
  {
    key: "global", regionName: "全球线上用户", regionEn: "Global Online", flag: "🌐",
    languagePreference: ["English"],
    trustPath: "3-step onboarding + clear demo + privacy note",
    culturalSensitivity: ["来源分散", "需要快速理解", "首屏需解释"],
    productComprehensionLevel: 65, mysticalTolerance: 55,
    aiAcceptance: 80, paymentReadiness: 60, privacySensitivity: 70,
    preferredTone: "简洁、直接、视觉清晰",
    preferredOnboarding: "Pick goal → Pick region → Demo forecast",
    bestEntryPoint: "Demo Forecast",
    riskWarningStyle: "Simple disclaimer above the fold",
    monetizationFit: "Freemium",
    uxStrategy: [
      "3-step onboarding",
      "Choose goal: career / relationship / health / product / general",
      "Generate demo prediction first",
      "Then guide model creation",
    ],
    defaultMode: "demo_first",
    copy: {
      heading: "See your timing.",
      subheading: "A reflective forecasting OS for signals, timing windows, action permissions, and feedback loops.",
      primaryCta: "Try the Demo",
      secondaryCta: "Read How It Works",
    },
    featurePriority: ["Demo Forecast", "Goal Selector", "Trigger Calendar", "Feedback", "Pricing"],
    primaryUserFear: "Don't understand what this is",
    primaryUserDesire: "Instant 'aha' from a 30-second demo",
  },
  {
    key: "enterprise", regionName: "企业用户", regionEn: "Enterprise", flag: "🏢",
    languagePreference: ["English", "简体中文"],
    trustPath: "白皮书 + 案例 + 可解释性 + 团队权限",
    culturalSensitivity: ["拒绝命理表达", "需要审计与合规"],
    productComprehensionLevel: 90, mysticalTolerance: 5,
    aiAcceptance: 88, paymentReadiness: 90, privacySensitivity: 92,
    preferredTone: "企业、专业、决策智能",
    preferredOnboarding: "Scenario demo → Framework → POC",
    bestEntryPoint: "Scenario Trigger Matrix",
    riskWarningStyle: "正式、可审计的免责与适用范围",
    monetizationFit: "Annual License / Seat-based / POC → Contract",
    uxStrategy: [
      "完全隐藏命运化语言",
      "Decision Timing Engine / Scenario Trigger System",
      "强调 risk window / action permission / review loop",
      "页面更像企业 dashboard",
    ],
    defaultMode: "decision_os",
    copy: {
      heading: "Decision Timing & Scenario Trigger OS",
      subheading: "Identify timing windows, risk signals, action permissions, and review points for complex decisions.",
      primaryCta: "View Scenario Demo",
      secondaryCta: "Explore Framework",
    },
    featurePriority: ["Scenario Trigger", "Risk Window", "Action Permission", "Review Nodes", "Documentation"],
    primaryUserFear: "Pseudoscience / unauditable AI / compliance risk",
    primaryUserDesire: "Explainable, auditable decision-timing intelligence",
  },
  {
    key: "research", regionName: "高校与研究用户", regionEn: "University / Research", flag: "🎓",
    languagePreference: ["English", "简体中文"],
    trustPath: "白皮书 + 方法论 + 回验数据 + 实验协议",
    culturalSensitivity: ["严谨边界", "不能过度神秘"],
    productComprehensionLevel: 92, mysticalTolerance: 20,
    aiAcceptance: 80, paymentReadiness: 50, privacySensitivity: 85,
    preferredTone: "学术、严谨、可复现",
    preferredOnboarding: "Documentation → Method → Replicate",
    bestEntryPoint: "Documentation + Feedback Protocol",
    riskWarningStyle: "Explicit research-prototype disclaimer",
    monetizationFit: "Research license / Institutional",
    uxStrategy: [
      "强调 research prototype",
      "强调 feedback protocol",
      "强调 not deterministic",
      "提供文档中心、方法论说明、版本史",
    ],
    defaultMode: "documentation_first",
    copy: {
      heading: "A research prototype for structured forecasting and feedback calibration.",
      subheading: "Method-first. Documented constants, multi-calculus kernel, determinant number method, and a feedback protocol.",
      primaryCta: "Read Whitepaper",
      secondaryCta: "Inspect Calculus",
    },
    featurePriority: ["Documentation", "Method / Calculus", "Feedback Protocol", "Roadmap", "Case Library"],
    primaryUserFear: "Pseudoscientific framing / non-falsifiable claims",
    primaryUserDesire: "Replicable methodology + feedback dataset",
  },
  {
    key: "creator", regionName: "创作者与独立开发者", regionEn: "Creator / Indie Hacker", flag: "🎨",
    languagePreference: ["English", "简体中文"],
    trustPath: "可复制 prompt + 可视化 + 快速反馈",
    culturalSensitivity: ["不喜欢复杂", "喜欢新奇"],
    productComprehensionLevel: 80, mysticalTolerance: 55,
    aiAcceptance: 92, paymentReadiness: 65, privacySensitivity: 65,
    preferredTone: "工具感、轻量、节奏快",
    preferredOnboarding: "Forge Prompt → Scan Product Timing → Pick Action",
    bestEntryPoint: "Prompt Forge + Product Vitality",
    riskWarningStyle: "短小、轻量、明确",
    monetizationFit: "Lifetime / Pro / Indie plan",
    uxStrategy: [
      "强调 Prompt Forge / Product Vitality / Launch Window",
      "做成创作者策略系统",
      "首页直接给「下一步做什么」",
    ],
    defaultMode: "creator_strategy",
    copy: {
      heading: "Your timing, product, and prompt strategy cockpit.",
      subheading: "Find launch windows, product vitality, prompt direction, and next action permissions.",
      primaryCta: "Forge Next Prompt",
      secondaryCta: "Scan Product Timing",
    },
    featurePriority: ["Prompt Forge", "Product Vitality", "Launch Window", "Trigger Calendar", "Feedback"],
    primaryUserFear: "工具太重 / 没立刻拿到结果",
    primaryUserDesire: "下一步发布 / 下一段 prompt / 下一个决定",
  },
];

export function getRegion(key: string): RegionProfile {
  return REGION_PROFILES.find((r) => r.key === key) ?? REGION_PROFILES[0];
}
