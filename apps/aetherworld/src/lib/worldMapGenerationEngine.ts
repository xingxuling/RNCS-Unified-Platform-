// 世界地图生成引擎
import type { VirtualWorldSeedResult } from "./virtualWorldSeedCompiler";
import { ZONE_TEMPLATES, type ZoneState } from "@/constants/worldMapZones";

export interface WorldZone {
  id: string;
  zoneName: string;
  enName: string;
  dimensionId: string;
  state: ZoneState;
  level: number;
  description: string;
  currentQuestIds: string[];
  relatedNPCIds: string[];
  riskSignals: string[];
  recommendedActions: string[];
}

const DOMAIN_DIM_BOOST: Record<string, string[]> = {
  tian: ["CAREER", "IDENTITY_MAINLINE"],
  di: ["FINANCE_RESOURCE", "PRODUCT_STARTUP", "HEALTH_RECOVERY"],
  ren: ["RELATIONSHIP", "SOCIAL_NETWORK"],
  shen: ["COGNITION_PLASTICITY", "SPIRIT_SYMBOLIC_VALUE", "IDENTITY_MAINLINE"],
  feng: ["RISK_CHAOS_NOISE", "CREATION_EXPRESSION", "TOOL_AI_PROMPT"],
};

export function generateWorldMap(seed: VirtualWorldSeedResult): WorldZone[] {
  const boosted = new Set(DOMAIN_DIM_BOOST[seed.dominantDomain] ?? []);
  return ZONE_TEMPLATES.map((tpl, idx) => {
    const isBoosted = boosted.has(tpl.dimensionId);
    const state: ZoneState = isBoosted ? "OPEN" : tpl.defaultState;
    const level = isBoosted ? 3 + (idx % 3) : 1 + (idx % 3);
    return {
      id: `zone-${tpl.dimensionId}`,
      zoneName: tpl.zoneName,
      enName: tpl.enName,
      dimensionId: tpl.dimensionId,
      state,
      level,
      description: tpl.description,
      currentQuestIds: [],
      relatedNPCIds: [],
      riskSignals: state === "DANGEROUS" ? ["噪声偏高", "伪信号风险"] : [],
      recommendedActions: state === "OPEN"
        ? ["小步推进", "记录回验"]
        : state === "LOCKED"
          ? ["走流程", "等待窗口"]
          : ["先观察", "再行动"],
    };
  });
}
