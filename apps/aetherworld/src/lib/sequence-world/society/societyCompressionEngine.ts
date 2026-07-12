// Society Compression Engine
import type { NpcAgent } from "./npcAgentCore";
import type { WorldFaction } from "./factionEngine";
import type { WorldInstitution } from "./institutionEngine";
import type { SocialConflict } from "./socialConflictEngine";
import type { CivilizationPhaseState } from "./civilizationPhaseEngine";

export const SOCIETY_COMPRESSION_TARGETS = [
  "SOCIAL_SUMMARY","FACTION_MAP","NPC_CAST_LIST","POLITICAL_BIBLE",
  "ECONOMY_REPORT","CIVILIZATION_CHRONICLE","GAME_SOCIAL_RUNTIME","NARRATIVE_SOCIAL_BIBLE",
] as const;
export type SocietyCompressionTarget = typeof SOCIETY_COMPRESSION_TARGETS[number];

export interface SocietyCompressionResult {
  compressionTarget: SocietyCompressionTarget;
  summary: string;
  keptAgents: string[];
  keptFactions: string[];
  archivedDetails: string[];
  recommendedUse: string;
}

export function compressSociety(input: {
  target: SocietyCompressionTarget;
  agents: NpcAgent[];
  factions: WorldFaction[];
  institutions: WorldInstitution[];
  conflicts: SocialConflict[];
  civilization: CivilizationPhaseState;
}): SocietyCompressionResult {
  const keptAgents = input.agents.slice(0, 8).map(a => a.agentId);
  const keptFactions = input.factions.slice(0, 6).map(f => f.factionId);
  const archived: string[] = [];
  if (input.agents.length > 8) archived.push(`${input.agents.length - 8} 个次要 NPC 已归档`);
  if (input.factions.length > 6) archived.push(`${input.factions.length - 6} 个次要阵营已归档`);

  let summary = "";
  let use = "";
  switch (input.target) {
    case "SOCIAL_SUMMARY":
      summary = `${input.civilization.phaseLabel}｜NPC ${input.agents.length}｜阵营 ${input.factions.length}｜活动冲突 ${input.conflicts.length}`;
      use = "用户概览展示"; break;
    case "FACTION_MAP":
      summary = `阵营图：${input.factions.map(f => f.name).join(" | ")}`;
      use = "阵营势力可视化"; break;
    case "NPC_CAST_LIST":
      summary = input.agents.slice(0, 8).map(a => `${a.name}（${a.socialRole}）`).join("｜");
      use = "剧情角色表"; break;
    case "POLITICAL_BIBLE":
      summary = `政治制度共 ${input.institutions.length} 个｜${input.institutions.map(i => i.name).join("、")}`;
      use = "设定集 / 系统手册"; break;
    case "ECONOMY_REPORT":
      summary = "经济报告：见 World Economy 面板";
      use = "经济视角剧情"; break;
    case "CIVILIZATION_CHRONICLE":
      summary = `${input.civilization.phaseLabel}｜稳定 ${(input.civilization.stability*100).toFixed(0)}%｜复杂度 ${(input.civilization.complexity*100).toFixed(0)}%`;
      use = "文明编年史"; break;
    case "GAME_SOCIAL_RUNTIME":
      summary = `运行时社会数据：${input.agents.length} agents / ${input.factions.length} factions`;
      use = "Godot / Unity 接入"; break;
    case "NARRATIVE_SOCIAL_BIBLE":
      summary = `剧情社会圣经，含 ${input.factions.length} 阵营、${input.institutions.length} 制度`;
      use = "Narrative Engine 接入"; break;
  }
  return { compressionTarget: input.target, summary, keptAgents, keptFactions, archivedDetails: archived, recommendedUse: use };
}
