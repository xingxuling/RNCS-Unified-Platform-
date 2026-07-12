// QA Module Registry · 当前系统所有核心模块

export type QAModuleStatus =
  | "STABLE"
  | "BETA"
  | "EXPERIMENTAL"
  | "PLACEHOLDER"
  | "LOCKED";

export interface QAModule {
  id: string;
  name: string;          // 中文名
  en: string;
  status: QAModuleStatus;
  expectedRoute?: string;
  expectedComponents: string[];
  expectedStorageKeys?: string[];
  expectedIntegrations: string[];   // 引用其他模块 id
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  documented: boolean;              // 是否已写入产品文档
}

export const QA_MODULE_REGISTRY: QAModule[] = [
  {
    id: "subject-model", name: "主体模型", en: "Subject Model", status: "STABLE",
    expectedRoute: "/subject",
    expectedComponents: ["SubjectSwitcher"],
    expectedIntegrations: ["demo-persona", "light-20", "full-60", "imported-subject"],
    riskLevel: "LOW", documented: true,
  },
  {
    id: "demo-persona", name: "Demo Persona", en: "Demo Persona", status: "STABLE",
    expectedComponents: ["DemoRealIsolationBadge"],
    expectedStorageKeys: ["aether.realSubject.mode.v1"],
    expectedIntegrations: ["subject-model"],
    riskLevel: "LOW", documented: true,
  },
  {
    id: "light-20", name: "Light 20 主体", en: "Light 20 Subject", status: "BETA",
    expectedRoute: "/real-subject",
    expectedComponents: ["FullSequenceInput"],
    expectedStorageKeys: ["aether.realSubject.full60.v1"],
    expectedIntegrations: ["subject-model", "real-subject-calculus"],
    riskLevel: "MEDIUM", documented: true,
  },
  {
    id: "full-60", name: "Full 60 主体", en: "Full 60 Subject", status: "EXPERIMENTAL",
    expectedRoute: "/real-subject",
    expectedComponents: ["FullSequenceInput", "SequenceCycleView", "SubjectCycleComparison"],
    expectedStorageKeys: ["aether.realSubject.full60.v1", "aether.realSubject.mode.v1"],
    expectedIntegrations: ["real-subject-calculus", "determinant-engine", "feedback-weight-engine", "prompt-forge", "manual-calculus"],
    riskLevel: "HIGH", documented: true,
  },
  {
    id: "imported-subject", name: "Imported 主体", en: "Imported Subject", status: "EXPERIMENTAL",
    expectedComponents: ["FullSequenceInput"],
    expectedIntegrations: ["subject-model", "manual-calculus"],
    riskLevel: "HIGH", documented: true,
  },
  {
    id: "real-subject-calculus", name: "真实主体计算法", en: "Real Subject Calculus", status: "BETA",
    expectedRoute: "/real-subject",
    expectedComponents: ["FullSubjectProfileCard", "SubjectSequenceHealthPanel"],
    expectedIntegrations: ["full-60", "determinant-engine", "feedback-weight-engine", "prompt-forge", "docs-center", "trigger-calendar"],
    riskLevel: "HIGH", documented: true,
  },
  {
    id: "trigger-calendar", name: "触发日历", en: "Trigger Calendar", status: "STABLE",
    expectedRoute: "/calendar",
    expectedComponents: ["TriggerBadge"],
    expectedIntegrations: ["subject-model", "determinant-engine", "feedback-entry"],
    riskLevel: "LOW", documented: true,
  },
  {
    id: "timeline", name: "时间线", en: "Timeline", status: "STABLE",
    expectedRoute: "/timeline",
    expectedComponents: ["PredictionCard"],
    expectedIntegrations: ["subject-model"],
    riskLevel: "LOW", documented: true,
  },
  {
    id: "prediction-detail", name: "预测详情", en: "Prediction Detail", status: "STABLE",
    expectedRoute: "/prediction/$date",
    expectedComponents: ["DeterminationCard", "FeedbackEntryCard", "SafetyBoundaryBanner"],
    expectedIntegrations: ["determinant-engine", "feedback-entry", "safety-boundary"],
    riskLevel: "HIGH", documented: true,
  },
  {
    id: "constants-library", name: "常数库", en: "Constants Library", status: "STABLE",
    expectedRoute: "/constants", expectedComponents: [],
    expectedIntegrations: [], riskLevel: "LOW", documented: true,
  },
  {
    id: "feedback-center", name: "回验中心", en: "Feedback Center", status: "STABLE",
    expectedRoute: "/feedback",
    expectedComponents: ["FeedbackEntryCard"],
    expectedStorageKeys: ["aether.feedback.records.v1"],
    expectedIntegrations: ["feedback-weight-engine", "feedback-entry"],
    riskLevel: "LOW", documented: true,
  },
  {
    id: "feedback-weight-engine", name: "回验权重计算法", en: "Feedback Weight Engine", status: "BETA",
    expectedRoute: "/feedback-weights",
    expectedComponents: ["FeedbackWeightPanel", "EngineWeightMatrix", "FeedbackImpactChart", "PersonalModelEvolutionCard"],
    expectedIntegrations: ["feedback-center", "determinant-engine", "prompt-forge", "regional-ux", "beta-launch", "version-iteration"],
    riskLevel: "MEDIUM", documented: true,
  },
  {
    id: "regional-ux", name: "地区用户体验计算法", en: "Regional UX Engine", status: "BETA",
    expectedRoute: "/regional-ux",
    expectedComponents: ["RegionalUXPanel", "RegionProfileCard", "UserJourneyMap"],
    expectedIntegrations: ["prompt-forge", "beta-launch", "version-iteration", "docs-center"],
    riskLevel: "LOW", documented: true,
  },
  {
    id: "beta-launch", name: "内测发布计算法", en: "Beta Launch Calculus", status: "BETA",
    expectedRoute: "/beta-launch",
    expectedComponents: ["BetaReadinessPanel", "BetaAccessMatrix", "BetaRiskGate", "BetaFeatureGate", "BetaLaunchTimeline"],
    expectedStorageKeys: [],
    expectedIntegrations: ["version-iteration", "software-qa", "feedback-weight-engine", "manual-calculus"],
    riskLevel: "HIGH", documented: true,
  },
  {
    id: "version-iteration", name: "版本迭代计算法", en: "Version Iteration Calculus", status: "BETA",
    expectedRoute: "/version-iteration",
    expectedComponents: ["VersionReadinessPanel", "ReleaseGateChecklist", "ModuleStabilityMatrix", "V1LaunchSummary", "PostV1IterationPlan"],
    expectedIntegrations: ["beta-launch", "software-qa", "docs-center"],
    riskLevel: "HIGH", documented: true,
  },
  {
    id: "manual-calculus", name: "使用手册计算法", en: "Manual Calculus", status: "BETA",
    expectedRoute: "/usage-safety",
    expectedComponents: ["ContextualManualHint", "SafetyBoundaryBanner", "FeedbackEntryCard", "DemoRealIsolationBadge"],
    expectedIntegrations: ["safety-boundary", "feedback-entry", "demo-real-isolation", "beta-launch", "version-iteration", "usage-safety"],
    riskLevel: "MEDIUM", documented: true,
  },
  {
    id: "software-qa", name: "软件测试反馈计算法", en: "Software QA Feedback Calculus", status: "BETA",
    expectedRoute: "/software-qa",
    expectedComponents: ["QAHealthPanel", "QAModuleScanner", "QARouteScanner", "QADataIntegrityPanel", "QAIsolationAudit", "QASafetyCoveragePanel", "QAFeedbackEntryAudit", "QADocumentationConsistency", "QAFixPriorityBoard", "QAFixPromptGenerator", "QARegressionChecklist"],
    expectedStorageKeys: ["aether.qa.state.v1"],
    expectedIntegrations: ["version-iteration", "beta-launch", "prompt-forge", "docs-center"],
    riskLevel: "MEDIUM", documented: true,
  },
  {
    id: "determinant-engine", name: "定数计算法", en: "Determinant Number Engine", status: "STABLE",
    expectedComponents: ["DeterminationCard"],
    expectedIntegrations: ["subject-model", "feedback-weight-engine"],
    riskLevel: "MEDIUM", documented: true,
  },
  {
    id: "signal-purification", name: "信号净化", en: "Signal Purification", status: "STABLE",
    expectedRoute: "/signal", expectedComponents: ["SignalPurificationCard"],
    expectedIntegrations: [], riskLevel: "LOW", documented: true,
  },
  {
    id: "domain-folding", name: "域折叠", en: "Domain Folding", status: "STABLE",
    expectedComponents: ["DomainFoldingRadar", "DomainRadar"],
    expectedIntegrations: [], riskLevel: "LOW", documented: true,
  },
  {
    id: "pressure-rebound", name: "压力反冲", en: "Pressure Rebound", status: "STABLE",
    expectedComponents: ["ReboundGauge"],
    expectedIntegrations: [], riskLevel: "LOW", documented: true,
  },
  {
    id: "resonance-lock", name: "共振锁定", en: "Resonance Lock", status: "STABLE",
    expectedRoute: "/resonance", expectedComponents: ["ResonanceMap"],
    expectedIntegrations: [], riskLevel: "LOW", documented: true,
  },
  {
    id: "branch-collapse", name: "分支塌缩", en: "Branch Collapse", status: "STABLE",
    expectedRoute: "/branch-collapse", expectedComponents: ["BranchCollapseView"],
    expectedIntegrations: [], riskLevel: "LOW", documented: true,
  },
  {
    id: "constant-value", name: "常数估值", en: "Constant Value", status: "STABLE",
    expectedComponents: [], expectedIntegrations: [], riskLevel: "LOW", documented: true,
  },
  {
    id: "product-vitality", name: "产品活性", en: "Product Vitality", status: "STABLE",
    expectedRoute: "/vitality", expectedComponents: ["ProductVitalityPanel"],
    expectedIntegrations: [], riskLevel: "MEDIUM", documented: true,
  },
  {
    id: "geo-factor", name: "地理因素", en: "Geo-Factor", status: "STABLE",
    expectedRoute: "/geo", expectedComponents: ["GeoAnalysisPanel"],
    expectedIntegrations: [], riskLevel: "MEDIUM", documented: true,
  },
  {
    id: "prompt-calculus", name: "提示词计算法", en: "Prompt Calculus", status: "STABLE",
    expectedComponents: [], expectedIntegrations: ["prompt-forge"],
    riskLevel: "LOW", documented: true,
  },
  {
    id: "prompt-forge", name: "提示词锻造炉", en: "Prompt Forge", status: "STABLE",
    expectedRoute: "/prompt-forge", expectedComponents: [],
    expectedIntegrations: ["regional-ux", "feedback-weight-engine", "real-subject-calculus", "manual-calculus", "software-qa"],
    riskLevel: "MEDIUM", documented: true,
  },
  {
    id: "docs-center", name: "产品文档中心", en: "Product Documentation Center", status: "STABLE",
    expectedRoute: "/docs", expectedComponents: [],
    expectedIntegrations: ["manual-calculus", "software-qa", "regional-ux", "feedback-weight-engine", "real-subject-calculus", "beta-launch", "version-iteration"],
    riskLevel: "LOW", documented: true,
  },
  {
    id: "usage-safety", name: "使用与安全", en: "Usage & Safety", status: "STABLE",
    expectedRoute: "/usage-safety",
    expectedComponents: ["QuickStartGuidePanel", "DataPrivacyPanel", "PredictionUseGuide"],
    expectedIntegrations: ["manual-calculus", "safety-boundary", "demo-real-isolation"],
    riskLevel: "LOW", documented: true,
  },
  {
    id: "safety-boundary", name: "安全边界", en: "Safety Boundary", status: "STABLE",
    expectedComponents: ["SafetyBoundaryBanner"],
    expectedIntegrations: ["manual-calculus"], riskLevel: "MEDIUM", documented: true,
  },
  {
    id: "demo-real-isolation", name: "Demo/Real 隔离", en: "Demo/Real Isolation", status: "STABLE",
    expectedComponents: ["DemoRealIsolationBadge", "SubjectModeWarning"],
    expectedIntegrations: ["manual-calculus", "subject-model"],
    riskLevel: "HIGH", documented: true,
  },
  {
    id: "feedback-entry", name: "回验入口", en: "Feedback Entry", status: "STABLE",
    expectedComponents: ["FeedbackEntryCard"],
    expectedIntegrations: ["feedback-center", "feedback-weight-engine"],
    riskLevel: "MEDIUM", documented: true,
  },
];
