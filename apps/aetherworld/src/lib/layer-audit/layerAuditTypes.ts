// Aether Layered System Gap Audit v0.1 · 类型
// 按 L0-L10 + 骨架/肌肉/血液/神经四象，对 Aetherworld 当前形态做系统级缺口审计。

export type LayerAspect = "SKELETON" | "MUSCLE" | "BLOOD" | "NERVE";

export type LayerActionType =
  | "CREATE_REGISTRY"
  | "CREATE_BRIDGE"
  | "CONNECT_RECORD"
  | "CONNECT_MSL"
  | "CONNECT_MEMORY"
  | "CONNECT_CURRENCY"
  | "CONNECT_SCHEDULER"
  | "CONNECT_ANALYTICS"
  | "ADD_FALLBACK"
  | "ADD_QA"
  | "MERGE_DUPLICATE"
  | "DOCUMENT_ONLY";

export type LayerRiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type LayerPriority = "P0" | "P1" | "P2" | "P3";

export interface LayerAspectStatus {
  /** 0-100，越高代表本象已成型 */
  score: number;
  existing: string[];
  missing: string[];
  duplicated: string[];
  notes: string;
}

export interface LayerCompletionAction {
  id: string;
  title: string;
  targetLayer: string;
  aspect: LayerAspect;
  priority: LayerPriority;
  actionType: LayerActionType;
  description: string;
  suggestedFiles: string[];
  riskLevel: LayerRiskLevel;
}

export interface LayerGapItem {
  layerId: string;
  layerName: string;
  existingSystems: string[];
  skeleton: LayerAspectStatus;
  muscle: LayerAspectStatus;
  blood: LayerAspectStatus;
  nerve: LayerAspectStatus;
  risks: string[];
  recommendedActions: LayerCompletionAction[];
  /** 综合成熟度 0-100 */
  maturityScore: number;
}

export interface LayerGapReport {
  id: string;
  generatedAt: string;
  layers: LayerGapItem[];
  globalMissingSkeleton: string[];
  globalMissingMuscle: string[];
  globalMissingBlood: string[];
  globalMissingNerve: string[];
  p0CompletionPlan: LayerCompletionAction[];
  p1CompletionPlan: LayerCompletionAction[];
  summary: string;
}

/** 静态层定义（不会随运行时变化的描述部分） */
export interface LayerDefinition {
  layerId: string;
  layerName: string;
  cnDescription: string;
  /** 该层「应当具备」的代表模块（用于扫描时与 existing 对比） */
  expectedSystems: string[];
}
