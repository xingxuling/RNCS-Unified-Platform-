// Version Iteration Calculus — version stage definitions
// Describes the full v0.1 → v2.0 trajectory of Aether Fate Engine.

export type VersionStageId =
  | "v0_1"
  | "v0_2"
  | "v0_3"
  | "v0_4"
  | "v0_5"
  | "v0_6"
  | "v0_7"
  | "v0_9_RC"
  | "v1_0"
  | "v1_1"
  | "v1_2"
  | "v1_3"
  | "v1_4"
  | "v1_5"
  | "v2_0";

export interface VersionStageMeta {
  id: VersionStageId;
  label: string;          // e.g. v0.3
  cn: string;             // 中文阶段名
  en: string;             // 英文阶段名
  summary: string;        // 单句核心
  pillars: string[];      // 核心模块
  shipped: boolean;       // 是否已完成
}

export const VERSION_STAGES: VersionStageMeta[] = [
  {
    id: "v0_1",
    label: "v0.1",
    cn: "原型奠基",
    en: "Foundation Prototype",
    summary: "底层预测 OS 原型：主体模型、常数宇宙、触发日历、五域判断、回验基础。",
    pillars: ["Subject Seed", "Constant Universe", "Trigger Calendar", "Five-Domain Judge", "Feedback v0"],
    shipped: true,
  },
  {
    id: "v0_2",
    label: "v0.2",
    cn: "多计算法内核",
    en: "Multi-Calculus Core",
    summary: "信号净化 / 折域 / 反冲 / 共振锁定 / 分支塌缩 / 产品活性 / 地理 / 提示词。",
    pillars: ["Signal", "Folding", "Rebound", "Resonance", "Collapse", "Vitality", "Geo", "Prompt"],
    shipped: true,
  },
  {
    id: "v0_3",
    label: "v0.3",
    cn: "定数计算层",
    en: "Determinant Layer",
    summary: "未定 / 半定 / 接近已定 / 已定 / 反定 / 假定 的最终收束判断。",
    pillars: ["Determinant Engine", "Action Permission"],
    shipped: true,
  },
  {
    id: "v0_4",
    label: "v0.4",
    cn: "回验学习层",
    en: "Feedback Learning Layer",
    summary: "回验记录、权重修正、个体模型进化。",
    pillars: ["Feedback Store", "Weight Engine", "Personal Evolution"],
    shipped: true,
  },
  {
    id: "v0_5",
    label: "v0.5",
    cn: "真实主体层",
    en: "Real Subject Layer",
    summary: "Demo / Light 20 / Full 60 / Imported 四种模式与三段循环。",
    pillars: ["Real Subject Calculus", "Cycle Comparison", "Privacy Isolation"],
    shipped: true,
  },
  {
    id: "v0_6",
    label: "v0.6",
    cn: "地区体验层",
    en: "Regional UX Layer",
    summary: "地区画像、UX 模式、地区化文案、地区化 Prompt。",
    pillars: ["Region Profiles", "UX Modes", "Regional Copy", "Trust Layers"],
    shipped: true,
  },
  {
    id: "v0_7",
    label: "v0.7",
    cn: "内测发布层",
    en: "Beta Launch Layer",
    summary: "内测成熟度、用户分层、访问等级、风险门。",
    pillars: ["Beta Calculus", "Access Levels", "Risk Gate", "Invite Copy"],
    shipped: true,
  },
  {
    id: "v0_9_RC",
    label: "v0.9 RC",
    cn: "v1.0 候选预备",
    en: "Release Candidate Prep",
    summary: "闭环已成立但仍需补齐文档、回验数据或安全边界的临界版本。",
    pillars: ["Loop Verification", "Docs Audit", "Safety Audit"],
    shipped: false,
  },
  {
    id: "v1_0",
    label: "v1.0",
    cn: "私密内测候选版",
    en: "Private Beta Candidate",
    summary: "可进入小范围真实用户内测的完整系统版本。",
    pillars: [
      "Closed Prediction Loop",
      "Determinant + Feedback",
      "Privacy Boundary",
      "Documentation Center",
      "Regional UX",
      "Beta Launch Console",
    ],
    shipped: false,
  },
  {
    id: "v1_1",
    label: "v1.1",
    cn: "内测 UX 加固",
    en: "Beta UX Hardening",
    summary: "简化 onboarding、降低术语门槛、移动端体验优化。",
    pillars: ["Onboarding v2", "Glossary Inline", "Mobile UX"],
    shipped: false,
  },
  {
    id: "v1_2",
    label: "v1.2",
    cn: "回验智能化",
    en: "Feedback Intelligence",
    summary: "权重进化增强、事件命中统计、偏差诊断、个体学习报告。",
    pillars: ["Bias Diagnostics", "Event Hit Stats", "Personal Report"],
    shipped: false,
  },
  {
    id: "v1_3",
    label: "v1.3",
    cn: "真实主体深度模式",
    en: "Real Subject Deep Mode",
    summary: "Full 60 高级分析、三循环回验表现、终端收束趋势、主体导出/删除完善。",
    pillars: ["Deep Cycle Analysis", "Terminal Trend", "Subject Export/Delete"],
    shipped: false,
  },
  {
    id: "v1_4",
    label: "v1.4",
    cn: "提示词策略 OS",
    en: "Prompt Strategy OS",
    summary: "Prompt Forge 深度升级、提示词效果回验、Lovable / Codex / Cursor 模式分化。",
    pillars: ["Prompt Effectiveness", "Multi-IDE Modes", "Prompt Feedback"],
    shipped: false,
  },
  {
    id: "v1_5",
    label: "v1.5",
    cn: "研究报告导出",
    en: "Research Report Export",
    summary: "个人预测报告、回验报告、方法论文档、匿名案例导出。",
    pillars: ["Personal Report Export", "Methodology Export", "Anonymous Case"],
    shipped: false,
  },
  {
    id: "v2_0",
    label: "v2.0",
    cn: "公开预览 / 候补",
    en: "Public Preview / Waitlist",
    summary: "公开候补、Demo-first 体验、轻量真实主体、不开放高风险强断。",
    pillars: ["Waitlist", "Demo-First", "Safety Limits"],
    shipped: false,
  },
];

export const VERSION_STAGE_MAP: Record<VersionStageId, VersionStageMeta> =
  Object.fromEntries(VERSION_STAGES.map((s) => [s.id, s])) as Record<VersionStageId, VersionStageMeta>;
