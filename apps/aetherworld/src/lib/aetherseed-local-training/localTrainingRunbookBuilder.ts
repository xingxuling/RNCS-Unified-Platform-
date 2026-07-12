// AetherSeed Local Training · Runbook 构建器（步骤 / 命令 / 排错）
import {
  LOCAL_TRAINING_TARGET_LABEL,
  type LocalTrainingConfig,
  type LocalTrainingPlan,
  type LocalTrainingRunbook,
  nextLocalTrainingId,
} from "./localTrainingTypes";
import { LOCAL_TRAINING_SAFETY_FORBIDDEN } from "./localTrainingSafetyPolicy";

export function buildLocalTrainingRunbook(
  plan: LocalTrainingPlan,
  cfg: LocalTrainingConfig,
): LocalTrainingRunbook {
  const ckptName = `${plan.targetModel.toLowerCase()}_final.pt`;
  return {
    id: nextLocalTrainingId("LTR"),
    planId: plan.id,
    steps: [
      `从 /system/datasets 下载完整训练包到本机目录（包含 ${cfg.datasetConfig.trainFile}${cfg.datasetConfig.evalFile ? " / " + cfg.datasetConfig.evalFile : ""}）`,
      "在 /system/local-training 下载本机训练包（含 train.py / eval.py / config.yaml / requirements.txt / README）",
      "在本机解压并进入目录",
      "创建虚拟环境并安装 requirements.txt",
      `手动执行 train.py 进行 ${LOCAL_TRAINING_TARGET_LABEL[plan.targetModel]} 训练`,
      "等待训练完成（耗时见 estimatedDuration）",
      "手动执行 eval.py 估算评测指标",
      "回到 /system/local-training 手动登记实验状态：COMPLETED_MANUAL，并填写 outputArtifactPath",
    ],
    commands: [
      "python -m venv .venv",
      "source .venv/bin/activate   # Windows: .venv\\Scripts\\activate",
      "pip install -r requirements.txt",
      "python train.py --config config.yaml --out checkpoint",
      `python eval.py --config config.yaml --checkpoint checkpoint/${ckptName} --out eval_report.json`,
    ],
    expectedArtifacts: [
      `checkpoint/${plan.targetModel.toLowerCase()}_step_*.pt`,
      `checkpoint/${ckptName}`,
      "train.log",
      "eval_report.json",
    ],
    troubleshooting: [
      "若 torch 安装失败：在 PyTorch 官网根据本机 CUDA 版本选择对应 wheel 重新安装",
      "若内存不足：减小 batch_size / context_length，或改用 fp16",
      "若 loss NaN：降低 learning_rate（如 1e-4），关闭混合精度",
      "若训练过慢：先用 AETHERSEED_10M 验证脚本是否可跑通，再扩大规模",
      "若 eval 全 0：检查 eval.jsonl 是否为空，或 checkpoint 是否对应当前 config",
    ],
    safetyNotes: LOCAL_TRAINING_SAFETY_FORBIDDEN,
  };
}

export function runbookToMarkdown(rb: LocalTrainingRunbook): string {
  const lines: string[] = [];
  lines.push("# 本机训练 Runbook");
  lines.push("");
  lines.push("## 步骤");
  rb.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  lines.push("");
  lines.push("## 命令");
  lines.push("```bash");
  rb.commands.forEach((c) => lines.push(c));
  lines.push("```");
  lines.push("");
  lines.push("## 预期产物");
  rb.expectedArtifacts.forEach((a) => lines.push(`- \`${a}\``));
  lines.push("");
  lines.push("## 排错");
  rb.troubleshooting.forEach((t) => lines.push(`- ${t}`));
  lines.push("");
  lines.push("## 安全须知");
  rb.safetyNotes.forEach((n) => lines.push(`- ${n}`));
  lines.push("");
  return lines.join("\n");
}
