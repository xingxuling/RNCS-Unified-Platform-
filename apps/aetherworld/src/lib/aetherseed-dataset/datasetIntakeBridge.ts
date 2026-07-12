// AetherSeed Dataset · Intake 桥
// 把 IntakeForgeRun 的候选输出转换成 TrainingSample / EvalSample，并落入内存存储。
import type {
  IntakeCompiledOutput,
  IntakeCompiledOutputType,
  IntakeEvalItem,
  IntakeForgeRun,
  IntakeItem,
} from "@/lib/intake-forge/intakeForgeTypes";
import { INTAKE_SAMPLE_LABEL, INTAKE_SOURCE_LABEL } from "@/lib/intake-forge/intakeForgeTypes";
import type {
  DatasetType,
  EvalSample,
  SampleDifficulty,
  TrainingSample,
} from "./datasetTypes";
import { nextDatasetId } from "./datasetTypes";
import { putEvalSamples } from "./evalSampleStore";
import { putTrainingSamples } from "./trainingSampleStore";
import { containsResidualSensitive } from "./datasetSafetyPolicy";

/** 输出类型 → 数据集类型 */
export function mapOutputTypeToDatasetType(t: IntakeCompiledOutputType): DatasetType {
  switch (t) {
    case "PRETRAIN_TEXT":
      return "PRETRAIN";
    case "SFT_JSONL":
    case "CHATML":
    case "ALPACA":
      return "SFT";
    case "ROUTER_JSON":
      return "ROUTER";
    case "MSL_JSON":
      return "MSL";
    case "TOOL_CALLING_JSON":
      return "TOOL_CALLING";
    case "LOVABLE_PROMPT_JSON":
      return "LOVABLE_PROMPT";
    case "EVAL_JSON":
      return "EVAL";
    case "WORKSPACE_OBJECT":
    default:
      return "MIXED";
  }
}

function buildInstruction(item: IntakeItem, output: IntakeCompiledOutput, idx: number): string {
  const src = INTAKE_SOURCE_LABEL[item.sourceType] ?? item.sourceType;
  return `基于「${src}」生成 ${output.format} 候选样本 #${idx + 1}（来源条目 ${item.id}）。`;
}

function chunkIdsForOutput(item: IntakeItem, run: IntakeForgeRun): string[] {
  return run.chunks.filter((c) => c.intakeItemId === item.id).map((c) => c.id);
}

function decideSafety(text: string, base: "PASS" | "WARN" | "BLOCK"): "PASS" | "WARN" | "BLOCK" {
  if (base === "BLOCK") return "BLOCK";
  if (containsResidualSensitive(text)) return "BLOCK";
  return base;
}

/** 把 IntakeForgeRun 转换为 TrainingSample 列表（不入库）。 */
export function buildTrainingSamplesFromRun(run: IntakeForgeRun): TrainingSample[] {
  const list: TrainingSample[] = [];
  for (const output of run.outputs) {
    const item = run.items.find((i) => i.id === output.intakeItemId);
    if (!item) continue;
    const chunkIds = chunkIdsForOutput(item, run);
    const tagsBase = [
      INTAKE_SOURCE_LABEL[item.sourceType] ?? item.sourceType,
      output.outputType,
      mapOutputTypeToDatasetType(output.outputType),
    ];

    // 用 samplePreviews 中的每条 preview 作为一条候选；空则按 sampleCount 补
    const previews =
      output.samplePreviews.length > 0
        ? output.samplePreviews
        : Array.from({ length: Math.min(output.sampleCount, 3) }, () => "");

    previews.forEach((preview, idx) => {
      const previewText = preview ?? "";
      const safety = decideSafety(previewText, output.safetyStatus);
      list.push({
        id: nextDatasetId("TSP"),
        sampleType: output.outputType,
        instruction: buildInstruction(item, output, idx),
        input: undefined,
        output: previewText || `[候选样本占位 #${idx + 1}]`,
        sourceIntakeItemId: item.id,
        sourceChunkIds: chunkIds,
        qualityScore: output.qualityScore,
        safetyStatus: safety,
        tags: tagsBase,
        createdAt: new Date().toISOString(),
      });
    });
  }
  return list;
}

function mapEvalDifficulty(evalType: IntakeEvalItem["evalType"]): SampleDifficulty {
  switch (evalType) {
    case "FORMAT_VALID":
    case "INTENT_HIT":
      return "EASY";
    case "ROUTER_HIT":
    case "MSL_HIT":
      return "MEDIUM";
    case "WORLD_CONSISTENCY":
      return "HARD";
    default:
      return "MEDIUM";
  }
}

/** 把 IntakeForgeRun 转换为 EvalSample 列表（不入库）。 */
export function buildEvalSamplesFromRun(run: IntakeForgeRun): EvalSample[] {
  const list: EvalSample[] = [];
  for (const e of run.evals) {
    const item = run.items.find((i) => i.id === e.intakeItemId);
    const baseSafety = item?.safetyStatus ?? "PASS";
    const safety = decideSafety(`${e.question}\n${e.expected}`, baseSafety);
    list.push({
      id: nextDatasetId("EVS"),
      evalType: e.evalType,
      question: e.question,
      expected: e.expected,
      criteria: [
        "结构 / 字段 / 语义保持一致",
        "不输出 secret / Full60 / Founder-only 内容",
        e.evalType === "MSL_HIT" ? "应生成合法 MSL 帧" : "回答应紧扣输入主题",
      ],
      sourceIntakeItemId: e.intakeItemId,
      difficulty: mapEvalDifficulty(e.evalType),
      safetyStatus: safety,
      createdAt: new Date().toISOString(),
    });
  }
  return list;
}

/** 一键：从 IntakeForgeRun 抽取并落入两个 Store，返回汇总。 */
export function ingestIntakeRunIntoStores(run: IntakeForgeRun): {
  trainingSamples: TrainingSample[];
  evalSamples: EvalSample[];
  sampleTypeBreakdown: { sampleType: string; count: number }[];
} {
  const training = buildTrainingSamplesFromRun(run);
  const evals = buildEvalSamplesFromRun(run);
  putTrainingSamples(training);
  putEvalSamples(evals);

  const map = new Map<string, number>();
  for (const t of training) map.set(t.sampleType, (map.get(t.sampleType) ?? 0) + 1);
  const sampleTypeBreakdown = Array.from(map.entries())
    .map(([sampleType, count]) => ({
      sampleType: INTAKE_SAMPLE_LABEL[sampleType as keyof typeof INTAKE_SAMPLE_LABEL] ?? sampleType,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return { trainingSamples: training, evalSamples: evals, sampleTypeBreakdown };
}
