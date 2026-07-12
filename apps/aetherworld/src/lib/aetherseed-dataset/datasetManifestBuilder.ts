// AetherSeed Dataset · dataset_manifest.json 构建器
import type { DatasetManifest, DatasetVersion } from "./datasetTypes";
import { getTrainingSamplesByIds } from "./trainingSampleStore";
import { getEvalSamplesByIds } from "./evalSampleStore";
import { DATASET_SAFETY_ALLOWED, DATASET_SAFETY_FORBIDDEN } from "./datasetSafetyPolicy";

export function buildDatasetManifest(version: DatasetVersion): DatasetManifest {
  const samples = getTrainingSamplesByIds(version.sampleIds);
  const evals = getEvalSamplesByIds(version.evalSampleIds);
  const blockedExcluded = samples.filter((s) => s.safetyStatus === "BLOCK").length;
  const warnedIncluded = samples.filter((s) => s.safetyStatus === "WARN").length;

  const map = new Map<string, number>();
  for (const s of samples) {
    if (s.safetyStatus === "BLOCK") continue;
    map.set(s.sampleType, (map.get(s.sampleType) ?? 0) + 1);
  }

  return {
    manifestVersion: "0.1",
    dataset: version,
    counts: {
      trainingSamples: samples.length - blockedExcluded,
      evalSamples: evals.filter((e) => e.safetyStatus !== "BLOCK").length,
      blockedExcluded,
      warnedIncluded,
    },
    composition: Array.from(map.entries())
      .map(([sampleType, count]) => ({ sampleType, count }))
      .sort((a, b) => b.count - a.count),
    safetyPolicy: [...DATASET_SAFETY_ALLOWED, ...DATASET_SAFETY_FORBIDDEN.map((f) => `禁止：${f}`)],
    exportFormats: version.defaultExportFormats,
    generatedAt: new Date().toISOString(),
  };
}

export function manifestToJson(version: DatasetVersion): string {
  return JSON.stringify(buildDatasetManifest(version), null, 2);
}
