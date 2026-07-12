import type { WebLcmConceptType } from "@/constants/weblcm/webLcmConceptTypes";
import type { WebLcmConceptSource } from "@/constants/weblcm/webLcmConceptSources";
import type { WebLcmRelationType } from "@/constants/weblcm/webLcmGraphRelationTypes";

export type SymbolicVectorType = "SYMBOLIC_HASH" | "KEYWORD_TF" | "TAG_VECTOR" | "REAL_EMBEDDING";

export interface SymbolicVector {
  vectorType: SymbolicVectorType;
  dimensions: number;
  values: number[];
}

export type AbstractionLevel = "LOW" | "MEDIUM" | "HIGH" | "META";

export interface AetherConcept {
  conceptId: string;
  title: string;
  conceptType: WebLcmConceptType;
  sourceType: WebLcmConceptSource;
  sourceObjectId?: string;
  sourceText?: string;
  summary: string;
  keywords: string[];
  semanticVector?: SymbolicVector;
  language?: string;
  abstractionLevel: AbstractionLevel;
  domainTags: string[];
  calculusTags: string[];
  constantTags: string[];
  worldTags: string[];
  personalityBiasTags: string[];
  confidence: number;
  safetyNotes: string[];
  createdAt: string;
}

export interface AetherConceptChain {
  chainId: string;
  title: string;
  sourceConceptIds: string[];
  orderedConcepts: AetherConcept[];
  chainType: string;
  predictedNextConcepts: AetherConcept[];
  compressionSummary: string;
  expansionPrompt?: string;
  qaStatus: string;
  createdAt: string;
}

export interface AetherConceptNode {
  nodeId: string;
  conceptId: string;
  label: string;
  conceptType: WebLcmConceptType;
  weight: number;
}

export interface AetherConceptEdge {
  edgeId: string;
  fromNodeId: string;
  toNodeId: string;
  relationType: WebLcmRelationType;
  weight: number;
  explanation: string;
}

export interface AetherConceptGraph {
  graphId: string;
  title: string;
  nodes: AetherConceptNode[];
  edges: AetherConceptEdge[];
  domain: string;
  graphSummary: string;
  qaStatus: string;
}

export interface ConceptPrediction {
  predictionId: string;
  chainId: string;
  predictedConcepts: AetherConcept[];
  predictionReason: string;
  confidence: number;
  riskNotes: string[];
}

export interface ConceptCompressionResult {
  compressionId: string;
  sourceObjectId: string;
  coreConcepts: AetherConcept[];
  compressionSummary: string;
  lostDetails: string[];
  riskNotes: string[];
}

export interface ConceptExpansionPlan {
  expansionId: string;
  sourceChainId: string;
  targetEngine: string;
  expansionPrompt: string;
  requiredObjects: string[];
  outputContract: string[];
  safetyRules: string[];
}

export interface ConceptSearchResult {
  query: string;
  results: AetherConcept[];
  matchedBy: "KEYWORD" | "TAG" | "VECTOR" | "GRAPH" | "HYBRID";
  confidence: number;
}

export interface ObjectConceptBinding {
  bindingId: string;
  objectId: string;
  conceptIds: string[];
  primaryConceptId: string;
  bindingType: "EXTRACTED_FROM" | "SUMMARIZES" | "DRIVES" | "GENERATES" | "GOVERNS";
  createdAt: string;
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
