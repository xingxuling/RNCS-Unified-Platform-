// 虚拟生活计算法 · 主编排
import { generateVirtualDay, type VirtualDayInput, type VirtualDayResult } from "./virtualDayGenerator";
import { getSafetyNote } from "./virtualLifeSafetyGuard";

export interface VirtualLifeContext {
  subjectId: string;
  worldId: string;
  lifeMode: string;
  founderActive?: boolean;
  recentRealActions?: string[];
  realityIssue?: string;
  escapismRisk?: number;
}

export interface VirtualLifeReport {
  day: VirtualDayResult;
  safetyNote: string;
  lovablePrompt: string;
  markdown: string;
}

export function runVirtualLife(ctx: VirtualLifeContext, date: Date = new Date()): VirtualLifeReport {
  const input: VirtualDayInput = {
    subjectId: ctx.subjectId,
    worldId: ctx.worldId,
    lifeMode: ctx.lifeMode,
    currentDate: date.toISOString(),
    recentRealActions: ctx.recentRealActions,
    realityIssue: ctx.realityIssue,
    founderActive: ctx.founderActive,
    escapismRisk: ctx.escapismRisk,
  };
  const day = generateVirtualDay(input);
  return {
    day,
    safetyNote: getSafetyNote(),
    lovablePrompt: buildLovablePrompt(day),
    markdown: buildMarkdown(day),
  };
}

export function buildMarkdown(d: VirtualDayResult): string {
  const sides = d.sideQuests.map(q => `- ${q.title}（${q.questTypeName}）· 现实：${q.realWorldAction}`).join("\n");
  const npc = d.npcEncounter
    ? `\n## NPC 遭遇\n- ${d.npcEncounter.npcName}（${d.npcEncounter.archetype}）\n- 场景：${d.npcEncounter.encounterScene}\n- 信息：${d.npcEncounter.message}\n- 建议回应：${d.npcEncounter.recommendedResponse}\n- 说明：${d.npcEncounter.safetyNote}`
    : "";
  return `# ${d.dayTitle}

模式：${d.lifeModeName}　·　节律：${d.rhythm.name}　·　状态：${d.currentLifeState.name}
醒来：${d.wakeUpLocation}　·　主区域：${d.mainZone}　·　天气：${d.weatherMood}

主题：${d.dailyTheme}

## 主任务
- ${d.mainQuest.title}（${d.mainQuest.questTypeName}）
- 虚拟：${d.mainQuest.virtualDescription}
- 现实：${d.mainQuest.realWorldAction}
- 验证：${d.mainQuest.validationMethod}

## 支线任务
${sides}
${npc}

## 现实锚点
- ${d.realityAnchor.anchorText}
- 为什么重要：${d.realityAnchor.whyItMatters}

## 晚间反思
${d.eveningReflectionPrompt}

---
${d.safetyNote}
`;
}

export function buildLovablePrompt(d: VirtualDayResult): string {
  return `# Virtual Life Prompt · ${d.dayTitle}

Life Mode: ${d.lifeModeName}
State: ${d.currentLifeState.name}
Zone: ${d.mainZone}

## Main Quest
${d.mainQuest.title} → ${d.mainQuest.realWorldAction}

## Side Quests
${d.sideQuests.map(q => `- ${q.title} → ${q.realWorldAction}`).join("\n")}

## Reality Anchor
${d.realityAnchor.anchorText}

## Safety
${d.safetyNote}
`;
}
