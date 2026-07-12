import { resolveConsistencyLevel } from "@/constants/objectConsistencyLevels";
import type { ObjectEssence } from "./objectEssenceResolver";
import type { ObjectBoundary } from "./objectBoundaryEngine";
import type { ObjectInvariants } from "./objectInvariantDetector";

export interface SelfConsistencyResult {
  score: number;
  level: "LOW" | "MEDIUM" | "HIGH" | "EXCELLENT";
  label: string;
  consistentParts: string[];
  inconsistentParts: string[];
  correctionSuggestion: string[];
}

export function evaluateSelfConsistency(args: {
  name: string;
  essence: ObjectEssence;
  boundary: ObjectBoundary;
  invariants: ObjectInvariants;
}): SelfConsistencyResult {
  let score = 0;
  const consistent: string[] = [];
  const inconsistent: string[] = [];
  const fix: string[] = [];

  score += Math.min(35, args.essence.essenceConfidence / 100 * 35);
  if (args.essence.essenceConfidence >= 60) consistent.push("本质表达清晰");
  else { inconsistent.push("本质表达模糊"); fix.push("补充对象核心描述"); }

  const missingB = args.boundary.boundaryByType.filter(b => b.status === "缺失").length;
  const bScore = Math.max(0, 30 - missingB * 3);
  score += bScore;
  if (missingB <= 2) consistent.push("边界基本完整");
  else { inconsistent.push("多项边界缺失"); fix.push("补全功能/数据/安全边界"); }

  const invCount = args.invariants.primaryInvariants.length;
  score += Math.min(20, invCount * 7);
  if (invCount >= 2) consistent.push("核心不变量已识别");
  else { inconsistent.push("核心不变量不足"); fix.push("明确至少 2 个核心不变量"); }

  if (args.name.trim().length >= 2) { score += 10; consistent.push("命名清晰"); }
  else { inconsistent.push("命名缺失"); fix.push("为对象命名"); }

  if (args.essence.notThis.length >= 1) score += 5;

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));
  const lvl = resolveConsistencyLevel(finalScore);
  return {
    score: finalScore,
    level: lvl.level as SelfConsistencyResult["level"],
    label: lvl.label,
    consistentParts: consistent,
    inconsistentParts: inconsistent,
    correctionSuggestion: fix,
  };
}
