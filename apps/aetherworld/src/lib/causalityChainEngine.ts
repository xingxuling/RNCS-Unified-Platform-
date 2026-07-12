// 因果链引擎
import type { GeneratedQuest } from "./questGenerationEngine";
import type { WorldZone } from "./worldMapGenerationEngine";
import type { GeneratedNPC } from "./npcRelationshipEngine";

export interface CausalityChain {
  id: string;
  cause: string;
  intermediateFactors: string[];
  effect: string;
  affectedZones: string[];
  affectedNPCs: string[];
  affectedQuests: string[];
  confidence: number;
  explanation: string;
}

export function generateCausalityChains(
  zones: WorldZone[], quests: GeneratedQuest[], npcs: GeneratedNPC[],
): CausalityChain[] {
  const out: CausalityChain[] = [];
  // 取前 3 个开放区域，生成示例因果链
  const openZones = zones.filter(z => z.state === "OPEN").slice(0, 3);
  openZones.forEach((zone, i) => {
    const relQuests = quests.filter(q => q.dimensionId === zone.dimensionId).map(q => q.id);
    const relNpcs = npcs.filter(n => n.relatedDimension === zone.dimensionId).map(n => n.id);
    out.push({
      id: `chain-${zone.dimensionId}`,
      cause: `你在 ${zone.zoneName} 推进了任务`,
      intermediateFactors: ["回验数据上升", "区域稳定度+1", "NPC 信任值+5"],
      effect: `${zone.zoneName} 解锁下一阶段任务`,
      affectedZones: [zone.id],
      affectedNPCs: relNpcs.slice(0, 2),
      affectedQuests: relQuests,
      confidence: 60 + i * 5,
      explanation: `你做了这件事，所以「${zone.zoneName}」变得更稳定，下一步可以继续推进。`,
    });
  });
  // 风险区因果
  const danger = zones.find(z => z.state === "DANGEROUS");
  if (danger) {
    out.push({
      id: `chain-${danger.dimensionId}-risk`,
      cause: `${danger.zoneName} 当前噪声偏高`,
      intermediateFactors: ["伪信号风险", "误读概率上升"],
      effect: "建议先观察，不要做重大决策",
      affectedZones: [danger.id],
      affectedNPCs: [],
      affectedQuests: [],
      confidence: 55,
      explanation: "此区域目前不稳定，行动需要更小的步幅。",
    });
  }
  return out;
}
