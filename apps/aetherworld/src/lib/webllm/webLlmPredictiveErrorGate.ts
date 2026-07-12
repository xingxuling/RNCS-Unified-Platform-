export interface PredictiveErrorReport {
  reportId: string;
  runId: string;
  driftScore: number;
  errorSignals: string[];
  suspiciousClaims: string[];
  missingEvidence: string[];
  recommendedFixes: string[];
  status: "PASS" | "WARN" | "FAIL" | "BLOCKED";
}

const CLAIM_PATTERNS = [
  /已部署/, /已发布/, /真实运行/, /已上线/, /官方数据/, /权威来源/,
];

export function runPredictiveErrorGate(runId: string, output: string, taskHint: string): PredictiveErrorReport {
  const errorSignals: string[] = [];
  const suspicious: string[] = [];
  const missing: string[] = [];

  for (const re of CLAIM_PATTERNS) {
    if (re.test(output)) suspicious.push(`声明可疑：${re}`);
  }
  if (!output.trim()) errorSignals.push("输出为空");
  if (/绝对|一定|必然/.test(output)) suspicious.push("使用绝对化措辞");
  if (!output.includes("草案") && !output.includes("draft") && /代码|架构|文档/.test(output)) missing.push("缺少草案标记");

  const driftScore =
    (suspicious.length ? 0.3 : 0) +
    (missing.length ? 0.2 : 0) +
    (taskHint && !output.includes((taskHint.split(/\s+/)[0] || "")) ? 0.2 : 0);

  const status: PredictiveErrorReport["status"] =
    suspicious.length >= 2 ? "FAIL" :
    driftScore >= 0.4 ? "WARN" :
    "PASS";

  return {
    reportId: `per-${Date.now().toString(36)}`,
    runId,
    driftScore,
    errorSignals,
    suspiciousClaims: suspicious,
    missingEvidence: missing,
    recommendedFixes: [
      suspicious.length ? "去除绝对化与权威化措辞" : "",
      missing.length ? "明确标注「草案」/「未真实执行」" : "",
    ].filter(Boolean),
    status,
  };
}
