// 融合运行时 → 数列货币计量元数据封装（被 Chat Bridge 复用）。
// 不重复调用 recordContribution；只生成扩展描述供主 Bridge 使用。
import type { FusionRuntimeInfo } from "@/lib/fusion/fusionTypes";

export interface FusionCurrencyMetadata {
  chainId: string;
  chainSteps: string[];
  dominantDomain: string;
  engineIntent: string;
  engineCount: number;
  conceptNodeCount: number;
  appliedConstantGroups: string[];
  driftSeverity: string;
}

export function buildFusionCurrencyMetadata(info: FusionRuntimeInfo): FusionCurrencyMetadata {
  return {
    chainId: info.chain.chainId,
    chainSteps: info.chain.steps.map((s) => s.calculusId),
    dominantDomain: info.fiveDomain.dominantDomain,
    engineIntent: info.engineProfile.intentType,
    engineCount: info.engineProfile.activeEngines.length,
    conceptNodeCount: info.conceptGraph.nodes.length,
    appliedConstantGroups: info.appliedConstantGroups,
    driftSeverity: info.drift?.severity ?? "NONE",
  };
}
