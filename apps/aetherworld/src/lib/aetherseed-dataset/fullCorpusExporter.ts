// 材料工厂自动入库 · Full Corpus 真实导出包构建器
// 不上传外部，仅在浏览器端生成多文件下载。
import type { DownloadFile } from "./datasetBrowserDownload";
import {
  getFullCorpusCandidate,
  latestFullCorpusCandidate,
} from "./fullCorpusCandidateStore";
import { listRawCorpusDocuments } from "./rawCorpusStore";
import { listLongCorpusChunks } from "./longCorpusStore";
import { getTrainingSamplesByIds, listTrainingSamples } from "./trainingSampleStore";
import { listEvalSamples } from "./evalSampleStore";
import type { FullCorpusCandidate } from "./materialAutoSinkTypes";

export interface FullCorpusPackage {
  baseFolder: string;
  candidate: FullCorpusCandidate;
  files: DownloadFile[];
}

function jsonl(items: unknown[]): string {
  return items.map((it) => JSON.stringify(it)).join("\n") + (items.length ? "\n" : "");
}

export function buildFullCorpusPackage(candidateId?: string): FullCorpusPackage | null {
  const candidate = candidateId ? getFullCorpusCandidate(candidateId) : latestFullCorpusCandidate();
  if (!candidate) return null;

  const baseFolder = `aetherseed-full-corpus-${candidate.id}`;
  const rawDocs = listRawCorpusDocuments().filter((d) =>
    candidate.rawDocumentIds.includes(d.id),
  );
  const longChunks = listLongCorpusChunks().filter((c) =>
    candidate.longChunkIds.includes(c.id),
  );
  const trainingSamples = candidate.trainingSampleIds.length > 0
    ? getTrainingSamplesByIds(candidate.trainingSampleIds)
    : listTrainingSamples();
  const evalSamples = listEvalSamples().filter((e) => e.safetyStatus !== "BLOCK");

  // 1. raw_corpus_manifest.json（不含全文，仅指纹与统计）
  const rawManifest = {
    candidateId: candidate.id,
    generatedAt: new Date().toISOString(),
    rawDocumentCount: rawDocs.length,
    rawTokens: candidate.rawTokens,
    documents: rawDocs.map((d) => ({
      id: d.id,
      sourceName: d.sourceName,
      sourceType: d.sourceType,
      fingerprint: d.fingerprint,
      rawTokenEstimate: d.rawTokenEstimate,
      charCount: d.charCount,
      safetyStatus: d.safetyStatus,
      licenseStatus: d.licenseStatus,
      language: d.language ?? null,
    })),
  };

  // 2. long_corpus.jsonl
  const longJsonl = jsonl(
    longChunks.map((c) => ({
      id: c.id,
      rawDocumentId: c.rawDocumentId,
      chunkType: c.chunkType,
      targetUse: c.targetUse,
      tokenEstimate: c.tokenEstimate,
      text: c.text,
    })),
  );

  // 3. pretrain.txt（长文本拼接）
  const pretrain = longChunks
    .filter((c) => c.targetUse === "PRETRAIN" || c.targetUse === "CONTINUED_TRAINING")
    .map((c) => c.text)
    .join("\n\n---\n\n");

  // 4. train_sft.jsonl（SFT 风格）
  const sftRows = trainingSamples
    .filter((s) => s.safetyStatus !== "BLOCK")
    .map((s) => ({
      instruction: s.instruction,
      input: s.input ?? "",
      output: typeof s.output === "string" ? s.output : JSON.stringify(s.output),
      sampleType: s.sampleType,
      tags: s.tags,
    }));

  // 5. eval.jsonl
  const evalRows = evalSamples.map((e) => ({
    evalType: e.evalType,
    question: e.question,
    expected: typeof e.expected === "string" ? e.expected : JSON.stringify(e.expected),
    criteria: e.criteria,
    difficulty: e.difficulty,
  }));

  // 6. dataset_manifest.json
  const datasetManifest = {
    manifestVersion: "0.1",
    candidate,
    counts: {
      rawDocuments: rawDocs.length,
      longChunks: longChunks.length,
      trainingSamples: sftRows.length,
      evalSamples: evalRows.length,
    },
    generatedAt: new Date().toISOString(),
  };

  // 7. safety_report.json
  const safetyReport = {
    policy: [
      "BLOCK 样本不进入任何训练 / 评测集",
      "残留 secret / Full60 / Founder-only 已被剔除",
      "WARN 样本进入待复核或已脱敏后保留",
      "未授权 / 来源不明材料仅作索引",
    ],
    rawSafetyBreakdown: {
      PASS: rawDocs.filter((d) => d.safetyStatus === "PASS").length,
      WARN: rawDocs.filter((d) => d.safetyStatus === "WARN").length,
    },
  };

  // 8. license_manifest.json
  const licenseManifest = {
    licenseProfile: candidate.licenseProfile,
    safetyProfile: candidate.safetyProfile,
    sources: rawDocs.map((d) => ({
      id: d.id,
      sourceName: d.sourceName,
      sourceType: d.sourceType,
      licenseStatus: d.licenseStatus,
    })),
  };

  // 9. README.md
  const readme =
    `# AetherSeed Full Corpus Dataset · ${candidate.id}\n\n` +
    `生成时间：${new Date().toISOString()}\n\n` +
    `- 原始语料文档：${rawDocs.length}\n` +
    `- 长语料切片：${longChunks.length}\n` +
    `- 训练样本：${sftRows.length}\n` +
    `- 评测样本：${evalRows.length}\n` +
    `- Raw token：${candidate.rawTokens}\n` +
    `- Long token：${candidate.longTokens}\n` +
    `- SFT token：${candidate.sftTokens}\n` +
    `- Eval token：${candidate.evalTokens}\n` +
    `- 适配规模：${candidate.suitableFor.join(" / ") || "暂不达 300M 训练量"}\n\n` +
    `本数据集仅用于 Aetherworld 创始人内部训练，禁止外传。\n`;

  const files: DownloadFile[] = [
    {
      fileName: `${baseFolder}_raw_corpus_manifest.json`,
      content: JSON.stringify(rawManifest, null, 2),
      mimeType: "application/json",
    },
    {
      fileName: `${baseFolder}_long_corpus.jsonl`,
      content: longJsonl,
      mimeType: "application/jsonl",
    },
    {
      fileName: `${baseFolder}_pretrain.txt`,
      content: pretrain,
      mimeType: "text/plain",
    },
    {
      fileName: `${baseFolder}_train_sft.jsonl`,
      content: jsonl(sftRows),
      mimeType: "application/jsonl",
    },
    {
      fileName: `${baseFolder}_eval.jsonl`,
      content: jsonl(evalRows),
      mimeType: "application/jsonl",
    },
    {
      fileName: `${baseFolder}_dataset_manifest.json`,
      content: JSON.stringify(datasetManifest, null, 2),
      mimeType: "application/json",
    },
    {
      fileName: `${baseFolder}_safety_report.json`,
      content: JSON.stringify(safetyReport, null, 2),
      mimeType: "application/json",
    },
    {
      fileName: `${baseFolder}_license_manifest.json`,
      content: JSON.stringify(licenseManifest, null, 2),
      mimeType: "application/json",
    },
    {
      fileName: `${baseFolder}_README.md`,
      content: readme,
      mimeType: "text/markdown",
    },
  ];

  return { baseFolder, candidate, files };
}
