// 同账号项目融合 · 数据结构
// 不无脑复制：所有候选必须经过分析 / 冲突检测 / 风险分级 / Bridge Plan。

export type FusionRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type FusionRecommendation =
  | "FUSE_NOW"
  | "REFERENCE_ONLY"
  | "BRIDGE_LATER"
  | "CONFLICT"
  | "IGNORE";

export type FusionType =
  | "COMPONENT_REUSE"
  | "LOGIC_REUSE"
  | "DATA_MODEL_REUSE"
  | "UI_PATTERN_REUSE"
  | "ROUTE_REFERENCE"
  | "RUNTIME_BRIDGE"
  | "FULL_BRIDGE_PLAN"
  | "REFERENCE_ONLY";

export type FusionStatus =
  | "SUCCESS"
  | "PARTIAL"
  | "SKIPPED"
  | "BLOCKED"
  | "FAILED";

/** 同账号项目候选（来自手动登记 / Chat 描述 / 同账号引用） */
export interface SameAccountProjectCandidate {
  id: string;
  projectName: string;
  /** 项目类型（AI Chat / Workspace / Calendar / Store / Social / World / Sandbox / Analytics / Provider / OS / Other） */
  projectType: string;
  description?: string;
  detectedModules: string[];
  reusableComponents: string[];
  reusableLogic: string[];
  reusableDataModels: string[];
  reusableRoutes: string[];
  reusableUiPatterns: string[];
  riskLevel: FusionRiskLevel;
  fusionRecommendation: FusionRecommendation;
  notes: string;
  createdAt: string;
}

/** 融合计划：明确目标系统 + 文件草案 + 冲突 + 步骤 */
export interface ProjectFusionPlan {
  id: string;
  sourceProjectId: string;
  sourceProjectName: string;
  targetSystems: string[];
  fusionType: FusionType;
  filesToCreate: string[];
  filesToModify: string[];
  conflicts: string[];
  safetyNotes: string[];
  steps: string[];
  recommendedPriority: "P0" | "P1" | "P2" | "P3";
  riskLevel: FusionRiskLevel;
  createdAt: string;
}

/** 融合结果（只记录草案 / 桥接，不直接落地高风险代码） */
export interface ProjectFusionResult {
  id: string;
  planId: string;
  status: FusionStatus;
  changedFiles: string[];
  skippedItems: string[];
  conflictNotes: string[];
  auditNotes: string[];
  createdAt: string;
}

export interface ProjectFusionScanReport {
  scanId: string;
  candidates: SameAccountProjectCandidate[];
  plans: ProjectFusionPlan[];
  results: ProjectFusionResult[];
  warnings: string[];
  createdAt: string;
}

export const PROJECT_FUSION_CALCULUS = "PROJECT_FUSION_RUNTIME" as const;
