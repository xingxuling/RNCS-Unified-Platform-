// 任务生成引擎
import type { WorldZone } from "./worldMapGenerationEngine";
import type { VirtualWorldSeedResult } from "./virtualWorldSeedCompiler";
import { QUEST_TYPES, type QuestStage } from "@/constants/questTypes";

export interface GeneratedQuest {
  id: string;
  title: string;
  questType: string;
  questTypeId: string;
  sourceEventId: string;
  dimensionId: string;
  stage: QuestStage;
  difficulty: number;
  urgency: number;
  rewardType: string;
  description: string;
  objective: string;
  recommendedAction: string;
  validationMethod: string;
  failureRisk: string;
}

const STAGE_CYCLE: QuestStage[] = ["SEED", "FORMING", "TRIGGERED", "ESCALATING", "CONFIRMING", "PEAKING"];

export function generateQuests(zones: WorldZone[], seed: VirtualWorldSeedResult): GeneratedQuest[] {
  const out: GeneratedQuest[] = [];
  zones.forEach((zone, zi) => {
    // 每个开放/形成中区域产出 1-2 个任务
    if (zone.state === "LOCKED" || zone.state === "HIDDEN") return;
    const count = zone.state === "OPEN" ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const typeIdx = (zi + i + seed.dominantNumber) % QUEST_TYPES.length;
      const qt = QUEST_TYPES[typeIdx];
      const stage = STAGE_CYCLE[(zi + i) % STAGE_CYCLE.length];
      const q: GeneratedQuest = {
        id: `quest-${zone.dimensionId}-${i}`,
        title: `${zone.zoneName} · ${qt.name}`,
        questType: qt.name,
        questTypeId: qt.id,
        sourceEventId: `evt-${zone.dimensionId}-${i}`,
        dimensionId: zone.dimensionId,
        stage,
        difficulty: qt.baseDifficulty + (i % 2),
        urgency: qt.baseUrgency,
        rewardType: zone.state === "DANGEROUS" ? "经验+风险标记" : "经验+稳定度",
        description: `${qt.description} 当前所在区域：${zone.zoneName}。`,
        objective: `在「${zone.zoneName}」完成 ${qt.name} 的当前阶段（${stage}）。`,
        recommendedAction: zone.recommendedActions[0] ?? "小步推进",
        validationMethod: "完成后在记录中心写回验。",
        failureRisk: zone.state === "DANGEROUS" ? "可能加剧乱流" : "可能错过窗口",
      };
      zone.currentQuestIds.push(q.id);
      out.push(q);
    }
  });
  return out;
}
