import type { CrossFunctionalObject } from "./crossFunctionalObjectAnalyzer";
import type { CrossFunctionalOutput } from "./crossFunctionalOutputAdapter";

export interface MeaningDriftCheck {
  checkId: string;
  sourceObjectId: string;
  targetOutputId: string;
  driftLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  driftReasons: string[];
  suggestedFixes: string[];
}

const RED_FLAGS: Array<{ re: RegExp; reason: string; level: MeaningDriftCheck["driftLevel"]; fix: string }> = [
  { re: /(数列货币|sequence currency).*(美元|人民币|RMB|USD|股票|理财)/i, reason: "数列货币被写成现实货币", level: "CRITICAL", fix: "把货币术语替换为 Aetherworld 内部资产标签" },
  { re: /(虚拟世界|virtual world).*(一定会|必然|确定)/, reason: "虚拟世界被写成现实预测", level: "CRITICAL", fix: "降级为概率/可能性表述" },
  { re: /(常数宇宙).*(物理定律|科学定律)/, reason: "常数宇宙被写成现实物理定律", level: "HIGH", fix: "标注为系统内部常数，非现实定律" },
  { re: /(系统宪法).*(法律|起诉|诉讼)/, reason: "系统宪法被写成现实法律", level: "HIGH", fix: "标注为产品内部规则" },
  { re: /(Demo|演示).*?(真实|生产)/, reason: "Demo 与 Real 混淆", level: "HIGH", fix: "明确标记内容来源为 Demo" },
  { re: /(Founder|创始人).*?(公开)/, reason: "Founder-only 信息可能外泄", level: "CRITICAL", fix: "移除并保留在 Founder Workspace" },
];

export function detectMeaningDrift(obj: CrossFunctionalObject, output: CrossFunctionalOutput): MeaningDriftCheck {
  const blob = JSON.stringify(output);
  const reasons: string[] = [];
  const fixes: string[] = [];
  let level: MeaningDriftCheck["driftLevel"] = "LOW";
  const order = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 } as const;
  for (const r of RED_FLAGS) {
    if (r.re.test(blob)) {
      reasons.push(r.reason);
      fixes.push(r.fix);
      if (order[r.level] > order[level]) level = r.level;
    }
  }
  return {
    checkId: `drift_${Date.now().toString(36)}`,
    sourceObjectId: obj.objectId,
    targetOutputId: output.outputId,
    driftLevel: level,
    driftReasons: reasons,
    suggestedFixes: fixes,
  };
}
