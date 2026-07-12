// 提示词变量注入器 · Prompt Variable Injector
// 从系统当前状态自动收集变量；用户可手动覆盖。
import type { TemplateVariables } from "./promptTemplateCompiler";

export interface SystemSnapshot {
  productName?: string;
  currentVersion?: string;
  currentModules?: string[];
  missingModules?: string[];
  qaIssues?: number;
  betaStatus?: string;
  versionReadiness?: number;
  userLanguageLevel?: string;
  region?: string;
  subjectMode?: string;
  safetyRules?: string[];
  feedbackStats?: { total: number; effective: number };
  accuracyStats?: number;
}

export const DEFAULT_SNAPSHOT: SystemSnapshot = {
  productName: "Aether Fate Engine · 以太命运引擎",
  currentVersion: "v1.0 RC",
  currentModules: [
    "Subject Model","Real Subject Calculus","Trigger Calendar","Timeline",
    "Prediction Detail","Multi-Calculus Core","Determinant Number Engine",
    "Feedback Weight Engine","Regional UX Engine","Beta Launch Calculus",
    "Version Iteration Calculus","Manual Calculus","Software QA Feedback Calculus",
    "Global Recalculation Engine","Multi-Client UI Fit","Prediction Dimension & Event",
    "Product–User Language Translation","Prompt Forge",
  ],
  missingModules: [],
  qaIssues: 0,
  betaStatus: "Private Beta Candidate",
  versionReadiness: 82,
  userLanguageLevel: "PROFESSIONAL",
  region: "hk",
  subjectMode: "Demo",
  safetyRules: [
    "预测 ≠ 断言未来；行动可改变结果",
    "Demo / Real 严格隔离",
    "不公开 Full 60 数列原值",
  ],
  feedbackStats: { total: 0, effective: 0 },
  accuracyStats: 0,
};

export function buildVariablesFromSnapshot(snap: SystemSnapshot, override: TemplateVariables = {}): TemplateVariables {
  const base: TemplateVariables = {
    productName: snap.productName,
    currentVersion: snap.currentVersion,
    existingModules: (snap.currentModules ?? []).join(", "),
    region: snap.region,
    languageLevel: snap.userLanguageLevel,
    riskBoundary: (snap.safetyRules ?? []).join("；"),
    doNotBreak: (snap.currentModules ?? []).join(", "),
    acceptanceCriteria: "可手动验证、保留安全边界、不破坏既有模块。",
  };
  return { ...base, ...stripEmpty(override) };
}

function stripEmpty(v: TemplateVariables): TemplateVariables {
  const out: TemplateVariables = {};
  Object.entries(v).forEach(([k, val]) => {
    if (val !== undefined && val !== "") out[k] = val;
  });
  return out;
}
