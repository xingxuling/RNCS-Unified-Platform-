// 投喂铸造炉 · 运行时入口
// 把粘贴 / 文件 / 文件夹输入跑完完整流水线：抽取 → 脱敏 → 分类 → 切片 → 去重 → 编译 → 评测 → 任务建议。
// v0.1 吸收修正：额外生成 RawCorpusDocument + LongCorpusChunk + 吸收率报告。
import type {
  IntakeChunk,
  IntakeCompiledOutput,
  IntakeEvalItem,
  IntakeForgeRun,
  IntakeInputMode,
  IntakeItem,
  IntakeSourceType,
} from "./intakeForgeTypes";
import { nextIntakeId } from "./intakeForgeTypes";
import type {
  IntakeMode,
  LongCorpusChunk,
  RawCorpusDocument,
} from "./intakeAbsorptionTypes";
import { classifyIntakeSource } from "./intakeSourceClassifier";
import { extractTextFromFile, extractTextFromPaste } from "./intakeTextExtractor";
import { sanitizeIntakeText } from "./intakeSanitizer";
import { chunkIntakeText } from "./intakeChunker";
import { dedupeChunks } from "./intakeDeduplicator";
import { compileIntakeOutputs } from "./intakeSampleCompiler";
import { generateEvalItems } from "./intakeEvalGenerator";
import { suggestTrainingTasks } from "./intakeTrainingTaskPlanner";
import { processFileBatch } from "./intakeFolderProcessor";
import { INTAKE_MAX_TOTAL_TEXT_CHARS } from "./intakeSafetyPolicy";
import { buildRawCorpusDocument, buildLongCorpusChunks } from "./intakeLongCorpus";
import { buildAbsorptionReport } from "./intakeAbsorption";

interface ProcessedItemResult {
  item: IntakeItem;
  chunks: IntakeChunk[];
  outputs: IntakeCompiledOutput[];
  evals: IntakeEvalItem[];
  rawDoc: RawCorpusDocument;
}

/** 把 IntakeSourceType + inputMode 映射为 RawCorpusDocument 的来源类型 */
function rawSourceType(
  inputMode: IntakeInputMode,
  sourceType: IntakeSourceType,
): RawCorpusDocument["sourceType"] {
  if (sourceType === "CHATGPT_COMPRESSED_EXPORT" || sourceType === "CHATGPT_CONVERSATION") {
    return "CHAT_EXPORT";
  }
  if (sourceType === "LOVABLE_PROMPT" || sourceType === "LOVABLE_RESULT") {
    return "LOVABLE_REPORT";
  }
  if (
    sourceType === "AETHERWORLD_INTERNAL_DOC" ||
    sourceType === "README_DOC" ||
    sourceType === "OPEN_ARCHITECTURE_DOC" ||
    sourceType === "BUG_AUDIT" ||
    sourceType === "RECORD_CENTER_EXPORT" ||
    sourceType === "MSL_STATE"
  ) {
    return "SYSTEM_DOC";
  }
  if (sourceType === "WORLD_CREATIVE" || sourceType === "GENERAL_TEXT") {
    return "LONG_TEXT";
  }
  if (inputMode === "FOLDER") return "FOLDER";
  if (inputMode === "FILE") return "FILE";
  return "PASTE";
}

async function processOnePasted(
  raw: string,
  runId: string,
): Promise<ProcessedItemResult> {
  const id = nextIntakeId("IFI");
  const extracted = extractTextFromPaste(raw);
  const san = sanitizeIntakeText(extracted.text);
  const cls = classifyIntakeSource({ inputMode: "PASTE", text: san.sanitizedText });
  const chunks = chunkIntakeText({
    intakeItemId: id,
    sanitizedText: san.sanitizedText,
    sourceType: cls.sourceType,
  });
  const dedup = dedupeChunks(chunks);
  const outputs = compileIntakeOutputs({
    intakeItemId: id,
    sourceType: cls.sourceType,
    chunks: dedup.kept,
  });
  const evals = generateEvalItems({
    intakeItemId: id,
    sourceType: cls.sourceType,
    chunks: dedup.kept,
  });

  const rawDoc = buildRawCorpusDocument({
    intakeRunId: runId,
    intakeItemId: id,
    sourceName: `粘贴 ${id}`,
    sourceType: rawSourceType("PASTE", cls.sourceType),
    sanitizedText: san.sanitizedText,
    safetyStatus: san.safetyStatus,
    language: extracted.detectedLanguage,
  });

  const item: IntakeItem = {
    id,
    inputMode: "PASTE",
    sourceType: cls.sourceType,
    extractedTextLength: extracted.text.length,
    detectedLanguage: extracted.detectedLanguage,
    safetyStatus: san.safetyStatus,
    processingStatus: san.safetyStatus === "BLOCK" ? "FAILED" : "EVAL_CREATED",
    tags: [cls.sourceType, `conf-${cls.confidence}`],
    createdAt: new Date().toISOString(),
    preview: san.sanitizedText.slice(0, 200),
    notes: [
      `分类：${cls.sourceType}（信心 ${cls.confidence}）`,
      cls.rationale,
      ...san.notes,
      dedup.removed > 0 ? `去重移除 ${dedup.removed} 条` : "",
    ].filter(Boolean) as string[],
  };
  return { item, chunks: dedup.kept, outputs, evals, rawDoc };
}

async function processOneFile(
  file: File,
  runId: string,
): Promise<ProcessedItemResult> {
  const id = nextIntakeId("IFI");
  const extracted = await extractTextFromFile(file);
  const san = sanitizeIntakeText(extracted.text);
  const cls = classifyIntakeSource({
    inputMode: "FILE",
    text: san.sanitizedText,
    fileName: file.name,
  });
  const chunks = chunkIntakeText({
    intakeItemId: id,
    sanitizedText: san.sanitizedText,
    sourceType: cls.sourceType,
  });
  const dedup = dedupeChunks(chunks);
  const outputs = compileIntakeOutputs({
    intakeItemId: id,
    sourceType: cls.sourceType,
    chunks: dedup.kept,
  });
  const evals = generateEvalItems({
    intakeItemId: id,
    sourceType: cls.sourceType,
    chunks: dedup.kept,
  });

  const rawDoc = buildRawCorpusDocument({
    intakeRunId: runId,
    intakeItemId: id,
    sourceName: file.name,
    sourceType: rawSourceType("FILE", cls.sourceType),
    sanitizedText: san.sanitizedText,
    safetyStatus: san.safetyStatus,
    language: extracted.detectedLanguage,
  });

  const item: IntakeItem = {
    id,
    inputMode: "FILE",
    sourceType: cls.sourceType,
    originalName: file.name,
    estimatedSizeMb: Number((file.size / 1024 / 1024).toFixed(2)),
    extractedTextLength: extracted.text.length,
    detectedLanguage: extracted.detectedLanguage,
    safetyStatus: san.safetyStatus,
    processingStatus: san.safetyStatus === "BLOCK" ? "FAILED" : "EVAL_CREATED",
    tags: [cls.sourceType, file.name],
    createdAt: new Date().toISOString(),
    preview: san.sanitizedText.slice(0, 200),
    notes: [
      `分类：${cls.sourceType}（信心 ${cls.confidence}）`,
      cls.rationale,
      ...extracted.notes,
      ...san.notes,
      dedup.removed > 0 ? `去重移除 ${dedup.removed} 条` : "",
    ].filter(Boolean) as string[],
  };
  return { item, chunks: dedup.kept, outputs, evals, rawDoc };
}

function aggregateRun(
  inputMode: IntakeInputMode,
  results: ProcessedItemResult[],
  runId: string,
  intakeMode: IntakeMode,
  extraWarnings: string[] = [],
): IntakeForgeRun {
  const items = results.map((r) => r.item);
  const chunks = results.flatMap((r) => r.chunks);
  const outputs = results.flatMap((r) => r.outputs);
  const evals = results.flatMap((r) => r.evals);
  const rawDocuments = results.map((r) => r.rawDoc);

  // 生成长 / 中语料切片
  const longChunks: LongCorpusChunk[] = rawDocuments.flatMap((rd) =>
    buildLongCorpusChunks({ rawDoc: rd, intakeRunId: runId, mode: intakeMode }),
  );

  const blockedCount = items.filter((i) => i.safetyStatus === "BLOCK").length;
  const sourceTypes = items.map((i) => i.sourceType);
  const totalSamples = outputs.reduce((s, o) => s + o.sampleCount, 0);
  const suggestedTrainingTasks = suggestTrainingTasks({
    inputMode,
    sourceTypes,
    totalSamples,
  });
  const averageQuality =
    chunks.length === 0
      ? 0
      : Number((chunks.reduce((s, c) => s + c.qualityScore, 0) / chunks.length).toFixed(2));

  // 吸收报告
  const absorption = buildAbsorptionReport({
    mode: intakeMode,
    rawDocuments,
    longChunks,
    shortChunks: chunks,
    outputs,
    evals,
  });

  const warnings: string[] = [...extraWarnings];
  if (blockedCount > 0) warnings.push(`${blockedCount} 个条目因安全策略被阻断。`);
  const warned = items.filter((i) => i.safetyStatus === "WARN").length;
  if (warned > 0) warnings.push(`${warned} 个条目命中脱敏规则（已替换敏感片段）。`);
  warnings.push(...absorption.warnings);

  return {
    id: runId,
    inputMode,
    itemCount: items.length,
    chunkCount: chunks.length,
    compiledOutputCount: outputs.length,
    evalItemCount: evals.length,
    blockedCount,
    warnings,
    suggestedTrainingTasks,
    createdAt: new Date().toISOString(),
    items,
    chunks,
    outputs,
    evals,
    averageQuality,
    intakeMode,
    rawDocuments,
    longChunks,
    absorption,
  };
}

/** 粘贴：单段长文本 → 单条 IntakeItem */
export async function runIntakeFromPaste(
  rawText: string,
  intakeMode: IntakeMode = "HYBRID",
): Promise<IntakeForgeRun> {
  const runId = nextIntakeId("IFR");
  const warnings: string[] = [];
  let text = rawText ?? "";
  if (text.length > INTAKE_MAX_TOTAL_TEXT_CHARS) {
    warnings.push(`粘贴文本超过 ${INTAKE_MAX_TOTAL_TEXT_CHARS} 字符上限，已截断。`);
    text = text.slice(0, INTAKE_MAX_TOTAL_TEXT_CHARS);
  }
  if (!text.trim()) {
    return aggregateRun("PASTE", [], runId, intakeMode, ["粘贴内容为空。"]);
  }
  const result = await processOnePasted(text, runId);
  return aggregateRun("PASTE", [result], runId, intakeMode, warnings);
}

/** 文件 / 文件夹批量：FileList | File[] → 多条 IntakeItem */
export async function runIntakeFromFiles(
  files: FileList | File[],
  inputMode: IntakeInputMode = "FILE",
  intakeMode: IntakeMode = "HYBRID",
): Promise<IntakeForgeRun> {
  const runId = nextIntakeId("IFR");
  const filter = processFileBatch(files);
  const results: ProcessedItemResult[] = [];
  let totalChars = 0;
  for (const f of filter.accepted) {
    const r = await processOneFile(f, runId);
    totalChars += r.item.extractedTextLength ?? 0;
    results.push(r);
    if (totalChars > INTAKE_MAX_TOTAL_TEXT_CHARS) {
      filter.notes.push(`累计文本超过 ${INTAKE_MAX_TOTAL_TEXT_CHARS} 字符上限，已提前停止处理。`);
      break;
    }
  }
  return aggregateRun(inputMode, results, runId, intakeMode, filter.notes);
}

/**
 * 大规模文件夹投喂 · 单 batch 处理
 * 跳过 processFileBatch 的 500 上限与 4M 字符上限，调用方（folderIntakeRunner）
 * 负责分批与总量控制。每个 batch 仍走完整流水线：识别 → 脱敏 → 切片 → 样本 → 评测 → RawCorpus。
 */
export async function runIntakeBatch(
  files: File[],
  intakeMode: IntakeMode = "HYBRID",
): Promise<IntakeForgeRun> {
  const runId = nextIntakeId("IFR");
  const results: ProcessedItemResult[] = [];
  const warnings: string[] = [];
  for (const f of files) {
    try {
      const r = await processOneFile(f, runId);
      results.push(r);
    } catch (e) {
      warnings.push(`处理失败：${f.name} — ${(e as Error).message}`);
    }
  }
  return aggregateRun("FOLDER", results, runId, intakeMode, warnings);
}

/** 摘要：给 Chat / Workspace 使用 */
export function summarizeRun(run: IntakeForgeRun): string {
  const modeLabel: Record<IntakeInputMode, string> = {
    PASTE: "粘贴",
    FILE: "文件",
    FOLDER: "文件夹",
  };
  const ab = run.absorption;
  const absorbPart = ab
    ? ` / 原始 ${ab.rawTokens} token / 吸收率 ${Math.round(ab.absorptionRate * 100)}% / 长语料 ${ab.longCorpusTokens} token`
    : "";
  return (
    `投喂铸造炉 · ${modeLabel[run.inputMode]} · ${run.itemCount} 条条目 / ${run.chunkCount} 切片 / ` +
    `${run.compiledOutputCount} 组输出 / ${run.evalItemCount} 评测候选 / 阻断 ${run.blockedCount} 条 / ` +
    `平均质量 ${run.averageQuality}${absorbPart}。`
  );
}
