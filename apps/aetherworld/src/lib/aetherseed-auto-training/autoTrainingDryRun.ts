// AetherSeed Auto Training Executor · Dry-run 校验
import type { LocalTrainingBundle } from "@/lib/aetherseed-local-training/localTrainingRuntime";
import {
  nextAutoTrainingId,
  type AutoTrainingCommand,
  type AutoTrainingDryRunResult,
  type AutoTrainingEnvironmentStatus,
  type AutoTrainingRiskLevel,
} from "./autoTrainingTypes";
import { previewCommand } from "./autoTrainingCommandBuilder";
import { detectProcessBridge } from "./autoTrainingProcessBridge";

export interface DryRunInput {
  taskId: string;
  bundle: LocalTrainingBundle;
  commands: AutoTrainingCommand[];
  hasBlockedSamples?: boolean;
}

export function runDryRun(input: DryRunInput): AutoTrainingDryRunResult {
  const warnings: string[] = [];
  const blocked: string[] = [];
  const wd = input.commands[0]?.workingDirectory ?? `./AetherSeed/${input.bundle.plan.id}`;

  // 1. 白名单
  const badCmd = input.commands.find((c) => c.whitelistStatus === "BLOCK");
  if (badCmd) blocked.push(`命令未通过白名单：${badCmd.reason}`);

  // 2. BLOCK 样本
  if (input.hasBlockedSamples) blocked.push("数据集中存在 BLOCK 样本，禁止进入训练");

  // 3. 安全状态
  if (input.bundle.plan.safetyStatus === "BLOCK") blocked.push("LocalTrainingPlan 安全状态为 BLOCK");
  if (input.bundle.plan.safetyStatus === "WARN") warnings.push("LocalTrainingPlan 安全状态为 WARN，请人工复核");

  // 4. 数据集文件
  const trainFile = input.bundle.config.datasetConfig.trainFile;
  if (!trainFile) warnings.push("缺少 train.jsonl，请先在 /system/datasets 导出训练数据");

  // 5. Runtime 环境
  const bridge = detectProcessBridge();
  let env: AutoTrainingEnvironmentStatus;
  if (blocked.length) env = "BLOCKED";
  else if (bridge.kind === "NONE") env = "NEEDS_LOCAL_GATEWAY";
  else env = "READY";

  if (env === "NEEDS_LOCAL_GATEWAY") {
    warnings.push("当前为浏览器环境，未检测到本地网关 / Electron IPC：只能生成命令预览，不会真实执行");
  }

  // 6. 风险评估
  const risk: AutoTrainingRiskLevel = blocked.length
    ? "HIGH"
    : input.bundle.plan.targetModel === "AETHERSEED_100M"
    ? "MEDIUM"
    : "LOW";

  return {
    id: nextAutoTrainingId("DR"),
    taskId: input.taskId,
    canRun: blocked.length === 0 && env !== "NEEDS_LOCAL_GATEWAY",
    environmentStatus: env,
    commandPreview: input.commands.map(previewCommand),
    workingDirectory: wd,
    expectedInputs: [
      trainFile,
      input.bundle.config.datasetConfig.evalFile ?? "(无 eval 文件)",
      "config.yaml",
      "train.py",
      "eval.py",
      "requirements.txt",
    ],
    expectedOutputs: input.bundle.plan.expectedOutput,
    estimatedRisk: risk,
    warnings,
    blockedReasons: blocked,
    createdAt: new Date().toISOString(),
  };
}
