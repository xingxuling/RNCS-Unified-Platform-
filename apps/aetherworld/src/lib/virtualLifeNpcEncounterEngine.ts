// 虚拟 NPC 遭遇引擎
export const NPC_ARCHETYPES = [
  "Mentor", "Ally", "Rival", "Lover", "Gatekeeper", "Trader",
  "Messenger", "Observer", "Mirror", "System Agent", "Founder Echo", "Mythic Guide",
] as const;
export type NpcArchetype = typeof NPC_ARCHETYPES[number];

export interface VirtualNpcEncounter {
  npcName: string;
  archetype: NpcArchetype;
  encounterScene: string;
  message: string;
  relatedRealQuestion?: string;
  recommendedResponse: string;
  safetyNote: string;
}

const NAME_LIB: Record<NpcArchetype, string[]> = {
  Mentor:          ["灯塔守者", "老灰袍", "晨钟使"],
  Ally:            ["影行者",   "同道墨"],
  Rival:           ["逆风者",   "镜中影"],
  Lover:           ["远月音"],
  Gatekeeper:      ["系统守门人", "门轴老者"],
  Trader:          ["盐路商人"],
  Messenger:       ["风之邮人"],
  Observer:        ["静观史官"],
  Mirror:          ["镜面自我"],
  "System Agent":  ["系统代理 · A"],
  "Founder Echo":  ["创始人回声"],
  "Mythic Guide":  ["原型向导"],
};

const SCENES: string[] = [
  "你在桥头遇到Ta。",
  "Ta在工坊门口等你。",
  "在静林边缘的灯下。",
  "归档大厅的回廊里。",
  "城塞的主门附近。",
];

const MESSAGES: Partial<Record<NpcArchetype, string[]>> = {
  Mentor:          ["不是更多，是更小。", "先校准方向再加速。"],
  Gatekeeper:      ["不是继续创造世界，而是先修门。", "入口没挂上之前，别再开新厅。"],
  Observer:        ["你昨天的反馈还没记。", "别让今天又少一条回声。"],
  Mirror:          ["你急的是哪一部分？", "如果只能做一件事，是哪一件？"],
  "System Agent":  ["有一项检查未通过，可去 QA 看一眼。", "Recalculation 有 stale 标记等待处理。"],
  "Founder Echo":  ["不要离开真实用户的回路。", "权限矩阵需要你过一遍。"],
  "Mythic Guide":  ["你扮演的角色今天偏向静观。", "今天适合归档，而不是出征。"],
};

export interface NpcEncounterInput {
  seed: string;
  lifeMode: string;
  founderActive?: boolean;
  realityIssue?: string;
}

export function generateNpcEncounter(input: NpcEncounterInput): VirtualNpcEncounter | undefined {
  let h = 0;
  for (let i = 0; i < input.seed.length; i++) h = ((h << 5) - h + input.seed.charCodeAt(i)) | 0;
  const hash = Math.abs(h);
  // 大约 70% 概率出现
  if (hash % 10 < 3) return undefined;

  let archetypes: NpcArchetype[] = [...NPC_ARCHETYPES];
  if (!input.founderActive) archetypes = archetypes.filter(a => a !== "Founder Echo");
  if (input.lifeMode === "FOUNDER_LIFE") archetypes = ["Founder Echo", "System Agent", "Gatekeeper"];
  if (input.lifeMode === "CREATOR_LIFE") archetypes = ["Mythic Guide", "Mirror", "Mentor"];
  if (input.lifeMode === "RECOVERY_LIFE") archetypes = ["Observer", "Mentor", "Mirror"];

  const arche = archetypes[hash % archetypes.length];
  const names = NAME_LIB[arche];
  const npcName = names[(hash >> 3) % names.length];
  const scene = SCENES[(hash >> 5) % SCENES.length];
  const msgPool = MESSAGES[arche] ?? ["保持一个最小行动。"];
  const message = msgPool[(hash >> 7) % msgPool.length];

  return {
    npcName,
    archetype: arche,
    encounterScene: scene,
    message,
    relatedRealQuestion: input.realityIssue,
    recommendedResponse: input.realityIssue
      ? "把这个问题写成一条现实最小行动或 Lovable 修复提示词。"
      : "把这条信号当成今天的一个小提醒，落地为一个具体动作。",
    safetyNote: "NPC 不代表现实具体人物，仅为内在原型/系统信号。",
  };
}
