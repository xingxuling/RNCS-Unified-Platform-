// Beta Access Levels — what each user tier can unlock during beta.

export type BetaAccessLevelId =
  | "L0_DEMO"
  | "L1_LIGHT20"
  | "L2_FULL60"
  | "L3_FEEDBACK"
  | "L4_PROMPT"
  | "L5_ADVANCED"
  | "L6_RESEARCH"
  | "L7_ENTERPRISE";

export interface BetaAccessLevel {
  id: BetaAccessLevelId;
  label: string;
  cn: string;
  en: string;
  desc: string;
  unlocks: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

export const BETA_ACCESS_LEVELS: Record<BetaAccessLevelId, BetaAccessLevel> = {
  L0_DEMO: {
    id: "L0_DEMO",
    label: "Level 0",
    cn: "仅 Demo",
    en: "Demo Only",
    desc: "仅允许使用 Demo Persona，不允许真实主体。",
    unlocks: ["Demo Persona", "产品总览", "安全边界"],
    riskLevel: "LOW",
  },
  L1_LIGHT20: {
    id: "L1_LIGHT20",
    label: "Level 1",
    cn: "Light 20",
    en: "Light 20 Access",
    desc: "允许创建 20 组轻量主体。",
    unlocks: ["Light 20 主体", "触发日历", "基础回验"],
    riskLevel: "LOW",
  },
  L2_FULL60: {
    id: "L2_FULL60",
    label: "Level 2",
    cn: "Full 60 私密",
    en: "Full 60 Private",
    desc: "允许使用 60 组完整真实主体，仅本地保存，强隐私提示。",
    unlocks: ["Full 60 真实主体", "三循环对比", "终端模式分析"],
    riskLevel: "MEDIUM",
  },
  L3_FEEDBACK: {
    id: "L3_FEEDBACK",
    label: "Level 3",
    cn: "回验学习",
    en: "Feedback Learning",
    desc: "允许开启回验权重学习。",
    unlocks: ["回验权重计算", "个体模型进化"],
    riskLevel: "MEDIUM",
  },
  L4_PROMPT: {
    id: "L4_PROMPT",
    label: "Level 4",
    cn: "Prompt Forge",
    en: "Prompt Forge",
    desc: "允许使用提示词锻造炉。",
    unlocks: ["Prompt Forge", "结构化提示词输出"],
    riskLevel: "MEDIUM",
  },
  L5_ADVANCED: {
    id: "L5_ADVANCED",
    label: "Level 5",
    cn: "高级内核",
    en: "Advanced Core",
    desc: "允许查看多计算法内核细节。",
    unlocks: ["Advanced Core", "信号净化", "共振锁定", "分支塌缩"],
    riskLevel: "MEDIUM",
  },
  L6_RESEARCH: {
    id: "L6_RESEARCH",
    label: "Level 6",
    cn: "研究模式",
    en: "Research Mode",
    desc: "允许查看白皮书、计算法文档、回验协议、导出测试报告。",
    unlocks: ["白皮书", "计算法文档", "回验协议", "测试报告导出"],
    riskLevel: "LOW",
  },
  L7_ENTERPRISE: {
    id: "L7_ENTERPRISE",
    label: "Level 7",
    cn: "企业安全模式",
    en: "Enterprise Safe Mode",
    desc: "隐藏命运化语言，仅展示 Decision OS、Scenario Trigger、Risk Window。",
    unlocks: ["Decision Timing", "Scenario Trigger", "Risk Window"],
    riskLevel: "LOW",
  },
};

export const BETA_ACCESS_LEVEL_LIST = Object.values(BETA_ACCESS_LEVELS);
