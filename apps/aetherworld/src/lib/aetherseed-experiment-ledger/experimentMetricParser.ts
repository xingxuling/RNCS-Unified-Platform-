// AetherSeed Experiment Ledger · Metrics 解析器
// 从用户粘贴的训练日志摘要中提取常见指标。
// 不读取文件、不调用外部解析；纯字符串匹配。
import type { ExperimentMetrics } from "./experimentLedgerTypes";

const PATTERNS: { key: keyof ExperimentMetrics; re: RegExp }[] = [
  { key: "trainLoss",          re: /train[\s_-]*loss[^0-9\-]*([\d.]+)/i },
  { key: "evalLoss",           re: /eval[\s_-]*loss[^0-9\-]*([\d.]+)/i },
  { key: "perplexity",         re: /perplexity|ppl[^0-9\-]*([\d.]+)/i },
  { key: "mslValidity",        re: /msl[^0-9\-]*([\d.]+)/i },
  { key: "jsonValidity",       re: /json[^0-9\-]*([\d.]+)/i },
  { key: "routerAccuracy",     re: /router[^0-9\-]*([\d.]+)/i },
  { key: "toolCallValidity",   re: /tool[\s_-]*call[^0-9\-]*([\d.]+)/i },
  { key: "lovablePromptScore", re: /lovable[^0-9\-]*([\d.]+)/i },
  { key: "safetyPassRate",     re: /safety[^0-9\-]*([\d.]+)/i },
];

export interface ParsedMetricsDraft {
  trainLoss?: number;
  evalLoss?: number;
  perplexity?: number;
  mslValidity?: number;
  jsonValidity?: number;
  routerAccuracy?: number;
  toolCallValidity?: number;
  lovablePromptScore?: number;
  safetyPassRate?: number;
}

export function parseMetricsFromLog(raw: string): ParsedMetricsDraft {
  const draft: ParsedMetricsDraft = {};
  if (!raw) return draft;
  for (const { key, re } of PATTERNS) {
    const m = raw.match(re);
    if (m && m[1]) {
      const v = Number(m[1]);
      if (Number.isFinite(v)) {
        (draft as Record<string, number>)[key as string] = v;
      }
    }
  }
  return draft;
}
