// AetherSeed Dataset · 真实下载文件构建器
// 在 datasetExporter 基础上输出「完整正文」而非预览，并复用安全策略二次扫描。
import type {
  DatasetExportFormat,
  DatasetVersion,
  EvalSample,
  TrainingSample,
} from "./datasetTypes";
import { getTrainingSamplesByIds } from "./trainingSampleStore";
import { getEvalSamplesByIds } from "./evalSampleStore";
import { containsResidualSensitive } from "./datasetSafetyPolicy";
import type { DownloadFile } from "./datasetBrowserDownload";
import { manifestToJson } from "./datasetManifestBuilder";

function safeText(v: string | Record<string, unknown>): string {
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export function isTrainingSampleExportable(s: TrainingSample): boolean {
  if (s.safetyStatus === "BLOCK") return false;
  const out = safeText(s.output);
  if (containsResidualSensitive(out)) return false;
  if (containsResidualSensitive(s.instruction)) return false;
  if (s.input && containsResidualSensitive(s.input)) return false;
  return true;
}

export function isEvalSampleExportable(e: EvalSample): boolean {
  if (e.safetyStatus === "BLOCK") return false;
  const exp = safeText(e.expected);
  if (containsResidualSensitive(exp)) return false;
  if (containsResidualSensitive(e.question)) return false;
  return true;
}

function renderTraining(samples: TrainingSample[], format: DatasetExportFormat): string {
  if (format === "TXT") {
    return samples.map((s) => safeText(s.output)).join("\n\n") + (samples.length ? "\n" : "");
  }
  const lines = samples.map((s) => {
    switch (format) {
      case "JSONL":
        return JSON.stringify({
          id: s.id,
          instruction: s.instruction,
          input: s.input ?? "",
          output: s.output,
          sampleType: s.sampleType,
          tags: s.tags,
        });
      case "CHATML":
        return JSON.stringify({
          messages: [
            { role: "system", content: "你是 AetherSeed 助手，遵守 Aetherworld 安全策略。" },
            { role: "user", content: s.input ? `${s.instruction}\n\n${s.input}` : s.instruction },
            { role: "assistant", content: safeText(s.output) },
          ],
        });
      case "ALPACA":
        return JSON.stringify({
          instruction: s.instruction,
          input: s.input ?? "",
          output: safeText(s.output),
        });
      default:
        return "";
    }
  });
  return lines.join("\n") + (lines.length ? "\n" : "");
}

function renderEvalJsonl(evals: EvalSample[]): string {
  const lines = evals.map((e) =>
    JSON.stringify({
      id: e.id,
      evalType: e.evalType,
      question: e.question,
      expected: e.expected,
      criteria: e.criteria,
      difficulty: e.difficulty,
    }),
  );
  return lines.join("\n") + (lines.length ? "\n" : "");
}

function sanitizeName(name: string): string {
  return name.replace(/[^\w\u4e00-\u9fa5-]+/g, "_");
}

function baseName(version: DatasetVersion): string {
  return `AetherSeed_${sanitizeName(version.name)}_${sanitizeName(version.version)}`;
}

const FORMAT_EXT: Record<DatasetExportFormat, string> = {
  TXT: "txt",
  JSONL: "jsonl",
  CHATML: "jsonl",
  ALPACA: "jsonl",
};

const FORMAT_MIME: Record<DatasetExportFormat, string> = {
  TXT: "text/plain",
  JSONL: "application/x-ndjson",
  CHATML: "application/x-ndjson",
  ALPACA: "application/x-ndjson",
};

export interface BuildTrainingFileResult {
  file: DownloadFile;
  totalSamples: number;
  exportedSamples: number;
  blockedExcluded: number;
  warnedIncluded: number;
}

/** 训练集真实文件（完整正文，按格式生成）。 */
export function buildTrainingDownloadFile(
  version: DatasetVersion,
  format: DatasetExportFormat,
): BuildTrainingFileResult {
  const all = getTrainingSamplesByIds(version.sampleIds);
  const exportable = all.filter(isTrainingSampleExportable);
  const content = renderTraining(exportable, format);
  const suffix =
    format === "JSONL"
      ? "train"
      : format === "CHATML"
        ? "train_chatml"
        : format === "ALPACA"
          ? "train_alpaca"
          : "train_txt";
  return {
    file: {
      fileName: `${baseName(version)}_${suffix}.${FORMAT_EXT[format]}`,
      content,
      mimeType: FORMAT_MIME[format],
    },
    totalSamples: all.length,
    exportedSamples: exportable.length,
    blockedExcluded: all.length - exportable.length,
    warnedIncluded: exportable.filter((s) => s.safetyStatus === "WARN").length,
  };
}

export interface BuildEvalFileResult {
  file: DownloadFile;
  totalEvals: number;
  exportedEvals: number;
  blockedExcluded: number;
}

export function buildEvalDownloadFile(version: DatasetVersion): BuildEvalFileResult {
  const all = getEvalSamplesByIds(version.evalSampleIds);
  const exportable = all.filter(isEvalSampleExportable);
  const content = renderEvalJsonl(exportable);
  return {
    file: {
      fileName: `${baseName(version)}_eval.jsonl`,
      content,
      mimeType: "application/x-ndjson",
    },
    totalEvals: all.length,
    exportedEvals: exportable.length,
    blockedExcluded: all.length - exportable.length,
  };
}

export function buildManifestDownloadFile(version: DatasetVersion): DownloadFile {
  return {
    fileName: `${baseName(version)}_dataset_manifest.json`,
    content: manifestToJson(version),
    mimeType: "application/json",
  };
}

export function buildEvalManifestDownloadFile(version: DatasetVersion): DownloadFile {
  const evals = getEvalSamplesByIds(version.evalSampleIds);
  const usable = evals.filter(isEvalSampleExportable);
  const payload = {
    manifestVersion: "0.1" as const,
    datasetId: version.id,
    datasetName: version.name,
    version: version.version,
    evalCount: usable.length,
    blockedExcluded: evals.length - usable.length,
    composition: groupBy(usable, (e) => e.evalType),
    difficultyBreakdown: groupBy(usable, (e) => e.difficulty),
    generatedAt: new Date().toISOString(),
  };
  return {
    fileName: `${baseName(version)}_eval_manifest.json`,
    content: JSON.stringify(payload, null, 2),
    mimeType: "application/json",
  };
}

function groupBy<T>(arr: T[], key: (x: T) => string): { key: string; count: number }[] {
  const m = new Map<string, number>();
  for (const x of arr) m.set(key(x), (m.get(key(x)) ?? 0) + 1);
  return Array.from(m.entries())
    .map(([k, v]) => ({ key: k, count: v }))
    .sort((a, b) => b.count - a.count);
}

export function getPackageBaseName(version: DatasetVersion): string {
  return baseName(version);
}
