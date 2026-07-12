import type { AetherConcept, AetherConceptChain, ConceptPrediction } from "./webLcmTypes";
import { newId } from "./webLcmTypes";
import type { WebLcmPredictionMode } from "@/constants/weblcm/webLcmPredictionModes";

const SUCCESSOR_HINTS: Record<string, { title: string; type: AetherConcept["conceptType"]; reason: string }[]> = {
  INTENT_CONCEPT:    [{ title: "需求分解", type: "WORKFLOW_CONCEPT", reason: "意图通常进入工作流。" }],
  APP_CONCEPT:       [{ title: "架构概念", type: "SYSTEM_CONCEPT", reason: "应用进入架构层。" },
                      { title: "文件树概念", type: "CODE_CONCEPT", reason: "架构产生代码骨架。" }],
  ERROR_CONCEPT:     [{ title: "补丁草案", type: "PATCH_CONCEPT", reason: "错误驱动补丁。" }],
  WORLD_CONCEPT:     [{ title: "剧情冲突", type: "NARRATIVE_CONCEPT", reason: "世界孕育剧情。" },
                      { title: "世界主题曲", type: "VOCAL_CONCEPT", reason: "世界对应声乐。" }],
  CHARACTER_CONCEPT: [{ title: "动机", type: "NARRATIVE_CONCEPT", reason: "角色推动叙事。" },
                      { title: "情绪基调", type: "EMOTION_CONCEPT", reason: "角色具有情绪。" }],
  CALCULUS_CONCEPT:  [{ title: "可执行行动", type: "WORKFLOW_CONCEPT", reason: "计算法转化行动。" }],
  EMOTION_CONCEPT:   [{ title: "声线", type: "VOCAL_CONCEPT", reason: "情绪映射声线。" }],
};

export interface PredictOptions {
  mode?: WebLcmPredictionMode;
  maxPredictions?: number;
}

export function predictNextConcepts(chain: AetherConceptChain, opts: PredictOptions = {}): ConceptPrediction {
  const last = chain.orderedConcepts[chain.orderedConcepts.length - 1];
  const candidates = (last && SUCCESSOR_HINTS[last.conceptType]) ?? [];
  const max = opts.maxPredictions ?? 4;
  const predicted: AetherConcept[] = candidates.slice(0, max).map(hint => ({
    conceptId: newId("cpt"),
    title: hint.title,
    conceptType: hint.type,
    sourceType: "SEQUENCE_AI_OUTPUT",
    summary: `${hint.reason}（基于 ${last?.title ?? "概念链末端"}）`,
    keywords: [hint.title],
    abstractionLevel: "MEDIUM",
    domainTags: [],
    calculusTags: [],
    constantTags: [],
    worldTags: [],
    personalityBiasTags: [],
    confidence: 0.55,
    safetyNotes: ["概念预测不等于现实确定性。"],
    createdAt: new Date().toISOString(),
  }));
  return {
    predictionId: newId("pred"),
    chainId: chain.chainId,
    predictedConcepts: predicted,
    predictionReason: candidates.map(c => c.reason).join(" / ") || "末端概念无显著后继候选。",
    confidence: predicted.length ? 0.55 : 0.2,
    riskNotes: ["预测仅为概念候选，非现实预测。", `模式：${opts.mode ?? "GRAPH_RELATION_BASED"}`],
  };
}
