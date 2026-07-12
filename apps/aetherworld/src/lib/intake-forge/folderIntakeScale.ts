// 大规模文件夹投喂 · 模式、危险目录/文件、运行状态、Store、Runner
// 设计原则：
// - 不一次性读取 10 万文件内容；分阶段：INDEXING → FILTERING → PLANNING → PROCESSING
// - 每个 batch 走 runIntakeBatch（受 IntakeMode 控制吸收策略）后再 materialAutoSinkIntakeRun
// - 支持暂停 / 继续 / 取消 / 失败重试
// - 仅浏览器环境（webkitdirectory）；本地网关大文件夹接口预留

import { runIntakeBatch } from "./intakeForgeRuntime";
import type { IntakeMode } from "./intakeAbsorptionTypes";
import { materialAutoSinkIntakeRun } from "@/lib/aetherseed-dataset/materialAutoSink";
import type { MaterialAutoSinkResult } from "@/lib/aetherseed-dataset/materialAutoSinkTypes";

// ============================================================
// 模式
// ============================================================

export type FolderIntakeScaleMode = "NORMAL" | "LARGE_CORPUS" | "FOUNDER_LOCAL";

export interface FolderIntakeScaleLimits {
  maxFiles: number;
  maxTotalChars: number;
  maxSingleFileBytes: number;
  batchSize: number;
  maxDirectoryDepth: number;
  allowPauseResume: boolean;
  requireLocalGatewayRecommended: boolean;
  defaultAbsorptionMode: IntakeMode;
}

export const FOLDER_INTAKE_SCALE_PRESETS: Record<FolderIntakeScaleMode, FolderIntakeScaleLimits> = {
  NORMAL: {
    maxFiles: 1_000,
    maxTotalChars: 10_000_000,
    maxSingleFileBytes: 10 * 1024 * 1024,
    batchSize: 100,
    maxDirectoryDepth: 8,
    allowPauseResume: false,
    requireLocalGatewayRecommended: false,
    defaultAbsorptionMode: "HYBRID",
  },
  LARGE_CORPUS: {
    maxFiles: 100_000,
    maxTotalChars: 500_000_000,
    maxSingleFileBytes: 100 * 1024 * 1024,
    batchSize: 500,
    maxDirectoryDepth: 20,
    allowPauseResume: true,
    requireLocalGatewayRecommended: false,
    defaultAbsorptionMode: "HYBRID",
  },
  FOUNDER_LOCAL: {
    maxFiles: 500_000,
    maxTotalChars: 2_000_000_000,
    maxSingleFileBytes: 500 * 1024 * 1024,
    batchSize: 1_000,
    maxDirectoryDepth: 50,
    allowPauseResume: true,
    requireLocalGatewayRecommended: true,
    defaultAbsorptionMode: "FULL_ABSORB",
  },
};

export const FOLDER_SCALE_LABEL: Record<FolderIntakeScaleMode, string> = {
  NORMAL: "普通文件夹",
  LARGE_CORPUS: "大语料文件夹",
  FOUNDER_LOCAL: "创始人本地大语料",
};

export const FOLDER_SCALE_DESC: Record<FolderIntakeScaleMode, string> = {
  NORMAL: "小文件夹测试，最多 1,000 文件 / 10M 字符。",
  LARGE_CORPUS: "大型文档库 / 代码库 / 语料库，最多 100,000 文件 / 500M 字符。",
  FOUNDER_LOCAL: "创始人本机大规模材料工厂，最多 500,000 文件 / 20 亿字符。建议本地网关协同。",
};

// ============================================================
// 危险目录 / 危险文件名 / 阻断后缀
// ============================================================

export const DANGER_DIRECTORIES = [
  "node_modules", ".git", ".next", "dist", "build", "target",
  ".venv", "venv", "__pycache__", ".cache", ".idea", ".vscode",
  "coverage", "tmp", "temp", "AppData", "Windows", "Program Files",
];

export const BLOCKED_FILENAMES = [
  ".env", "id_rsa", "id_ed25519", "credentials",
  "secrets", "private_key", "wallet", "keystore",
];

export const BLOCKED_EXTENSIONS = [
  ".key", ".pem", ".p12", ".pfx",
  ".exe", ".dll", ".so", ".dylib", ".msi", ".apk", ".ipa",
];

export const SUPPORTED_EXTENSIONS = [
  // 文本
  ".txt", ".md", ".markdown", ".rtf",
  // 文档
  ".docx", ".pdf", ".html", ".htm",
  // 数据
  ".json", ".jsonl", ".csv", ".tsv", ".yaml", ".yml", ".xml",
  // 代码
  ".ts", ".tsx", ".js", ".jsx", ".py", ".java", ".kt", ".swift",
  ".go", ".rs", ".cpp", ".c", ".cs", ".php", ".rb", ".sql",
  ".sh", ".ps1", ".ejs", ".css", ".scss",
  // 日志
  ".log", ".out", ".err",
  // 图片
  ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg",
  // 音频
  ".mp3", ".wav", ".m4a", ".flac", ".ogg",
  // 视频
  ".mp4", ".mov", ".webm", ".mkv",
  // 压缩包（第一阶段只登记不解包）
  ".zip", ".tar", ".gz", ".7z",
];

function lowerExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

function pathSegments(path: string): string[] {
  return path.split(/[\\/]+/).filter(Boolean);
}

export type FileEligibility = "ELIGIBLE" | "SKIPPED" | "BLOCKED";

export interface FileIndexEntry {
  path: string;             // webkitRelativePath
  name: string;
  ext: string;
  size: number;
  depth: number;
  eligibility: FileEligibility;
  reason?: string;
  status: "PENDING" | "PROCESSED" | "FAILED" | "SKIPPED";
  errorMessage?: string;
  /** 原始 File 引用（仅内存，运行结束应清空避免占用） */
  fileRef?: File;
}

export function classifyFile(file: File, mode: FolderIntakeScaleMode): FileIndexEntry {
  const relative = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
  const segs = pathSegments(relative);
  const depth = Math.max(0, segs.length - 1);
  const name = file.name;
  const ext = lowerExt(name);
  const limits = FOLDER_INTAKE_SCALE_PRESETS[mode];

  const base: Omit<FileIndexEntry, "eligibility" | "reason"> = {
    path: relative,
    name,
    ext,
    size: file.size,
    depth,
    status: "PENDING",
    fileRef: file,
  };

  // 阻断：危险文件名
  const lowerName = name.toLowerCase();
  if (BLOCKED_FILENAMES.some((n) => lowerName === n || lowerName.endsWith(`/${n}`))) {
    return { ...base, eligibility: "BLOCKED", reason: "敏感文件名（密钥 / 凭据）", status: "SKIPPED" };
  }
  // 阻断：危险后缀
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return { ...base, eligibility: "BLOCKED", reason: `阻断后缀 ${ext}`, status: "SKIPPED" };
  }
  // 跳过：危险目录
  const dirHit = segs.slice(0, -1).find((s) => DANGER_DIRECTORIES.includes(s));
  if (dirHit) {
    return { ...base, eligibility: "SKIPPED", reason: `危险目录 ${dirHit}`, status: "SKIPPED" };
  }
  // 跳过：深度超限
  if (depth > limits.maxDirectoryDepth) {
    return { ...base, eligibility: "SKIPPED", reason: `目录深度 ${depth} 超过 ${limits.maxDirectoryDepth}`, status: "SKIPPED" };
  }
  // 跳过：单文件超大
  if (file.size > limits.maxSingleFileBytes) {
    return { ...base, eligibility: "SKIPPED", reason: `单文件 ${(file.size / 1024 / 1024).toFixed(1)}MB 超过上限`, status: "SKIPPED" };
  }
  // 跳过：不支持后缀
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    return { ...base, eligibility: "SKIPPED", reason: `不支持的后缀 ${ext || "(无)"}`, status: "SKIPPED" };
  }
  return { ...base, eligibility: "ELIGIBLE" };
}

// ============================================================
// MassiveFolderIntakeRun
// ============================================================

export type MassiveFolderIntakeStatus =
  | "INDEXING"
  | "FILTERING"
  | "PLANNING"
  | "PROCESSING"
  | "PAUSED"
  | "COMPLETED"
  | "PARTIAL"
  | "FAILED";

export interface BatchProgressDetail {
  batchIndex: number;
  fileCount: number;
  rawDocumentsCreated: number;
  longChunksCreated: number;
  mediumSamplesCreated: number;
  shortSamplesCreated: number;
  evalSamplesCreated: number;
  rawTokens: number;
  absorbedTokens: number;
  absorptionRate: number;
  startedAt: string;
  endedAt?: string;
  error?: string;
}

export interface MassiveFolderIntakeRun {
  id: string;
  mode: FolderIntakeScaleMode;
  absorptionMode: IntakeMode;
  folderName: string;

  totalFiles: number;
  indexedFiles: number;
  eligibleFiles: number;
  skippedFiles: number;
  blockedFiles: number;
  processedFiles: number;
  failedFiles: number;

  totalCharsEstimate: number;
  totalTokenEstimate: number;
  absorbedTokenEstimate: number;

  batchSize: number;
  batchCount: number;
  completedBatchCount: number;

  status: MassiveFolderIntakeStatus;
  message?: string;
  createdAt: string;
  updatedAt: string;

  batchHistory: BatchProgressDetail[];
  fullCorpusCandidateId?: string;
}

// ============================================================
// Store（内存版；订阅 + 单例 currentRun）
// ============================================================

let currentRun: MassiveFolderIntakeRun | null = null;
let fileIndex: FileIndexEntry[] = [];
const listeners = new Set<() => void>();
let nextSeq = 1;

function emit() {
  for (const l of listeners) {
    try { l(); } catch { /* ignore */ }
  }
}

export function subscribeFolderRun(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getCurrentFolderRun(): MassiveFolderIntakeRun | null {
  return currentRun;
}

export function getFolderFileIndex(): FileIndexEntry[] {
  return fileIndex;
}

// ============================================================
// 控制信号
// ============================================================

let pauseRequested = false;
let cancelRequested = false;

export function pauseFolderRun() {
  pauseRequested = true;
  if (currentRun && currentRun.status === "PROCESSING") {
    currentRun = { ...currentRun, status: "PAUSED", message: "已请求暂停，当前 batch 结束后停止。", updatedAt: new Date().toISOString() };
    emit();
  }
}

export function cancelFolderRun() {
  cancelRequested = true;
  pauseRequested = true;
  if (currentRun && currentRun.status !== "COMPLETED" && currentRun.status !== "FAILED") {
    currentRun = { ...currentRun, status: "PARTIAL", message: "已取消。", updatedAt: new Date().toISOString() };
    emit();
  }
}

// ============================================================
// 索引 + 过滤
// ============================================================

export interface IndexFolderOptions {
  files: FileList | File[];
  mode: FolderIntakeScaleMode;
  absorptionMode?: IntakeMode;
  folderName?: string;
}

export function indexFolder(opts: IndexFolderOptions): MassiveFolderIntakeRun {
  pauseRequested = false;
  cancelRequested = false;
  const limits = FOLDER_INTAKE_SCALE_PRESETS[opts.mode];
  const arr = Array.from(opts.files);
  const totalFiles = arr.length;
  const folderName = opts.folderName
    || (arr[0]
      ? (((arr[0] as File & { webkitRelativePath?: string }).webkitRelativePath || arr[0].name).split(/[\\/]/)[0])
      : "未命名文件夹");

  // INDEXING：仅读取元数据
  const indexed: FileIndexEntry[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (i >= limits.maxFiles) {
      // 超出模式上限，剩余文件不索引（标记为跳过）
      indexed.push({
        path: ((arr[i] as File & { webkitRelativePath?: string }).webkitRelativePath || arr[i].name),
        name: arr[i].name,
        ext: lowerExt(arr[i].name),
        size: arr[i].size,
        depth: 0,
        eligibility: "SKIPPED",
        reason: `超出模式上限 ${limits.maxFiles}`,
        status: "SKIPPED",
      });
      continue;
    }
    indexed.push(classifyFile(arr[i], opts.mode));
  }

  const eligible = indexed.filter((f) => f.eligibility === "ELIGIBLE");
  const skipped = indexed.filter((f) => f.eligibility === "SKIPPED").length;
  const blocked = indexed.filter((f) => f.eligibility === "BLOCKED").length;
  const totalCharsEstimate = eligible.reduce((acc, f) => acc + Math.min(f.size, 2 * 1024 * 1024), 0);
  const batchSize = limits.batchSize;
  const batchCount = Math.ceil(eligible.length / batchSize);
  const absorption = opts.absorptionMode ?? limits.defaultAbsorptionMode;

  fileIndex = indexed;
  currentRun = {
    id: `MFI-${Date.now()}-${nextSeq++}`,
    mode: opts.mode,
    absorptionMode: absorption,
    folderName,
    totalFiles,
    indexedFiles: indexed.length,
    eligibleFiles: eligible.length,
    skippedFiles: skipped,
    blockedFiles: blocked,
    processedFiles: 0,
    failedFiles: 0,
    totalCharsEstimate,
    totalTokenEstimate: Math.round(totalCharsEstimate / 4),
    absorbedTokenEstimate: 0,
    batchSize,
    batchCount,
    completedBatchCount: 0,
    status: "PLANNING",
    message: `索引完成：${totalFiles} 文件，${eligible.length} 可处理 / ${skipped} 跳过 / ${blocked} 阻断 / ${batchCount} batch。`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    batchHistory: [],
  };
  emit();
  return currentRun;
}

// ============================================================
// 批处理执行
// ============================================================

function asyncTick(ms = 0): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

function applyBatchToRun(run: MassiveFolderIntakeRun, detail: BatchProgressDetail, processed: number, failed: number): MassiveFolderIntakeRun {
  return {
    ...run,
    processedFiles: run.processedFiles + processed,
    failedFiles: run.failedFiles + failed,
    completedBatchCount: run.completedBatchCount + 1,
    absorbedTokenEstimate: run.absorbedTokenEstimate + detail.absorbedTokens,
    batchHistory: [...run.batchHistory, detail],
    updatedAt: new Date().toISOString(),
  };
}

function summarizeMaterialSink(ms: MaterialAutoSinkResult): {
  raw: number; long: number; medium: number; short: number; evals: number;
  rawTokens: number; absorbedTokens: number; absorptionRate: number;
} {
  return {
    raw: ms.rawDocumentsCreated,
    long: ms.longChunksCreated,
    medium: ms.mediumSamplesCreated,
    short: ms.shortSamplesCreated,
    evals: ms.evalSamplesCreated ?? 0,
    rawTokens: ms.rawTokens ?? 0,
    absorbedTokens: ms.absorbedTokens ?? 0,
    absorptionRate: ms.absorptionRate ?? 0,
  };
}

/** 处理所有待处理 batch；可通过 pauseFolderRun / cancelFolderRun 中断。 */
export async function processAllBatches(): Promise<MassiveFolderIntakeRun | null> {
  if (!currentRun) return null;
  pauseRequested = false;
  cancelRequested = false;
  currentRun = { ...currentRun, status: "PROCESSING", message: "开始按 batch 处理…", updatedAt: new Date().toISOString() };
  emit();

  const eligible = fileIndex.filter((f) => f.eligibility === "ELIGIBLE" && f.status === "PENDING");
  const batchSize = currentRun.batchSize;
  let i = 0;

  while (i < eligible.length) {
    if (cancelRequested) {
      currentRun = { ...currentRun, status: "PARTIAL", message: "已取消。", updatedAt: new Date().toISOString() };
      emit();
      return currentRun;
    }
    if (pauseRequested) {
      currentRun = { ...currentRun, status: "PAUSED", message: "已暂停。可点击「继续」恢复。", updatedAt: new Date().toISOString() };
      emit();
      return currentRun;
    }

    const batch = eligible.slice(i, i + batchSize);
    const files = batch.map((b) => b.fileRef).filter((f): f is File => !!f);
    const batchIndex = currentRun.completedBatchCount;
    const startedAt = new Date().toISOString();

    let detail: BatchProgressDetail = {
      batchIndex,
      fileCount: files.length,
      rawDocumentsCreated: 0,
      longChunksCreated: 0,
      mediumSamplesCreated: 0,
      shortSamplesCreated: 0,
      evalSamplesCreated: 0,
      rawTokens: 0,
      absorbedTokens: 0,
      absorptionRate: 0,
      startedAt,
    };
    let processed = 0;
    let failed = 0;
    let lastCandidate: string | undefined;

    try {
      const intakeRun = await runIntakeBatch(files, currentRun.absorptionMode);
      const ms = materialAutoSinkIntakeRun(intakeRun);
      const sum = summarizeMaterialSink(ms);
      detail = {
        ...detail,
        ...sum,
        rawDocumentsCreated: sum.raw,
        longChunksCreated: sum.long,
        mediumSamplesCreated: sum.medium,
        shortSamplesCreated: sum.short,
        evalSamplesCreated: sum.evals,
        endedAt: new Date().toISOString(),
      };
      lastCandidate = ms.fullCorpusCandidateId;
      // 标记文件状态
      for (const b of batch) {
        b.status = "PROCESSED";
        b.fileRef = undefined; // 释放内存
      }
      processed = files.length;
    } catch (e) {
      detail.error = (e as Error).message;
      detail.endedAt = new Date().toISOString();
      for (const b of batch) {
        b.status = "FAILED";
        b.errorMessage = (e as Error).message;
        b.fileRef = undefined;
      }
      failed = files.length;
    }

    currentRun = applyBatchToRun(currentRun, detail, processed, failed);
    if (lastCandidate) currentRun.fullCorpusCandidateId = lastCandidate;
    emit();
    i += batchSize;
    await asyncTick(0); // 让出主线程，避免冻结 UI
  }

  const finalStatus: MassiveFolderIntakeStatus =
    currentRun.failedFiles > 0
      ? (currentRun.processedFiles > 0 ? "PARTIAL" : "FAILED")
      : "COMPLETED";
  currentRun = {
    ...currentRun,
    status: finalStatus,
    message:
      finalStatus === "COMPLETED"
        ? `已完成：处理 ${currentRun.processedFiles} 文件 / 吸收 ${currentRun.absorbedTokenEstimate} token。`
        : finalStatus === "PARTIAL"
        ? `部分完成：成功 ${currentRun.processedFiles} / 失败 ${currentRun.failedFiles}。`
        : "全部失败。",
    updatedAt: new Date().toISOString(),
  };
  emit();
  return currentRun;
}

/** 重新处理失败的文件（保留索引、清失败状态） */
export async function retryFailedBatches(): Promise<MassiveFolderIntakeRun | null> {
  if (!currentRun) return null;
  // 注意：fileRef 已释放，无法再读 — 提示用户重新选择文件夹
  const stillFailed = fileIndex.filter((f) => f.status === "FAILED");
  if (stillFailed.length === 0) {
    currentRun = { ...currentRun, message: "没有失败文件需要重试。", updatedAt: new Date().toISOString() };
    emit();
    return currentRun;
  }
  const hasRefs = stillFailed.some((f) => f.fileRef);
  if (!hasRefs) {
    currentRun = {
      ...currentRun,
      message: "失败文件的句柄已释放，请重新选择文件夹后再重试。",
      updatedAt: new Date().toISOString(),
    };
    emit();
    return currentRun;
  }
  for (const f of stillFailed) f.status = "PENDING";
  return processAllBatches();
}
