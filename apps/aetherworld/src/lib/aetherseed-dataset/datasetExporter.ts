// AetherSeed Dataset · 导出器
// 支持 TXT / JSONL / ChatML / Alpaca；BLOCK 样本永不导出；导出前二次扫描敏感残留。
import type {
  DatasetExportArtifact,
  DatasetExportFormat,
  DatasetVersion,
  TrainingSample,
} from "./datasetTypes";
import { getTrainingSamplesByIds } from "./trainingSampleStore";
import { containsResidualSensitive } from "./datasetSafetyPolicy";

function safeText(v: string | Record<string, unknown>): string {
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function isSampleExportable(s: TrainingSample): boolean {
  if (s.safetyStatus === "BLOCK") return false;
  const out = safeText(s.output);
  if (containsResidualSensitive(out) || containsResidualSensitive(s.instruction)) return false;
  return true;
}

function renderTxt(samples: TrainingSample[]): string[] {
  return samples.map((s) => safeText(s.output));
}

function renderJsonl(samples: TrainingSample[]): string[] {
  return samples.map((s) =>
    JSON.stringify({
      id: s.id,
      instruction: s.instruction,
      input: s.input ?? "",
      output: s.output,
      sampleType: s.sampleType,
      tags: s.tags,
    }),
  );
}

function renderChatMl(samples: TrainingSample[]): string[] {
  return samples.map((s) =>
    JSON.stringify({
      messages: [
        { role: "system", content: "你是 AetherSeed 助手，遵守 Aetherworld 安全策略。" },
        { role: "user", content: s.input ? `${s.instruction}\n\n${s.input}` : s.instruction },
        { role: "assistant", content: safeText(s.output) },
      ],
    }),
  );
}

function renderAlpaca(samples: TrainingSample[]): string[] {
  return samples.map((s) =>
    JSON.stringify({
      instruction: s.instruction,
      input: s.input ?? "",
      output: safeText(s.output),
    }),
  );
}

function render(samples: TrainingSample[], format: DatasetExportFormat): string[] {
  switch (format) {
    case "TXT":
      return renderTxt(samples);
    case "JSONL":
      return renderJsonl(samples);
    case "CHATML":
      return renderChatMl(samples);
    case "ALPACA":
      return renderAlpaca(samples);
  }
}

function fileNameFor(version: DatasetVersion, format: DatasetExportFormat): string {
  const ext = format === "TXT" ? "txt" : format === "JSONL" ? "jsonl" : "json";
  const safeName = version.name.replace(/[^\w\u4e00-\u9fa5-]+/g, "_");
  return `${safeName}_${version.version}_${format.toLowerCase()}.${ext}`;
}

export function exportDatasetVersion(
  version: DatasetVersion,
  format: DatasetExportFormat,
): DatasetExportArtifact {
  const samples = getTrainingSamplesByIds(version.sampleIds);
  const blocked = samples.length - samples.filter(isSampleExportable).length;
  const exportable = samples.filter(isSampleExportable);
  const lines = render(exportable, format);
  const previewLines = lines.slice(0, 3);
  const warnings: string[] = [];
  if (blocked > 0) warnings.push(`已排除 ${blocked} 条 BLOCK 或敏感残留样本。`);
  if (exportable.length === 0) warnings.push("无可导出样本（全部被安全策略阻断）。");

  return {
    format,
    datasetId: version.id,
    fileName: fileNameFor(version, format),
    contentPreview: previewLines.join(format === "TXT" ? "\n\n" : "\n"),
    totalLines: lines.length,
    blockedExcluded: blocked,
    warnings,
  };
}

export function exportDatasetVersionAll(version: DatasetVersion): DatasetExportArtifact[] {
  return version.defaultExportFormats.map((f) => exportDatasetVersion(version, f));
}
