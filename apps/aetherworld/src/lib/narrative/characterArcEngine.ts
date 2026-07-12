import { CHARACTER_ARC_TYPES, type CharacterArcTypeId } from "@/constants/narrative/characterArcTypes";

export interface CharacterArc {
  characterName: string;
  arcType: CharacterArcTypeId;
  currentState: string;
  desire: string;
  fear: string;
  contradiction: string;
  mask: string;
  wound: string;
  growthDirection: string;
  forbiddenBreaks: string[];
}

export function buildCharacterArc(input: {
  characterName: string;
  arcType?: CharacterArcTypeId;
  currentState?: string;
}): CharacterArc {
  const arcType = (input.arcType ?? "MYTHIC_TO_HUMAN") as CharacterArcTypeId;
  const isBlueSky = /蓝天机|blue\s*sky/i.test(input.characterName);
  if (isBlueSky) {
    return {
      characterName: input.characterName,
      arcType: "MYTHIC_TO_HUMAN",
      currentState: input.currentState ?? "承担文明裁决者身份，但仍想保留人的迟疑",
      desire: "保住可以像普通人一样迟疑的瞬间",
      fear: "彻底变成不再迟疑的系统",
      contradiction: "必须裁决，又不愿成为裁决本身",
      mask: "冷静、克制、判断力强",
      wound: "曾因迟疑而失去过一些不可挽回的事",
      growthDirection: "在保持职责的同时，重新承认自己的人类部分",
      forbiddenBreaks: ["写成单纯龙傲天", "写成无代价神明", "失去责任疲惫感"],
    };
  }
  return {
    characterName: input.characterName,
    arcType,
    currentState: input.currentState ?? "处在转折前的稳定态",
    desire: "得到某种结构性回应",
    fear: "被迫放弃自我定义",
    contradiction: "想行动又害怕代价",
    mask: "理性 / 礼貌 / 距离感",
    wound: "曾经被否认过的核心",
    growthDirection: CHARACTER_ARC_TYPES.find(a => a.id === arcType)?.name ?? "成长",
    forbiddenBreaks: ["性格突变", "无代价跃升"],
  };
}
