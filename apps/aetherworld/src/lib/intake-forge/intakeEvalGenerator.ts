// 投喂铸造炉 · 评测样本生成
import type { IntakeChunk, IntakeEvalItem, IntakeSourceType } from "./intakeForgeTypes";
import { nextIntakeId } from "./intakeForgeTypes";

export function generateEvalItems(opts: {
  intakeItemId: string;
  sourceType: IntakeSourceType;
  chunks: IntakeChunk[];
}): IntakeEvalItem[] {
  const usable = opts.chunks.filter((c) => c.safetyStatus !== "BLOCK").slice(0, 5);
  return usable.map((c) => {
    let evalType: IntakeEvalItem["evalType"] = "INTENT_HIT";
    let question = `请基于以下输入还原对应输出。\n输入：${c.textPreview.slice(0, 120)}`;
    let expected = "输出应保持结构 / 字段 / 语义一致。";

    if (opts.sourceType === "MSL_STATE") {
      evalType = "MSL_HIT";
      expected = "应生成合法 MSL 帧并命中 opcode。";
    } else if (opts.sourceType === "LOVABLE_PROMPT") {
      evalType = "FORMAT_VALID";
      expected = "应生成结构化执行计划与验收标准。";
    } else if (opts.sourceType === "CODE_PROJECT" || opts.sourceType === "PROJECT_FOLDER") {
      evalType = "ROUTER_HIT";
      expected = "应正确识别架构层级与模块归类。";
    } else if (opts.sourceType === "WORLD_CREATIVE") {
      evalType = "WORLD_CONSISTENCY";
      expected = "应保持世界观、角色与设定一致。";
    }

    return {
      id: nextIntakeId("IFE"),
      intakeItemId: opts.intakeItemId,
      evalType,
      question,
      expected,
    };
  });
}
