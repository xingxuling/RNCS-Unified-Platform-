// AetherSeed Local Training · 评测计划构建器
import {
  type LocalTrainingEvalPlan,
  type LocalTrainingPlan,
  nextLocalTrainingId,
} from "./localTrainingTypes";

const METRICS_BY_TARGET: Record<LocalTrainingPlan["targetModel"], string[]> = {
  AETHERSEED_10M: ["train_loss", "eval_loss", "byte_perplexity"],
  AETHERSEED_50M: ["train_loss", "eval_loss", "perplexity", "json_valid_rate"],
  AETHERSEED_100M: ["train_loss", "eval_loss", "perplexity", "json_valid_rate", "msl_hit_rate"],
  AETHERSEED_300M_PRIVATE: [
    "train_loss",
    "eval_loss",
    "perplexity",
    "json_valid_rate",
    "lovable_prompt_valid_rate",
    "structure_field_f1",
    "chinese_output_rate",
    "safety_violation_rate",
  ],
  ROUTER_TINY: ["router_top1_acc", "router_top3_acc", "fallback_rate"],
  MSL_TINY: ["msl_frame_hit", "msl_field_f1"],
  FORMAT_TINY: ["json_valid_rate", "chatml_valid_rate", "tool_call_valid_rate"],
};

export function buildLocalTrainingEvalPlan(
  plan: LocalTrainingPlan,
  evalFile?: string,
): LocalTrainingEvalPlan {
  return {
    id: nextLocalTrainingId("LTV"),
    planId: plan.id,
    evalFile,
    metrics: METRICS_BY_TARGET[plan.targetModel],
    notes: [
      "本评测计划仅生成指标清单，不自动执行；请用 eval.py 草案在本机手动跑分。",
      "评测完成后请把 evalSummary 手动登记到实验记录。",
      plan.evalDatasetVersionId
        ? `评测集版本：${plan.evalDatasetVersionId}`
        : "未指定评测集；建议在 /system/datasets 构建 EVAL 版本后再回到本页绑定。",
    ],
  };
}
