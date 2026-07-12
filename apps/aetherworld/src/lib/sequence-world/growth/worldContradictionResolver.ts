import type { WorldContradictionType, ContradictionSeverity, ContradictionFixStrategy } from "@/constants/sequence-world/growth/worldContradictionTypes";
import { loadCanon, type WorldCanonEntry } from "./worldCanonEngine";

export interface WorldContradiction {
  id: string;
  worldId: string;
  contradictionType: WorldContradictionType;
  severity: ContradictionSeverity;
  affectedIds: string[];
  explanation: string;
  suggestedFix: string;
  fixStrategy: ContradictionFixStrategy;
  autoFixAvailable: boolean;
}

export interface ContradictionScanInput {
  worldId: string;
  canon?: WorldCanonEntry[];
  resourceFlow?: { resources: Record<string, number> };
  realityConfusionFlag?: boolean;
  npcMemoryConflicts?: Array<{ npcId: string; conflict: string }>;
}

export function scanContradictions(input: ContradictionScanInput): WorldContradiction[] {
  const out: WorldContradiction[] = [];
  const canon = input.canon ?? loadCanon(input.worldId);

  // duplicate titles
  const titleMap = new Map<string, WorldCanonEntry[]>();
  canon.forEach(c => {
    const key = c.title.trim().toLowerCase();
    titleMap.set(key, [...(titleMap.get(key) ?? []), c]);
  });
  titleMap.forEach((arr, key) => {
    if (arr.length > 1) {
      out.push({
        id: `contra-dup-${key}-${Date.now().toString(36)}`,
        worldId: input.worldId,
        contradictionType: "DUPLICATE_ASSET",
        severity: "MEDIUM",
        affectedIds: arr.map(a => a.id),
        explanation: `存在 ${arr.length} 条同名正典「${arr[0].title}」`,
        suggestedFix: "合并或将其中一个降级为 DRAFT",
        fixStrategy: "merge",
        autoFixAvailable: true,
      });
    }
  });

  if (canon.length > 200) {
    out.push({
      id: `contra-overgrowth-${Date.now().toString(36)}`,
      worldId: input.worldId, contradictionType: "OVERGROWTH",
      severity: "HIGH", affectedIds: [],
      explanation: `世界正典数量过多（${canon.length}），可能过度膨胀`,
      suggestedFix: "运行 World Compression（建议 PLAYABLE_CORE 或 NARRATIVE_BIBLE）",
      fixStrategy: "compress", autoFixAvailable: true,
    });
  }

  if (input.realityConfusionFlag) {
    out.push({
      id: `contra-reality-${Date.now().toString(36)}`,
      worldId: input.worldId, contradictionType: "REALITY_CONFUSION",
      severity: "CRITICAL", affectedIds: [],
      explanation: "检测到虚构 lore 被当作 REAL_WORLD_FACT 引用",
      suggestedFix: "降级为 FICTIONAL_LORE 并标注 WORLD_ENGINE_OUTPUT",
      fixStrategy: "downgradeCanon", autoFixAvailable: true,
    });
  }

  input.npcMemoryConflicts?.forEach(c => {
    out.push({
      id: `contra-npc-${c.npcId}-${Date.now().toString(36)}`,
      worldId: input.worldId, contradictionType: "NPC_MEMORY_CONFLICT",
      severity: "MEDIUM", affectedIds: [c.npcId],
      explanation: c.conflict, suggestedFix: "创建分支时间线或合并 NPC 记忆",
      fixStrategy: "splitTimeline", autoFixAvailable: false,
    });
  });

  if (input.resourceFlow) {
    const negatives = Object.entries(input.resourceFlow.resources).filter(([, v]) => v < 0);
    if (negatives.length) {
      out.push({
        id: `contra-res-${Date.now().toString(36)}`,
        worldId: input.worldId, contradictionType: "RESOURCE_CONFLICT",
        severity: "HIGH", affectedIds: negatives.map(([k]) => k),
        explanation: `资源出现负值：${negatives.map(([k, v]) => `${k}=${v}`).join("，")}`,
        suggestedFix: "新增资源记账规则并补充 inflow",
        fixStrategy: "founderReview", autoFixAvailable: false,
      });
    }
  }

  return out;
}

export function suggestResolutions(contras: WorldContradiction[]): string[] {
  return contras.map(c => `[${c.severity}] ${c.contradictionType} → ${c.suggestedFix}（策略：${c.fixStrategy}）`);
}
