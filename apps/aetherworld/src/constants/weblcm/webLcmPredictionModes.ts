export type WebLcmPredictionMode =
  | "GRAPH_RELATION_BASED"
  | "CALCULUS_PATTERN_BASED"
  | "CONSTANT_CONSTRAINT_BASED"
  | "WORKSPACE_HISTORY_BASED"
  | "PERSONALITY_BIAS_BASED"
  | "WEBLLM_ASSISTED";

export const WEB_LCM_PREDICTION_MODES: { id: WebLcmPredictionMode; title: string; description: string }[] = [
  { id: "GRAPH_RELATION_BASED",      title: "基于关系图谱",     description: "依据 Concept Graph 边类型预测后续概念。" },
  { id: "CALCULUS_PATTERN_BASED",    title: "基于计算法模式",   description: "依据计算法结构推断下一步概念。" },
  { id: "CONSTANT_CONSTRAINT_BASED", title: "基于常数约束",     description: "依据常数宇宙约束筛选可行概念。" },
  { id: "WORKSPACE_HISTORY_BASED",   title: "基于 Workspace 历史", description: "参考用户历史概念路径。" },
  { id: "PERSONALITY_BIAS_BASED",    title: "基于主体人格偏置", description: "依据真实主体 / Full60 摘要偏置候选。" },
  { id: "WEBLLM_ASSISTED",           title: "WebLLM 辅助预测",  description: "可选 WebLLM 协助补全候选概念。" },
];

export const DEFAULT_WEB_LCM_PREDICTION_MODE: WebLcmPredictionMode = "GRAPH_RELATION_BASED";
