// AetherSeed Experiment Ledger · 失败归因 + 下一炉规划器
import {
  type AetherSeedExperiment,
  type ExperimentFailureReport,
  type ExperimentMetrics,
  type FailureType,
  type NextExperimentPlan,
  type NextRecommendationType,
  nextExperimentId,
} from "./experimentLedgerTypes";

const FAILURE_KEYWORDS: { type: FailureType; keywords: RegExp }[] = [
  { type: "OOM",            keywords: /oom|out of memory|cuda.*memory|显存|内存溢出/i },
  { type: "LOSS_NAN",       keywords: /nan|inf|发散|loss[^0-9]*nan/i },
  { type: "SLOW_TRAINING",  keywords: /太慢|过慢|slow|卡住|hang|过低吞吐/i },
  { type: "DATA_ERROR",     keywords: /数据.*错误|key.*error|index.*out of range|format.*error|tokeniz/i },
  { type: "CONFIG_ERROR",   keywords: /config|配置|参数错误|argument|argparse/i },
  { type: "BAD_OUTPUT",     keywords: /输出.*差|乱码|无意义|质量差|bad output|garbage/i },
  { type: "EVAL_FAILED",    keywords: /eval.*失败|eval.*error|评测.*失败/i },
];

export function classifyFailure(summary: string): FailureType {
  for (const f of FAILURE_KEYWORDS) {
    if (f.keywords.test(summary)) return f.type;
  }
  return "UNKNOWN";
}

const FAILURE_FIXES: Record<FailureType, { causes: string[]; fixes: string[]; retry: boolean }> = {
  OOM: {
    causes: ["batch_size 过大", "context_length 过长", "模型规模超出本机硬件"],
    fixes: [
      "降低 batch_size（如 4 → 1）",
      "缩短 context_length（如 1024 → 512）",
      "使用 gradient_accumulation_steps 代替大 batch",
      "切换到更小目标模型（如 50M → 10M）",
      "尝试 LoRA / QLoRA 模式",
    ],
    retry: true,
  },
  LOSS_NAN: {
    causes: ["learning_rate 过高", "数据中存在异常 token", "精度问题（fp16）"],
    fixes: [
      "把 learning_rate 调低一个数量级",
      "加 gradient_clipping（如 1.0）",
      "切换为 bf16 / fp32 精度",
      "检查 tokenizer 与数据集对齐",
    ],
    retry: true,
  },
  SLOW_TRAINING: {
    causes: ["纯 CPU 训练", "I/O 瓶颈", "context 过长"],
    fixes: [
      "改在夜间长跑",
      "切换到 GPU 服务器",
      "缩短 context_length",
      "降低 eval 频率",
    ],
    retry: true,
  },
  DATA_ERROR: {
    causes: ["数据集字段格式与脚本不一致", "tokenizer 未训练", "样本中存在空字符串"],
    fixes: [
      "回到 /system/datasets 重新构建版本",
      "在 /system/intake-forge 修复异常样本",
      "校对 train.py 的字段读取",
    ],
    retry: true,
  },
  CONFIG_ERROR: {
    causes: ["config.yaml 字段缺失", "脚本参数命名变化"],
    fixes: [
      "重新从 /system/local-training 下载训练包",
      "对照 README_local_training.md 检查参数",
    ],
    retry: true,
  },
  BAD_OUTPUT: {
    causes: ["SFT 样本不足", "格式样本不足", "数据噪声过多"],
    fixes: [
      "扩充 SFT 样本（+1k）",
      "扩充 Format Tiny 数据",
      "加强 Eval 集筛选",
      "清洗重复 / 低质量样本",
    ],
    retry: true,
  },
  EVAL_FAILED: {
    causes: ["eval 脚本依赖缺失", "eval 集与训练集字段不一致"],
    fixes: [
      "重新生成 eval.py",
      "检查 evalDatasetVersionId 选择",
    ],
    retry: true,
  },
  UNKNOWN: {
    causes: ["原因待补充"],
    fixes: ["请补充更详细的失败日志摘要后再生成报告"],
    retry: false,
  },
};

export function buildFailureReport(
  experimentId: string,
  summary: string,
  forceType?: FailureType,
): ExperimentFailureReport {
  const failureType = forceType ?? classifyFailure(summary);
  const f = FAILURE_FIXES[failureType];
  return {
    id: nextExperimentId("EFR"),
    experimentId,
    failureType,
    summary: summary.trim().slice(0, 1200) || "（未提供失败摘要）",
    suspectedCauses: f.causes,
    suggestedFixes: f.fixes,
    shouldRetry: f.retry,
    createdAt: new Date().toISOString(),
  };
}

// —— Next experiment plan ——
function pickRecommendation(
  exp: AetherSeedExperiment,
  metrics?: ExperimentMetrics,
  failure?: ExperimentFailureReport,
): { type: NextRecommendationType; title: string; rationale: string; changes: string[]; priority: NextExperimentPlan["priority"] } {
  if (failure) {
    switch (failure.failureType) {
      case "OOM":
        return {
          type: "SMALLER_MODEL",
          title: "换更小模型 / 缩短上下文",
          rationale: "OOM 多由模型规模与上下文长度超出硬件能力导致。",
          changes: ["改用更小目标模型", "缩短 context_length", "降低 batch_size"],
          priority: "P0",
        };
      case "LOSS_NAN":
        return {
          type: "CHANGE_LR",
          title: "降低学习率并加梯度裁剪",
          rationale: "Loss NaN 通常由学习率过高或数据异常导致。",
          changes: ["learning_rate 调低一个数量级", "加 gradient_clipping=1.0", "切 bf16"],
          priority: "P0",
        };
      case "BAD_OUTPUT":
        return {
          type: "DIFFERENT_FORMAT",
          title: "扩充格式样本 / 切到 Format Tiny",
          rationale: "输出质量差通常是格式样本和 SFT 样本不足。",
          changes: ["扩充 ChatML / JSON 格式样本", "增加 Format Tiny 训练", "清洗低质样本"],
          priority: "P1",
        };
      case "DATA_ERROR":
        return {
          type: "CLEAN_DATA",
          title: "回到数据集清洗",
          rationale: "训练脚本与数据集字段不一致。",
          changes: ["重新构建数据集版本", "检查 schema", "重新导出"],
          priority: "P0",
        };
      case "SLOW_TRAINING":
        return {
          type: "SCALE_UP",
          title: "迁移到 GPU 服务器",
          rationale: "本机吞吐不足以完成训练。",
          changes: ["申请 GPU 服务器额度", "改成夜间长跑", "缩短 context"],
          priority: "P1",
        };
      default:
        return {
          type: "RETRY",
          title: "补全失败摘要后再重试",
          rationale: "失败原因尚未充分识别。",
          changes: ["粘贴更完整的训练日志", "补充硬件信息", "标注失败时的 step"],
          priority: "P2",
        };
    }
  }

  if (exp.status === "COMPLETED_MANUAL" || exp.status === "EVALUATED") {
    const evalLoss = metrics?.evalLoss;
    if (typeof evalLoss === "number" && evalLoss < 3.0) {
      return {
        type: "SCALE_UP",
        title: "下一炉放大规模",
        rationale: "本轮 eval loss 较低，可进入下一档目标模型。",
        changes: ["切换到更大目标模型", "扩充数据量", "提高 epochs"],
        priority: "P0",
      };
    }
    if (typeof evalLoss === "number" && evalLoss >= 4.0) {
      return {
        type: "MORE_DATA",
        title: "下一炉先补数据",
        rationale: "eval loss 偏高，模型欠拟合，优先扩充数据。",
        changes: ["扩充训练样本", "补充 EVAL 集", "重训 1-2 epoch"],
        priority: "P1",
      };
    }
    return {
      type: "RUN_EVAL",
      title: "下一炉先补充评测",
      rationale: "本轮指标信息不足，先跑 eval。",
      changes: ["运行 eval.py", "登记 MSL / JSON / Router 指标"],
      priority: "P1",
    };
  }

  // 默认（草稿 / 待执行）
  return {
    type: "RETRY",
    title: "按本机训练计划手动执行",
    rationale: "实验尚未运行，按 Runbook 步骤手动执行训练。",
    changes: ["运行 train.py", "训练完成后回到实验账本登记"],
    priority: "P1",
  };
}

export function buildNextExperimentPlan(
  exp: AetherSeedExperiment,
  metrics?: ExperimentMetrics,
  failure?: ExperimentFailureReport,
): NextExperimentPlan {
  const pick = pickRecommendation(exp, metrics, failure);
  return {
    id: nextExperimentId("NEP"),
    basedOnExperimentId: exp.id,
    recommendationType: pick.type,
    title: pick.title,
    rationale: pick.rationale,
    suggestedChanges: pick.changes,
    priority: pick.priority,
    createdAt: new Date().toISOString(),
  };
}
