// AetherSeed Dataset · README_dataset.md 构建器
import type { DatasetExportFormat, DatasetVersion } from "./datasetTypes";
import { DATASET_TYPE_LABEL } from "./datasetTypes";
import type { DownloadFile } from "./datasetBrowserDownload";
import { getPackageBaseName } from "./datasetDownloadBuilder";

export interface ReadmeContext {
  trainingExported: number;
  trainingBlocked: number;
  evalExported: number;
  evalBlocked: number;
  formats: DatasetExportFormat[];
}

export function buildDatasetReadme(version: DatasetVersion, ctx: ReadmeContext): string {
  const lines: string[] = [];
  lines.push(`# AetherSeed 数据集 · ${version.name}`);
  lines.push("");
  lines.push(`- 版本：\`${version.version}\``);
  lines.push(`- 类型：${DATASET_TYPE_LABEL[version.datasetType]}（${version.datasetType}）`);
  lines.push(`- 训练样本：${ctx.trainingExported} 条（已排除 BLOCK / 敏感 ${ctx.trainingBlocked} 条）`);
  lines.push(`- 评测样本：${ctx.evalExported} 条（已排除 ${ctx.evalBlocked} 条）`);
  lines.push(`- 默认导出格式：${ctx.formats.join(" / ")}`);
  lines.push(`- 安全状态：${version.safetyStatus}`);
  lines.push(`- 质量评分：${version.qualityScore}`);
  lines.push(`- 来源 Run：${version.sourceIntakeRunIds.join(", ") || "（未登记）"}`);
  lines.push(`- 导出时间：${new Date().toISOString()}`);
  lines.push("");
  lines.push("## 包内容");
  lines.push("- `train.jsonl`：训练样本（按选定格式）。");
  lines.push("- `eval.jsonl`：评测样本，可用于 Router / MSL 复测。");
  lines.push("- `dataset_manifest.json`：数据集清单与组成。");
  lines.push("- `safety_report.json`：导出前安全检查报告。");
  lines.push("- `blocked_samples_summary.json`：被阻断样本的摘要（不含原文）。");
  lines.push("");
  lines.push("## 用途建议");
  lines.push("- SFT 微调：搭配 ChatML / Alpaca 格式输入主流训练框架。");
  lines.push("- 路由与 MSL 评测：以 `eval.jsonl` 作为复测基准。");
  lines.push("- Lovable Prompt：用于 Prompt 蒸馏与重写数据集。");
  lines.push("");
  lines.push("## 安全说明");
  lines.push("- 本数据集不包含 BLOCK 样本，所有 WARN 样本均已脱敏。");
  lines.push("- 导出文件在浏览器本地生成，未上传任何外部服务。");
  lines.push("- 严禁导出密钥 / token / Full60 原始数列 / Founder-only 原文。");
  lines.push("- 本数据集仅供 Founder 单人慢速训练炉使用，请勿对外公开。");
  lines.push("");
  return lines.join("\n");
}

export function buildReadmeFile(version: DatasetVersion, ctx: ReadmeContext): DownloadFile {
  return {
    fileName: `${getPackageBaseName(version)}_README_dataset.md`,
    content: buildDatasetReadme(version, ctx),
    mimeType: "text/markdown",
  };
}
