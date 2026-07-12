// Quest / Event Engine
import type { SequenceCoreProfile } from "./sequenceCoreEngine";
import type { WorldStateProfile } from "./worldStateEngine";
import { DIGIT_QUEST_AFFINITY, QUEST_TYPE_LABEL, type QuestType } from "@/constants/sequence-world/questEventTypes";

export interface QuestEventProfile {
  questTitle: string;
  questType: QuestType;
  questTypeLabel: string;
  virtualDescription: string;
  realWorldMapping?: string;
  triggerCondition: string;
  completionCondition: string;
  rewardType: string;
  riskIfIgnored: string;
  relatedDigits: string[];
}

const REWARD_BY_TYPE: Record<QuestType, string> = {
  WORLD_EXPLORATION:"地图扩展 + 信号纯度提升",
  NPC_INTERACTION:"关系等级 + 信任值",
  SYSTEM_REPAIR:"世界稳定度回升",
  REALITY_ANCHOR:"现实行动反馈分",
  CREATION_TASK:"虚拟造物 + 灵感积分",
  ARCHIVE_TASK:"潜意识素材入库",
  RELATION_TASK:"关系港湾解锁",
  RECOVERY_TASK:"恢复力 + 生命值",
  FOUNDER_TASK:"主线推进 + 权限解锁",
  END_STATE_TASK:"文明终局点数",
};

export function generateQuestEvents(core: SequenceCoreProfile, world: WorldStateProfile, count = 4): QuestEventProfile[] {
  const seen = new Set<QuestType>();
  const quests: QuestEventProfile[] = [];
  for (const d of core.dominantDigits) {
    const candidates = DIGIT_QUEST_AFFINITY[d] ?? [];
    for (const t of candidates) {
      if (seen.has(t)) continue;
      seen.add(t);
      quests.push(buildQuest(t, d, core, world));
      if (quests.length >= count) return quests;
    }
  }
  if (quests.length === 0) quests.push(buildQuest("WORLD_EXPLORATION", "5", core, world));
  return quests;
}

function buildQuest(t: QuestType, digit: string, core: SequenceCoreProfile, world: WorldStateProfile): QuestEventProfile {
  return {
    questTitle: `${QUEST_TYPE_LABEL[t]} · ${core.name}`,
    questType: t,
    questTypeLabel: QUEST_TYPE_LABEL[t],
    virtualDescription: `在【${world.currentPhase}】相位中，由数字 ${digit} 驱动的「${QUEST_TYPE_LABEL[t]}」。`,
    realWorldMapping: t === "REALITY_ANCHOR" ? "落到当下一项可在 20 分钟内完成的小动作" : undefined,
    triggerCondition: `主体进入 ${world.dominantForce} 主导区域，或事件压力 ≥ ${(world.eventPressure * 100).toFixed(0)}%`,
    completionCondition: `完成 1 次显著推进，并在记录中心回验`,
    rewardType: REWARD_BY_TYPE[t],
    riskIfIgnored: world.stability < 0.4 ? "世界稳定度持续下降，可能进入 VOID 相位" : "进度滞后，错过当前窗口",
    relatedDigits: [digit, ...core.dominantDigits.filter(x => x !== digit).slice(0, 2)],
  };
}
