// AetherSeed Dataset · 导出安全报告
// 生成 safety_report.json 与 blocked_samples_summary.json
// 严格规则：blocked_samples_summary 只写摘要（id、原因、状态），不写原文。
import type { DatasetVersion } from "./datasetTypes";
import { getTrainingSamplesByIds } from "./trainingSampleStore";
import { getEvalSamplesByIds } from "./evalSampleStore";
import {
  DATASET_SAFETY_ALLOWED,
  DATASET_SAFETY_FORBIDDEN,
  containsResidualSensitive,
} from "./datasetSafetyPolicy";
import type { DownloadFile } from "./datasetBrowserDownload";
import { getPackageBaseName } from "./datasetDownloadBuilder";

export interface BlockedSampleSummaryItem {
  id: string;
  kind: "TRAINING" | "EVAL";
  sampleType: string;
  reason: string;
  /** 不写原文：只给出极短的指纹（前 24 字符的安全摘要，去除敏感词后） */
  digest: string;
}

function safeDigest(text: string): string {
  const masked = text
    .replace(/sk-[a-zA-Z0-9]{16,}/g, "[REDACTED_KEY]")
    .replace(/bearer\s+[a-zA-Z0-9._-]{16,}/gi, "[REDACTED_BEARER]")
    .replace(/-----BEGIN [A-Z ]+PRIVATE KEY-----[\s\S]+?-----END [A-Z ]+PRIVATE KEY-----/g, "[REDACTED_PRIVATE_KEY]")
    .replace(/full60[_\s-]?raw|原始数列/gi, "[REDACTED_FULL60]")
    .replace(/founder[_\s-]?only|创始人专属原文/gi, "[REDACTED_FOUNDER]");
  const collapsed = masked.replace(/\s+/g, " ").trim();
  return collapsed.slice(0, 24);
}

export function buildBlockedSamplesSummary(version: DatasetVersion): BlockedSampleSummaryItem[] {
  const items: BlockedSampleSummaryItem[] = [];
  for (const s of getTrainingSamplesByIds(version.sampleIds)) {
    const out = typeof s.output === "string" ? s.output : JSON.stringify(s.output);
    const blocked = s.safetyStatus === "BLOCK";
    const residual =
      containsResidualSensitive(out) ||
      containsResidualSensitive(s.instruction) ||
      (s.input ? containsResidualSensitive(s.input) : false);
    if (blocked || residual) {
      items.push({
        id: s.id,
        kind: "TRAINING",
        sampleType: s.sampleType,
        reason: blocked ? "样本被标记为 BLOCK" : "二次扫描命中敏感残留（密钥 / Full60 / Founder-only）",
        digest: safeDigest(`${s.instruction} ${out}`),
      });
    }
  }
  for (const e of getEvalSamplesByIds(version.evalSampleIds)) {
    const exp = typeof e.expected === "string" ? e.expected : JSON.stringify(e.expected);
    const blocked = e.safetyStatus === "BLOCK";
    const residual = containsResidualSensitive(exp) || containsResidualSensitive(e.question);
    if (blocked || residual) {
      items.push({
        id: e.id,
        kind: "EVAL",
        sampleType: e.evalType,
        reason: blocked ? "评测被标记为 BLOCK" : "二次扫描命中敏感残留",
        digest: safeDigest(`${e.question} ${exp}`),
      });
    }
  }
  return items;
}

export interface SafetyReport {
  reportVersion: "0.1";
  datasetId: string;
  datasetName: string;
  version: string;
  generatedAt: string;
  counters: {
    trainingTotal: number;
    trainingExported: number;
    trainingBlocked: number;
    trainingWarn: number;
    evalTotal: number;
    evalExported: number;
    evalBlocked: number;
  };
  policy: {
    allowed: string[];
    forbidden: string[];
  };
  notes: string[];
  blockedSamplesSummary: BlockedSampleSummaryItem[];
}

export function buildSafetyReport(version: DatasetVersion): SafetyReport {
  const trainings = getTrainingSamplesByIds(version.sampleIds);
  const evals = getEvalSamplesByIds(version.evalSampleIds);
  const summary = buildBlockedSamplesSummary(version);
  const trainingBlocked = summary.filter((x) => x.kind === "TRAINING").length;
  const evalBlocked = summary.filter((x) => x.kind === "EVAL").length;

  return {
    reportVersion: "0.1",
    datasetId: version.id,
    datasetName: version.name,
    version: version.version,
    generatedAt: new Date().toISOString(),
    counters: {
      trainingTotal: trainings.length,
      trainingExported: trainings.length - trainingBlocked,
      trainingBlocked,
      trainingWarn: trainings.filter((s) => s.safetyStatus === "WARN").length,
      evalTotal: evals.length,
      evalExported: evals.length - evalBlocked,
      evalBlocked,
    },
    policy: { allowed: DATASET_SAFETY_ALLOWED, forbidden: DATASET_SAFETY_FORBIDDEN },
    notes: [
      "blocked_samples_summary 仅含摘要指纹，不包含敏感原文。",
      "导出文件在写入前再次扫描密钥 / Full60 / Founder-only 残留。",
      "本报告由浏览器本地生成，不上传任何外部服务。",
    ],
    blockedSamplesSummary: summary,
  };
}

export function buildSafetyReportFile(version: DatasetVersion): DownloadFile {
  return {
    fileName: `${getPackageBaseName(version)}_safety_report.json`,
    content: JSON.stringify(buildSafetyReport(version), null, 2),
    mimeType: "application/json",
  };
}

export function buildBlockedSummaryFile(version: DatasetVersion): DownloadFile {
  return {
    fileName: `${getPackageBaseName(version)}_blocked_samples_summary.json`,
    content: JSON.stringify(
      {
        datasetId: version.id,
        datasetName: version.name,
        version: version.version,
        generatedAt: new Date().toISOString(),
        note: "本文件仅含摘要，不包含敏感原文。",
        items: buildBlockedSamplesSummary(version),
      },
      null,
      2,
    ),
    mimeType: "application/json",
  };
}
