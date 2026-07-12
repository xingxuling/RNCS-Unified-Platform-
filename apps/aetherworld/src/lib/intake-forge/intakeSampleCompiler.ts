// 投喂铸造炉 · 样本编译器
import type {
  IntakeChunk,
  IntakeCompiledOutput,
  IntakeCompiledOutputType,
  IntakeSourceType,
} from "./intakeForgeTypes";
import { nextIntakeId } from "./intakeForgeTypes";

function outputTypesFor(sourceType: IntakeSourceType): IntakeCompiledOutputType[] {
  switch (sourceType) {
    case "CHATGPT_COMPRESSED_EXPORT":
    case "CHATGPT_CONVERSATION":
      return ["SFT_JSONL", "CHATML"];
    case "LOVABLE_PROMPT":
      return ["LOVABLE_PROMPT_JSON", "SFT_JSONL"];
    case "LOVABLE_RESULT":
      return ["SFT_JSONL", "WORKSPACE_OBJECT"];
    case "MSL_STATE":
      return ["MSL_JSON", "SFT_JSONL"];
    case "CODE_PROJECT":
    case "PROJECT_FOLDER":
      return ["SFT_JSONL", "ALPACA"];
    case "WORLD_CREATIVE":
      return ["PRETRAIN_TEXT", "SFT_JSONL"];
    case "BUG_AUDIT":
    case "RECORD_CENTER_EXPORT":
      return ["SFT_JSONL", "WORKSPACE_OBJECT"];
    case "OPEN_ARCHITECTURE_DOC":
    case "AETHERWORLD_INTERNAL_DOC":
    case "README_DOC":
    case "NETWORK_SOURCE":
      return ["PRETRAIN_TEXT", "SFT_JSONL"];
    default:
      return ["PRETRAIN_TEXT"];
  }
}

const FORMAT_LABEL: Record<IntakeCompiledOutputType, string> = {
  PRETRAIN_TEXT: "纯文本（预训练）",
  SFT_JSONL: "JSONL（SFT）",
  CHATML: "ChatML",
  ALPACA: "Alpaca",
  ROUTER_JSON: "Router JSON",
  MSL_JSON: "MSL JSON",
  TOOL_CALLING_JSON: "Tool-Calling JSON",
  LOVABLE_PROMPT_JSON: "Lovable Prompt JSON",
  EVAL_JSON: "Eval JSON",
  WORKSPACE_OBJECT: "Workspace 对象",
};

export function compileIntakeOutputs(opts: {
  intakeItemId: string;
  sourceType: IntakeSourceType;
  chunks: IntakeChunk[];
}): IntakeCompiledOutput[] {
  const outputTypes = outputTypesFor(opts.sourceType);
  const validChunks = opts.chunks.filter((c) => c.safetyStatus !== "BLOCK");
  const avgQuality =
    validChunks.length === 0
      ? 0
      : validChunks.reduce((s, c) => s + c.qualityScore, 0) / validChunks.length;

  const samplePreviews = validChunks.slice(0, 3).map((c) =>
    c.textPreview.slice(0, 120),
  );

  return outputTypes.map((t) => ({
    id: nextIntakeId("IFO"),
    intakeItemId: opts.intakeItemId,
    outputType: t,
    sampleCount: validChunks.length,
    format: FORMAT_LABEL[t],
    safetyStatus: validChunks.some((c) => c.safetyStatus === "WARN") ? "WARN" : "PASS",
    qualityScore: Number(avgQuality.toFixed(2)),
    createdAt: new Date().toISOString(),
    samplePreviews,
  }));
}
