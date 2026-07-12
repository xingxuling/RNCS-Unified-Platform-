// Society Runtime Export Engine
import type { WorldAgentSocietyResult } from "./worldAgentSocietyEngine";

export const SOCIETY_EXPORT_TARGETS = [
  "GENERIC_JSON","GODOT_SOCIAL_RUNTIME_JSON","UNITY_SOCIAL_RUNTIME_JSON",
  "GODOT_GDSCRIPT_SOCIAL_SKELETON","UNITY_CSHARP_SOCIAL_SKELETON",
  "NARRATIVE_SOCIAL_BIBLE","WORLD_KNOWLEDGE_PACK","FACTION_GRAPH_JSON",
] as const;
export type SocietyExportTarget = typeof SOCIETY_EXPORT_TARGETS[number];

export interface SocietyRuntimePackage {
  metadata: {
    version: string;
    exportedAt: string;
    source: "Aether Sequence World Engine v0.4";
    subjectMode: string;
    target: SocietyExportTarget;
    privacyNotes: string[];
  };
  payload: unknown;
}

export function exportSocietyRuntime(input: {
  target: SocietyExportTarget;
  society: WorldAgentSocietyResult;
  subjectMode?: string;
  isFull60?: boolean;
}): SocietyRuntimePackage {
  const privacy: string[] = [];
  if (input.isFull60) {
    privacy.push("Full60 世界社会默认 USER_PRIVATE，本次导出仅在用户本地。");
  }
  let payload: unknown = input.society;
  if (input.target === "FACTION_GRAPH_JSON") {
    payload = { factions: input.society.factions, edges: input.society.socialGraph.edges.filter(e => e.relationType === "ALLY" || e.relationType === "RIVAL") };
  } else if (input.target === "NARRATIVE_SOCIAL_BIBLE") {
    payload = {
      civilization: input.society.civilizationPhase,
      factions: input.society.factions.map(f => ({ name: f.name, ideology: f.ideology, goal: f.primaryGoal })),
      beliefs: input.society.beliefSystems.map(b => ({ name: b.name, coreMyth: b.coreMyth })),
      cast: input.society.npcAgents.map(a => ({ name: a.name, role: a.socialRole })),
    };
  } else if (input.target === "GODOT_GDSCRIPT_SOCIAL_SKELETON") {
    payload = `extends Node\n\n# Aether Society Skeleton (Godot)\nvar factions = ${JSON.stringify(input.society.factions.map(f => f.name))}\nvar agents = ${JSON.stringify(input.society.npcAgents.map(a => a.name))}\n`;
  } else if (input.target === "UNITY_CSHARP_SOCIAL_SKELETON") {
    payload = `// Aether Society Skeleton (Unity)\npublic class AetherSocietySkeleton {\n  public string[] Factions = new[]{${input.society.factions.map(f => `"${f.name}"`).join(",")}};\n  public string[] Agents = new[]{${input.society.npcAgents.map(a => `"${a.name}"`).join(",")}};\n}`;
  }
  return {
    metadata: {
      version: "0.4.0",
      exportedAt: new Date().toISOString(),
      source: "Aether Sequence World Engine v0.4",
      subjectMode: input.subjectMode ?? "DEMO",
      target: input.target,
      privacyNotes: privacy,
    },
    payload,
  };
}
