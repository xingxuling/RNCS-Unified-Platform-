import type { CrossWorldRelation, RegisteredWorld, WorldConflict, WorldPortal } from "./types";

export type CompressionTarget =
  | "MULTIVERSE_SUMMARY"
  | "WORLD_MAP"
  | "PORTAL_MAP"
  | "RELATION_GRAPH"
  | "NARRATIVE_MULTIVERSE_BIBLE"
  | "GAME_MULTIWORLD_RUNTIME"
  | "FOUNDER_NETWORK_TRACE";

export interface MultiWorldCompressionResult {
  target: CompressionTarget;
  summary: string;
  keyWorlds: string[];
  keyPortals: string[];
  keyConflicts: string[];
  recommendedUse: string;
}

export function compressMultiWorld(
  target: CompressionTarget,
  worlds: RegisteredWorld[],
  portals: WorldPortal[],
  relations: CrossWorldRelation[],
  conflicts: WorldConflict[],
): MultiWorldCompressionResult {
  const keyWorlds = worlds.slice(0, 5).map((w) => `${w.worldName}(${w.worldType})`);
  const keyPortals = portals.slice(0, 5).map((p) => p.portalId);
  const keyConflicts = conflicts.filter((c) => c.severity === "HIGH" || c.severity === "CRITICAL").map((c) => c.conflictType);
  const summary =
    target === "NARRATIVE_MULTIVERSE_BIBLE"
      ? `共 ${worlds.length} 个世界、${portals.length} 个门户，构成叙事多宇宙骨架。`
      : target === "WORLD_MAP"
      ? `世界地图：${worlds.length} 节点、${relations.length} 边。`
      : target === "FOUNDER_NETWORK_TRACE"
      ? `Founder Trace：${worlds.length} 世界 / ${portals.length} 门户 / ${conflicts.length} 冲突。`
      : `多宇宙摘要：${worlds.length} 世界 / ${portals.length} 门户 / ${conflicts.length} 冲突。`;
  return {
    target,
    summary,
    keyWorlds,
    keyPortals,
    keyConflicts,
    recommendedUse:
      target === "GAME_MULTIWORLD_RUNTIME" ? "导入 Godot / Unity 作为多世界 Runtime。" : "用于叙事、教学或 Founder 审计。",
  };
}
