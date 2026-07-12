// Civilization Runtime Export Engine
import type { CivilizationEvolutionResult } from "./civilizationEvolutionEngine";

export type CivilizationExportTarget =
  | "GENERIC_JSON" | "GODOT_CIVILIZATION_RUNTIME_JSON" | "UNITY_CIVILIZATION_RUNTIME_JSON"
  | "CHRONICLE_MARKDOWN" | "NARRATIVE_BIBLE" | "WORLD_KNOWLEDGE_PACK"
  | "FACTION_HISTORY_JSON" | "TECHNOLOGY_TREE_JSON" | "HISTORICAL_TIMELINE_JSON";

export interface CivilizationRuntimePackage {
  metadata: {
    version: string;
    exportedAt: string;
    source: "Aether Sequence World Engine v0.5";
    subjectMode: string;
    privacyNotes: string[];
    target: CivilizationExportTarget;
  };
  payload: unknown;
  safetyNotes: string[];
}

export function exportCivilization(input: {
  target: CivilizationExportTarget;
  evolution: CivilizationEvolutionResult;
  subjectMode: string;
  isFull60?: boolean;
}): CivilizationRuntimePackage {
  const e = input.evolution;
  let payload: unknown = e;
  switch (input.target) {
    case "CHRONICLE_MARKDOWN":
      payload = renderChronicleMarkdown(e);
      break;
    case "HISTORICAL_TIMELINE_JSON":
      payload = e.timeline;
      break;
    case "TECHNOLOGY_TREE_JSON":
      payload = e.technologyTree;
      break;
    case "FACTION_HISTORY_JSON":
      payload = { wars: e.warPeaceRecords, lineages: e.institutionLineages };
      break;
    case "NARRATIVE_BIBLE":
      payload = { chronicle: e.chronicle, myths: e.civilizationMyths, figures: e.historicalFigures };
      break;
    case "WORLD_KNOWLEDGE_PACK":
      payload = { chronicle: e.chronicle, eras: [e.currentEra], myths: e.civilizationMyths };
      break;
    case "GODOT_CIVILIZATION_RUNTIME_JSON":
    case "UNITY_CIVILIZATION_RUNTIME_JSON":
      payload = {
        timeline: e.timeline, eras: [e.currentEra],
        technologyTree: e.technologyTree, factions: e.institutionLineages,
        wars: e.warPeaceRecords, myths: e.civilizationMyths,
      };
      break;
    default:
      payload = e;
  }
  const privacy: string[] = [];
  if (input.isFull60) privacy.push("Full60 文明历史默认 USER_PRIVATE，请勿在未授权情况下公开。");
  return {
    metadata: {
      version: "0.5.0",
      exportedAt: new Date().toISOString(),
      source: "Aether Sequence World Engine v0.5",
      subjectMode: input.subjectMode,
      privacyNotes: privacy,
      target: input.target,
    },
    payload,
    safetyNotes: e.safetyNotes,
  };
}

function renderChronicleMarkdown(e: CivilizationEvolutionResult): string {
  const c = e.chronicle;
  const eraLines = c.eras.map((era: { name: string; mood: string; highlights: string[] }) =>
    `- **${era.name}**（${era.mood}）：${era.highlights.join("，") || "（无重大事件）"}`);
  const eventLines = c.majorEvents.slice(0, 12).map((ev: { yearOrTick: string; title: string }) =>
    `- ${ev.yearOrTick} | ${ev.title}`);
  return [
    `# ${c.title}`, ``, c.summary, ``,
    `## 时代`, ...eraLines, ``,
    `## 重大事件`, ...eventLines, ``,
    `## 安全说明`, ...e.safetyNotes.map((s: string) => `> ${s}`),
  ].join("\n");
}
