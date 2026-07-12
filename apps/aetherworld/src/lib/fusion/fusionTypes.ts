// Fusion 层共享类型
import type { FiveDomainId } from "@/constants/fusion/fiveDomainConstants";
import type { EngineWeightProfile, EngineWeightItem } from "@/constants/engine/engineWeightConstants";
import type { CalculusId, ConstantsDriftReport } from "@/lib/chat/calculusRouteResultTypes";

export interface FiveDomainCoordinate {
  domain: FiveDomainId;
  label: string;
  /** 0~1，命中权重 */
  weight: number;
  /** 模型可读的本域解释 */
  interpretation: string;
}

export interface FiveDomainCoordinateMap {
  coordinates: FiveDomainCoordinate[];
  /** 主导域 */
  dominantDomain: FiveDomainId;
  /** 一行摘要 */
  summary: string;
}

export type ConceptNodeType =
  | "OBJECT" | "ACTION" | "DOMAIN" | "ROLE" | "RISK" | "TIME" | "VALUE" | "TOOL" | "OUTPUT";

export interface ConceptNode {
  id: string;
  label: string;
  type: ConceptNodeType;
  weight: number;
}

export interface ConceptEdge {
  from: string;
  to: string;
  relation: string;
  weight: number;
}

export interface WebLcmConceptGraph {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
  summary: string;
  confidence: number;
}

export type ChainMode = "SERIAL" | "PARALLEL" | "ORTHOGONAL";

export interface CalculusChainStep {
  calculusId: CalculusId;
  mode: ChainMode;
  note?: string;
}

export interface CrossDomainCalculusChain {
  chainId: string;
  templateId?: string;
  steps: CalculusChainStep[];
  orthogonalInjections: string[]; // 常数宇宙 / 五域 / WebLCM / 数列指纹
  reason: string;
}

export interface EngineWeightSummary {
  intentType: string;
  chineseName: string;
  activeEngines: EngineWeightItem[];
  primaryTop: EngineWeightItem[];
  safetyWeight: number;
}

export interface FusionRuntimeInfo {
  fiveDomain: FiveDomainCoordinateMap;
  engineProfile: EngineWeightSummary;
  chain: CrossDomainCalculusChain;
  conceptGraph: WebLcmConceptGraph;
  appliedConstantGroups: string[];
  drift?: ConstantsDriftReport;
}

export type { EngineWeightItem, EngineWeightProfile };
