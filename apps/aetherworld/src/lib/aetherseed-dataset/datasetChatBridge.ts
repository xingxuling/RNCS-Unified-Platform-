// AetherSeed Dataset · Chat 桥
// 识别数据集相关意图，返回总览 / SFT 构建 / Lovable Prompt 导出 / MSL 评测建议。
import type { DatasetExportFormat, DatasetType, DatasetVersion } from "./datasetTypes";
import { DATASET_TYPE_LABEL } from "./datasetTypes";
import { listDatasetVersions } from "./datasetBuilder";
import {
  DATASET_SAFETY_ALLOWED,
  DATASET_SAFETY_FORBIDDEN,
} from "./datasetSafetyPolicy";
import { countTrainingSamples } from "./trainingSampleStore";
import { countEvalSamples } from "./evalSampleStore";
import { answerTokenQuestion } from "./datasetTokenChatBridge";

export type DatasetChatFocus =
  | "OVERVIEW"
  | "LIST"
  | "BUILD_SFT"
  | "EXPORT_LOVABLE_PROMPT"
  | "EVAL_MSL"
  | "DOWNLOAD"
  | "DOWNLOAD_PACKAGE"
  | "DOWNLOAD_MANIFEST"
  | "DOWNLOAD_SAFETY"
  | "SAFETY";

export interface ChatDatasetInfo {
  question: string;
  focus: DatasetChatFocus;
  focusLabel: string;
  summary: string;
  /** 当前内存中的样本计数（便于用户判断是否需要先去投喂） */
  counters: {
    trainingSamples: number;
    evalSamples: number;
    datasetVersions: number;
  };
  /** 列出最近的数据集版本（最多 8 条） */
  recentVersions: Pick<
    DatasetVersion,
    "id" | "name" | "version" | "datasetType" | "sampleCount" | "qualityScore" | "safetyStatus" | "createdAt"
  >[];
  /** 推荐导出格式 */
  recommendedExportFormats: DatasetExportFormat[];
  /** 推荐数据集类型（按意图） */
  recommendedDatasetType?: DatasetType;
  recommendedDatasetTypeLabel?: string;
  safetyAllowed: string[];
  safetyForbidden: string[];
  workbenchHint: string;
  /** 真实文件下载能力清单（仅描述，由用户在工作台触发）。 */
  downloadCapabilities: string[];
}

const TRIGGER_KEYWORDS = [
  "数据集", "训练集", "评测集", "eval set", "dataset",
  "导出 jsonl", "导出 chatml", "导出 alpaca", "导出 txt",
  "sft 数据集", "lovable prompt 数据集", "msl 评测",
  "把投喂", "把最近一次投喂", "做成数据集", "做成训练集", "构建数据集",
  "数据集版本", "数据集清单", "manifest",
  "下载数据集", "下载训练集", "下载评测集", "下载 manifest", "下载安全报告",
  "完整训练包", "训练包", "下载完整", "导出文件", "导出到本地",
];

export function detectDatasetIntent(raw: string): boolean {
  if (!raw) return false;
  const t = raw.toLowerCase();
  if (TRIGGER_KEYWORDS.some((k) => t.includes(k.toLowerCase()))) return true;
  // Token / 模型适配度类问题也归入数据集意图
  return /token|够训|够不够|样本条数|差多少|还差|300m|1b|适配度/.test(t);
}

function pickFocus(raw: string): DatasetChatFocus {
  const t = raw.toLowerCase();
  if (/完整训练包|整包|package|训练包/.test(t)) return "DOWNLOAD_PACKAGE";
  if (/安全报告|safety report|阻断报告|blocked/.test(t)) return "DOWNLOAD_SAFETY";
  if (/manifest|清单文件|dataset_manifest/.test(t)) return "DOWNLOAD_MANIFEST";
  if (/下载|导出.*文件|export.*file|生成.*文件|生成.*下载/.test(t)) return "DOWNLOAD";
  if (/msl.*评测|评测.*msl|eval.*msl/.test(t)) return "EVAL_MSL";
  if (/lovable prompt|lovable.*数据集|导出.*lovable/.test(t)) return "EXPORT_LOVABLE_PROMPT";
  if (/sft|做成.*训练集|做成.*数据集|把.*投喂.*数据集/.test(t)) return "BUILD_SFT";
  if (/有哪些|列表|清单|当前.*数据集|list/.test(t)) return "LIST";
  if (/安全|脱敏|禁止|阻断/.test(t)) return "SAFETY";
  return "OVERVIEW";
}

const FOCUS_LABEL: Record<DatasetChatFocus, string> = {
  OVERVIEW: "数据集总览",
  LIST: "数据集列表",
  BUILD_SFT: "构建 SFT 数据集",
  EXPORT_LOVABLE_PROMPT: "导出 Lovable Prompt 数据集",
  EVAL_MSL: "生成 MSL 评测集",
  DOWNLOAD: "真实文件下载",
  DOWNLOAD_PACKAGE: "完整训练包下载",
  DOWNLOAD_MANIFEST: "下载 Manifest",
  DOWNLOAD_SAFETY: "下载安全报告",
  SAFETY: "数据集安全策略",
};

function buildSummary(focus: DatasetChatFocus): string {
  switch (focus) {
    case "LIST":
      return "在 /system/datasets 可查看全部数据集版本、样本组成、安全状态与导出预览。";
    case "BUILD_SFT":
      return "把最近一次投喂结果在 /system/datasets 一键构建为 SFT 数据集（JSONL / ChatML / Alpaca 任选）。BLOCK 样本不会被纳入。";
    case "EXPORT_LOVABLE_PROMPT":
      return "针对 LOVABLE_PROMPT_JSON 输出，在 /system/datasets 选择 Lovable Prompt 类型构建版本并导出 JSONL。";
    case "EVAL_MSL":
      return "针对 MSL_HIT 评测候选，在 /system/datasets 构建 EVAL 数据集，导出 JSONL 用于 Router / MSL 复测。";
    case "DOWNLOAD":
      return "在 /system/datasets 的「真实文件下载」区可直接下载训练集 / 评测集 / Manifest / 安全报告（浏览器本地生成，不上传外部）。";
    case "DOWNLOAD_PACKAGE":
      return "在 /system/datasets 点「下载完整训练包」，会顺序下载 6 个文件：train / eval / manifest / readme / safety_report / blocked_summary。";
    case "DOWNLOAD_MANIFEST":
      return "在 /system/datasets 选择数据集后点「下载 dataset_manifest.json」即可拿到完整清单文件。";
    case "DOWNLOAD_SAFETY":
      return "在 /system/datasets 点「下载安全报告」可得到 safety_report.json 与 blocked_samples_summary.json（摘要不含原文）。";
    case "SAFETY":
      return "数据集严格遵守安全策略：BLOCK 样本永不导出，导出前二次扫描密钥 / Full60 / Founder-only 残留。";
    case "OVERVIEW":
    default:
      return "AetherSeed Dataset Builder：把投喂铸造炉的候选样本收编成正式可管理、可导出、可版本化的训练数据集，并支持浏览器真实文件下载。不真正训练、不自动上传外部。";
  }
}

function recommendedTypeFor(focus: DatasetChatFocus): DatasetType | undefined {
  switch (focus) {
    case "BUILD_SFT":
      return "SFT";
    case "EXPORT_LOVABLE_PROMPT":
      return "LOVABLE_PROMPT";
    case "EVAL_MSL":
      return "EVAL";
    default:
      return undefined;
  }
}

function recommendedFormats(focus: DatasetChatFocus): DatasetExportFormat[] {
  switch (focus) {
    case "BUILD_SFT":
    case "DOWNLOAD":
    case "DOWNLOAD_PACKAGE":
      return ["JSONL", "CHATML", "ALPACA"];
    case "EXPORT_LOVABLE_PROMPT":
      return ["JSONL"];
    case "EVAL_MSL":
      return ["JSONL"];
    case "DOWNLOAD_MANIFEST":
    case "DOWNLOAD_SAFETY":
      return [];
    default:
      return ["JSONL"];
  }
}

/** 下载能力清单（仅描述，不触发下载）。 */
export const DATASET_DOWNLOAD_CAPABILITIES = [
  "训练集 · TXT / JSONL / ChatML / Alpaca",
  "评测集 · eval.jsonl",
  "Manifest · dataset_manifest.json / eval_manifest.json",
  "安全报告 · safety_report.json",
  "阻断摘要 · blocked_samples_summary.json（仅摘要不含原文）",
  "完整训练包 · 多文件顺序下载（train / eval / manifest / readme / safety / blocked）",
];

export function buildChatDatasetInfo(raw: string): ChatDatasetInfo | undefined {
  if (!detectDatasetIntent(raw)) return undefined;
  const focus = pickFocus(raw);
  const versions = listDatasetVersions().slice(0, 8);
  const recommended = recommendedTypeFor(focus);

  // 附加 Token 与模型适配度摘要（数据集页能力镜像到 Chat）
  let tokenAppend = "";
  try {
    const tk = answerTokenQuestion(raw);
    tokenAppend = `\n\n[Token & 模型适配度] ${tk.summary}\n${tk.hints.join("\n")}`;
  } catch {
    tokenAppend = "";
  }

  return {
    question: raw,
    focus,
    focusLabel: FOCUS_LABEL[focus],
    summary: buildSummary(focus) + tokenAppend,
    counters: {
      trainingSamples: countTrainingSamples(),
      evalSamples: countEvalSamples(),
      datasetVersions: listDatasetVersions().length,
    },
    recentVersions: versions.map((v) => ({
      id: v.id,
      name: v.name,
      version: v.version,
      datasetType: v.datasetType,
      sampleCount: v.sampleCount,
      qualityScore: v.qualityScore,
      safetyStatus: v.safetyStatus,
      createdAt: v.createdAt,
    })),
    recommendedExportFormats: recommendedFormats(focus),
    recommendedDatasetType: recommended,
    recommendedDatasetTypeLabel: recommended ? DATASET_TYPE_LABEL[recommended] : undefined,
    safetyAllowed: DATASET_SAFETY_ALLOWED,
    safetyForbidden: DATASET_SAFETY_FORBIDDEN,
    workbenchHint: "打开 /system/datasets 完成构建 / 导出 / 真实下载 / 版本化（不真正训练）。",
    downloadCapabilities: DATASET_DOWNLOAD_CAPABILITIES,
  };
}
