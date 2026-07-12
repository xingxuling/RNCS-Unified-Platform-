// 行动压缩
import type { RawEngineOutput } from "./blackBoxSignalExtractor";

export type ActionPermission = "GO" | "WAIT" | "TEST" | "TURN" | "STOP" | "ARCHIVE" | "RECALCULATE";

export interface CompressedActionPlan {
  primaryAction: string;
  secondaryActions: string[];
  doNotDo: string[];
  actionPermission: ActionPermission;
}

export function compressActions(
  raws: RawEngineOutput[],
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
): CompressedActionPlan {
  const acts: string[] = [];
  for (const r of raws) {
    const a = (r as { actions?: string[] }).actions;
    if (Array.isArray(a)) acts.push(...a);
  }
  const uniq = Array.from(new Set(acts));
  const primary = uniq[0] ?? "先运行系统验收与压缩审计。";
  const secondary = uniq.slice(1, 5);
  const doNot: string[] = [];
  let permission: ActionPermission = "GO";
  if (riskLevel === "CRITICAL") { permission = "STOP"; doNot.push("禁止在未复核前执行高风险操作。"); }
  else if (riskLevel === "HIGH") permission = "WAIT";
  else if (riskLevel === "MEDIUM") permission = "TEST";
  return { primaryAction: primary, secondaryActions: secondary, doNotDo: doNot, actionPermission: permission };
}
