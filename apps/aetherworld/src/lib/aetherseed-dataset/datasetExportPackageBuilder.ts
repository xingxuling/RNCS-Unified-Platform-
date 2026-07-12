// AetherSeed Dataset · 完整训练包构建器
// 本轮不引入 zip 依赖；通过「多文件顺序下载」实现 Package 下载。
import type { DatasetExportFormat, DatasetVersion } from "./datasetTypes";
import type { DownloadFile } from "./datasetBrowserDownload";
import {
  buildEvalDownloadFile,
  buildManifestDownloadFile,
  buildTrainingDownloadFile,
} from "./datasetDownloadBuilder";
import {
  buildBlockedSummaryFile,
  buildSafetyReportFile,
} from "./datasetExportSafetyReport";
import { buildReadmeFile } from "./datasetExportReadmeBuilder";

export interface DatasetPackageResult {
  baseFolder: string;
  files: DownloadFile[];
  summary: {
    trainingExported: number;
    trainingBlocked: number;
    evalExported: number;
    evalBlocked: number;
  };
}

export function buildDatasetPackage(
  version: DatasetVersion,
  trainingFormat: DatasetExportFormat = "JSONL",
): DatasetPackageResult {
  const train = buildTrainingDownloadFile(version, trainingFormat);
  const evalRes = buildEvalDownloadFile(version);
  const manifest = buildManifestDownloadFile(version);
  const safety = buildSafetyReportFile(version);
  const blocked = buildBlockedSummaryFile(version);
  const readme = buildReadmeFile(version, {
    trainingExported: train.exportedSamples,
    trainingBlocked: train.blockedExcluded,
    evalExported: evalRes.exportedEvals,
    evalBlocked: evalRes.blockedExcluded,
    formats: [trainingFormat],
  });

  return {
    baseFolder: train.file.fileName.replace(/_train.*$/, ""),
    files: [train.file, evalRes.file, manifest, readme, safety, blocked],
    summary: {
      trainingExported: train.exportedSamples,
      trainingBlocked: train.blockedExcluded,
      evalExported: evalRes.exportedEvals,
      evalBlocked: evalRes.blockedExcluded,
    },
  };
}
