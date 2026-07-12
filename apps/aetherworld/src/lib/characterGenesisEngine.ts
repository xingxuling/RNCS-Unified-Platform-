// 角色生成引擎
import type { VirtualWorldSeedResult } from "./virtualWorldSeedCompiler";
import { CHARACTER_CLASSES, pickCharacterClass, type CharacterClass } from "@/constants/characterClasses";

export interface GeneratedCharacter {
  characterName: string;
  className: string;
  classId: string;
  archetype: string;
  roleInWorld: string;
  primaryAttribute: string;
  secondaryAttribute: string;
  hiddenTalent: string;
  weakness: string;
  growthPath: string;
  startingZone: string;
  mainQuestBias: string;
  relationshipBias: string;
  riskPattern: string;
}

export function generateCharacter(seed: VirtualWorldSeedResult, subjectName?: string): GeneratedCharacter {
  const cls: CharacterClass = pickCharacterClass(seed.dominantNumber, seed.dominantDomain);
  const second = CHARACTER_CLASSES.find(c => c.id !== cls.id && c.primaryNumbers.includes(seed.dominantNumber)) ?? CHARACTER_CLASSES[1];

  return {
    characterName: subjectName ? `${subjectName} · ${cls.name}` : `${cls.name} #${seed.seedSignature.slice(0, 4)}`,
    className: cls.name,
    classId: cls.id,
    archetype: cls.enName,
    roleInWorld: `${cls.description}`,
    primaryAttribute: `主域：${seed.dominantDomain}（${cls.primaryNumbers.join("/")}）`,
    secondaryAttribute: `副域：${second.name}`,
    hiddenTalent: seed.missingNumbers.length
      ? `通过补足缺失数 ${seed.missingNumbers.join("·")} 觉醒隐藏能力`
      : "天赋已较为均衡",
    weakness: cls.weakness,
    growthPath: cls.growthPath,
    startingZone: cls.startingZone,
    mainQuestBias: `主线偏向：${cls.startingZone} / ${seed.dominantDomain}`,
    relationshipBias: `关系偏向：${seed.weakDomain === "ren" ? "需要主动建立人脉" : "关系结构相对稳定"}`,
    riskPattern: cls.weakness,
  };
}
