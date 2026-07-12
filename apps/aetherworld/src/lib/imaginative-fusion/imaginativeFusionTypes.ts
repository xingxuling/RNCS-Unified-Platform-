// 畅想式项目融合 · 数据结构
export type ImaginativeFusionMode =
  | "PRODUCT_FUSION"
  | "WORKFLOW_FUSION"
  | "AGENT_FUSION"
  | "WORLD_FUSION"
  | "STORE_FUSION"
  | "BUSINESS_FUSION";

export type ImaginativeNextStep =
  | "MAKE_BRIDGE_PLAN"
  | "CREATE_WEBXXM_PACKAGE_DRAFT"
  | "CREATE_AGENT_TOOL"
  | "CREATE_WORKSPACE_OBJECT"
  | "CREATE_SCHEDULER_TASK"
  | "REFERENCE_ONLY"
  | "DEFER";

export interface ImaginativeFusionIdea {
  id: string;
  title: string;
  cnTitle: string;
  fusionMode: ImaginativeFusionMode;
  sourceProjects: string[];
  sourceConcepts: string[];
  description: string;
  targetAetherSystems: string[];
  potentialValue: number;      // 0-10
  implementationDifficulty: number; // 0-10
  strategicFit: number;        // 0-10
  novelty: number;             // 0-10
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  recommendedPriority: "P0" | "P1" | "P2" | "P3";
  suggestedNextStep: ImaginativeNextStep;
  roadmap: string[];
  risks: string[];
  notes: string;
}

export interface ImaginativeFusionReport {
  id: string;
  generatedAt: string;
  sourceProjectCount: number;
  ideaCount: number;
  topIdeas: ImaginativeFusionIdea[];
  p0Ideas: ImaginativeFusionIdea[];
  p1Ideas: ImaginativeFusionIdea[];
  deferredIdeas: ImaginativeFusionIdea[];
  summary: string;
}

export interface WebXXMPackageIdea {
  packageName: string;
  capability: string;
  input: string;
  output: string;
  requiredPermissions: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  installFlow: string[];
  usageExample: string;
}

export interface ProjectConceptSeed {
  projectName: string;
  positioning: string;
  concepts: string[];
  modules: string[];
  worldElements: string[];
  automation: string[];
  businessHints: string[];
}

export const IMAGINATIVE_FUSION_CALCULUS = "IMAGINATIVE_FUSION_RUNTIME" as const;
