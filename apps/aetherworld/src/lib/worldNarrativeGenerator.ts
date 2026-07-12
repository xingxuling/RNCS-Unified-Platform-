// 世界叙事报告生成
import { getNarrativeStyle } from "@/constants/worldNarrativeStyles";
import type { WorldArchetype } from "@/constants/worldArchetypes";
import type { UserRole } from "./worldArchetypeResolver";
import type { WorldZone } from "./worldEventMapGenerator";

export interface NarrativeInput {
  worldName: string;
  archetype: WorldArchetype;
  userRole: UserRole;
  zones: WorldZone[];
  styleId: string;
  dominantNumber: number;
}

export function generateNarrative(input: NarrativeInput): string {
  const style = getNarrativeStyle(input.styleId);
  const openZones = input.zones.filter(z => z.state === "OPEN").slice(0, 3);
  const lockedZones = input.zones.filter(z => z.state === "LOCKED" || z.state === "HIDDEN").slice(0, 2);
  const risky = input.zones.find(z => z.state === "OVERLOADED");

  const openLine = openZones.length
    ? `当前对你开放的区域包括：${openZones.map(z => z.zoneName).join("、")}。`
    : `当前开放区域较少，更适合先观察。`;
  const lockedLine = lockedZones.length
    ? `这些区域暂未开启：${lockedZones.map(z => z.zoneName).join("、")}，不强求触发。`
    : "";
  const riskLine = risky ? `要注意「${risky.zoneName}」可能出现过载。` : "";

  switch (style.id) {
    case "poetic":
      return `${input.worldName}如同一片${input.archetype.visualMood}。你是其中的${input.userRole.userFriendlyName}。${openLine}${lockedLine}${riskLine} 行动法则：${input.archetype.actionStyle}`;
    case "pragmatic":
      return `你的世界类型：${input.archetype.userFriendlyName}。角色：${input.userRole.userFriendlyName}。${openLine}${riskLine} 最优行动：${input.archetype.actionStyle} 风险：${input.archetype.riskPattern}`;
    case "technical":
      return `[${input.worldName}] archetype=${input.archetype.id} role=${input.userRole.id} dominantNumber=${input.dominantNumber} openZones=${openZones.length} lockedZones=${lockedZones.length} risk=${risky ? "OVERLOAD" : "NONE"} action="${input.archetype.actionStyle}"`;
    case "balanced":
      return `${input.worldName}：${input.archetype.description}你在其中扮演${input.userRole.userFriendlyName}。${openLine}${lockedLine}${riskLine}建议行动方式：${input.archetype.actionStyle}`;
    default: // friendly
      return `你的世界更像一个${input.archetype.userFriendlyName}。${input.archetype.description}你是其中的${input.userRole.userFriendlyName}——${input.userRole.description}${openLine}${lockedLine}${riskLine}最适合你的行动方式是：${input.archetype.actionStyle}下一步建议：${input.userRole.actionAdvice}`;
  }
}
