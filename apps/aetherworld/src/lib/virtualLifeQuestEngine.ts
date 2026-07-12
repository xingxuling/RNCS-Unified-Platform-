// 虚拟生活任务引擎
import { VIRTUAL_LIFE_ACTIVITIES, type VirtualLifeActivity } from "@/constants/virtualLifeActivities";
import { getQuestType } from "@/constants/virtualLifeQuestTypes";
import { getLifeMode } from "@/constants/virtualLifeModes";

export interface VirtualLifeQuest {
  id: string;
  title: string;
  questType: string;
  questTypeName: string;
  virtualDescription: string;
  realWorldAction: string;
  difficulty: number;
  energyCost: number;
  expectedReward: string;
  validationMethod: string;
  riskIfIgnored: string;
}

function activityToQuest(a: VirtualLifeActivity, seedHash: number): VirtualLifeQuest {
  const qt = getQuestType(a.questType);
  return {
    id: `${a.id}-${(seedHash & 0xffff).toString(16)}`,
    title: a.userFriendlyName,
    questType: a.questType,
    questTypeName: qt?.userFriendlyName ?? a.questType,
    virtualDescription: a.virtualDescription,
    realWorldAction: a.realWorldAction,
    difficulty: qt?.baseDifficulty ?? 2,
    energyCost: a.energyCost,
    expectedReward: "推动一次现实小变化，并产生可回验信号。",
    validationMethod: "完成后记录一条反馈（命中/未命中/部分）。",
    riskIfIgnored: "易堆积、易延误、易脱离现实锚点。",
  };
}

export interface QuestPlanInput {
  lifeMode: string;
  seed: string;
  founderActive?: boolean;
}

export interface QuestPlan {
  mainQuest: VirtualLifeQuest;
  sideQuests: VirtualLifeQuest[];
}

export function planQuests(input: QuestPlanInput): QuestPlan {
  const mode = getLifeMode(input.lifeMode);
  const bias = mode?.questBias ?? ["DAILY_ANCHOR"];

  // hash seed
  let h = 0;
  for (let i = 0; i < input.seed.length; i++) h = ((h << 5) - h + input.seed.charCodeAt(i)) | 0;
  const hash = Math.abs(h);

  // 过滤创始人限定
  let pool = VIRTUAL_LIFE_ACTIVITIES.filter(a => {
    const qt = getQuestType(a.questType);
    if (qt?.founderOnly && !input.founderActive) return false;
    return true;
  });

  // 排序：先匹配偏好的 questType
  const sorted = [...pool].sort((a, b) => {
    const ai = bias.indexOf(a.questType);
    const bi = bias.indexOf(b.questType);
    const an = ai === -1 ? 999 : ai;
    const bn = bi === -1 ? 999 : bi;
    return an - bn;
  });

  // 主任务：偏好首位附近，加 hash 抖动
  const mainIdx = hash % Math.min(3, sorted.length);
  const main = sorted[mainIdx];

  // 必带一个 DAILY_ANCHOR
  const anchor = sorted.find(a => a.questType === "DAILY_ANCHOR" && a.id !== main.id);

  // 支线：从剩余里挑 2 个 + anchor
  const rest = sorted.filter(a => a.id !== main.id && a.id !== anchor?.id);
  const side1 = rest[(hash >> 3) % rest.length];
  const side2 = rest[(hash >> 6) % rest.length];

  const sides = [anchor, side1, side2].filter(Boolean) as VirtualLifeActivity[];
  // 去重
  const seen = new Set<string>();
  const dedupSides = sides.filter(s => (seen.has(s.id) ? false : (seen.add(s.id), true)));

  return {
    mainQuest: activityToQuest(main, hash),
    sideQuests: dedupSides.map((s, i) => activityToQuest(s, hash + i * 7)),
  };
}
