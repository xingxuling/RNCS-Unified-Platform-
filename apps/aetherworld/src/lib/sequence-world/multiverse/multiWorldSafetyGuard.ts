import { MULTI_WORLD_SAFETY_RULES, type MultiWorldSafetyRule } from "@/constants/sequence-world/multiverse/multiWorldSafetyRules";
import type { RegisteredWorld, WorldPortal, WorldTransferRecord } from "./types";

export interface SafetyEvaluation {
  rule: MultiWorldSafetyRule;
  passed: boolean;
  detail?: string;
}

export function evaluateMultiWorldSafety(
  worlds: RegisteredWorld[],
  portals: WorldPortal[],
  transfers: WorldTransferRecord[],
  maxWorlds = 7,
): { passed: boolean; results: SafetyEvaluation[]; criticalCount: number } {
  const results: SafetyEvaluation[] = MULTI_WORLD_SAFETY_RULES.map((rule) => {
    switch (rule.id) {
      case "NO_INFINITE_WORLD_GROWTH":
        return { rule, passed: worlds.length <= maxWorlds, detail: `${worlds.length}/${maxWorlds}` };
      case "DEMO_REAL_ISOLATION": {
        const bad = portals.some((p) => {
          const a = worlds.find((w) => w.worldId === p.fromWorldId);
          const b = worlds.find((w) => w.worldId === p.toWorldId);
          return a && b && a.ownerSubjectMode === "DEMO" && b.ownerSubjectMode !== "DEMO";
        });
        return { rule, passed: !bad };
      }
      case "FULL60_PRIVATE": {
        const leak = worlds.some((w) => w.sourceSequenceMode === "FULL_60" && w.privacyLevel === "PUBLIC_DEMO");
        return { rule, passed: !leak };
      }
      case "FOUNDER_LOCKED_PROTECTED": {
        const leak = portals.some((p) => {
          const to = worlds.find((w) => w.worldId === p.toWorldId);
          return to?.privacyLevel === "FOUNDER_PRIVATE" && p.requiredPermission !== "FOUNDER";
        });
        return { rule, passed: !leak };
      }
      case "NO_REAL_ASSET":
        return { rule, passed: transfers.every((t) => !/现实|现金|套现|投资/.test(t.assetSummary)) };
      default:
        return { rule, passed: true };
    }
  });
  const criticalCount = results.filter((r) => !r.passed && r.rule.severity === "CRITICAL").length;
  return { passed: criticalCount === 0, results, criticalCount };
}

export function getSafetyBoundaryText(): string {
  return "多世界网络用于虚拟世界、创作、游戏、系统建模和个人世界体验。世界门户、世界互访、世界资源、世界联邦和多世界事件均属于虚拟世界结构，不代表现实行动、现实资产、现实金融或现实预测。Full60 生成的个人世界默认仅本地保存，导出或加入多世界网络前需确认。";
}
