export interface ReusePotentialScore {
  score: number;
  level: "LOW" | "MEDIUM" | "HIGH" | "SYSTEMIC";
  affectedExistingModules: string[];
  reusableOutputs: string[];
  downstreamBenefits: string[];
  reason: string;
}

export function scoreReusePotential(opts: {
  affectedExistingModules?: string[];
  reusableOutputs?: string[];
  downstreamBenefits?: string[];
}): ReusePotentialScore {
  const am = opts.affectedExistingModules ?? [];
  const ro = opts.reusableOutputs ?? [];
  const db = opts.downstreamBenefits ?? [];
  const score = Math.min(100, am.length * 8 + ro.length * 6 + db.length * 6 + 20);
  let level: ReusePotentialScore["level"] = "LOW";
  if (score >= 91) level = "SYSTEMIC";
  else if (score >= 76) level = "HIGH";
  else if (score >= 56) level = "MEDIUM";
  else if (score >= 31) level = "MEDIUM";
  else level = "LOW";

  return {
    score,
    level,
    affectedExistingModules: am,
    reusableOutputs: ro,
    downstreamBenefits: db,
    reason: score >= 76 ? "高复用潜力，建议作为系统层" : score >= 56 ? "中等复用，可做模块升级" : score >= 31 ? "小功能优化" : "复用低，不建议新增",
  };
}
