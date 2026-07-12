// 世界叙事编译器
import type { VirtualWorldState } from "./virtualWorldEngine";
import { WORLD_SAFETY_TEXT } from "@/constants/worldSafetyRules";

export interface WorldNarrativeReport {
  title: string;
  subtitle: string;
  openingParagraph: string;
  worldLawsSummary: string;
  characterSummary: string;
  mapSummary: string;
  questSummary: string;
  npcSummary: string;
  riskSummary: string;
  nextAction: string;
  safetyNote: string;
}

export function compileWorldNarrative(state: VirtualWorldState): WorldNarrativeReport {
  const { seed, character, zones, quests, npcs, worldLaws } = state;
  const openZones = zones.filter(z => z.state === "OPEN");
  const dangerZones = zones.filter(z => z.state === "DANGEROUS");
  const mainQuest = quests.find(q => q.questTypeId === "MAIN") ?? quests[0];

  return {
    title: state.worldName,
    subtitle: `${character.className}的世界 · 种子 ${seed.seedSignature}`,
    openingParagraph:
      `你的世界以${zoneStyleDesc(state)}为主调。你在其中更像${character.className}，` +
      `擅长${character.roleInWorld}。当前开放区域是${openZones.slice(0, 3).map(z => z.zoneName).join("、")}，` +
      `这意味着你可以在这些方向上做小步推进。`,
    worldLawsSummary: `本世界由 ${worldLaws.length} 条核心法则驱动，其中最强的是「${worldLaws[0]?.userFriendlyName ?? "时间法则"}」。`,
    characterSummary: `${character.characterName}：${character.primaryAttribute}；${character.secondaryAttribute}。`,
    mapSummary: `地图共 ${zones.length} 个区域，${openZones.length} 个开放，${dangerZones.length} 个危险区。`,
    questSummary: `共生成 ${quests.length} 个任务；当前主线：${mainQuest?.title ?? "未生成"}。`,
    npcSummary: `共生成 ${npcs.length} 个 NPC 关系原型，用于象征性映射人际结构。`,
    riskSummary: dangerZones.length
      ? `当前需要警惕：${dangerZones.map(z => z.zoneName).join("、")}。`
      : "当前未检测到危险区。",
    nextAction: `下一步最适合：${mainQuest?.recommendedAction ?? "完成一个小型任务"}。不建议同时扩张全部世界。`,
    safetyNote: WORLD_SAFETY_TEXT,
  };
}

function zoneStyleDesc(state: VirtualWorldState): string {
  const d = state.seed.dominantDomain;
  return ({ tian: "时间与窗口", di: "资源与结构", ren: "关系与人际",
    shen: "象征与主线", feng: "变化与风" } as Record<string, string>)[d] ?? "复合结构";
}
