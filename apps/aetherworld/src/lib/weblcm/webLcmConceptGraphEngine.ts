import type { AetherConcept, AetherConceptGraph, AetherConceptEdge, AetherConceptNode } from "./webLcmTypes";
import { newId } from "./webLcmTypes";
import type { WebLcmRelationType } from "@/constants/weblcm/webLcmGraphRelationTypes";
import { buildSymbolicVector, cosineSimilarity } from "./webLcmConceptVectorEngine";

function inferRelation(a: AetherConcept, b: AetherConcept): { type: WebLcmRelationType; weight: number; explanation: string } {
  if (a.conceptType === "ERROR_CONCEPT" && b.conceptType === "PATCH_CONCEPT") return { type: "CAUSES", weight: 0.9, explanation: "错误概念驱动补丁概念。" };
  if (a.conceptType === "INTENT_CONCEPT" && b.conceptType === "APP_CONCEPT") return { type: "PRODUCES", weight: 0.8, explanation: "意图产生应用概念。" };
  if (a.conceptType === "WORLD_CONCEPT" && b.conceptType === "NARRATIVE_CONCEPT") return { type: "PRODUCES", weight: 0.7, explanation: "世界孕育剧情。" };
  if (a.conceptType === "CALCULUS_CONCEPT" || b.conceptType === "CALCULUS_CONCEPT") return { type: "GOVERNED_BY", weight: 0.6, explanation: "受计算法约束。" };
  if (a.conceptType === "CONSTANT_CONCEPT" || b.conceptType === "CONSTANT_CONCEPT") return { type: "GOVERNED_BY", weight: 0.6, explanation: "受常数约束。" };
  return { type: "SIMILAR_TO", weight: 0.4, explanation: "概念相似关联。" };
}

export function buildConceptGraph(concepts: AetherConcept[], domain = "GENERAL"): AetherConceptGraph {
  const nodes: AetherConceptNode[] = concepts.map(c => ({
    nodeId: newId("node"),
    conceptId: c.conceptId,
    label: c.title,
    conceptType: c.conceptType,
    weight: c.confidence,
  }));
  const edges: AetherConceptEdge[] = [];
  for (let i = 0; i < concepts.length; i++) {
    for (let j = i + 1; j < concepts.length; j++) {
      const va = concepts[i].semanticVector ?? buildSymbolicVector(concepts[i]);
      const vb = concepts[j].semanticVector ?? buildSymbolicVector(concepts[j]);
      const sim = cosineSimilarity(va, vb);
      if (sim < 0.15) continue;
      const rel = inferRelation(concepts[i], concepts[j]);
      edges.push({
        edgeId: newId("edge"),
        fromNodeId: nodes[i].nodeId,
        toNodeId: nodes[j].nodeId,
        relationType: rel.type,
        weight: +(rel.weight * (0.6 + sim * 0.4)).toFixed(3),
        explanation: rel.explanation,
      });
    }
  }
  return {
    graphId: newId("graph"),
    title: `${domain} 概念图谱`,
    nodes,
    edges,
    domain,
    graphSummary: `${nodes.length} 个概念节点，${edges.length} 条概念关系。`,
    qaStatus: "PENDING",
  };
}
