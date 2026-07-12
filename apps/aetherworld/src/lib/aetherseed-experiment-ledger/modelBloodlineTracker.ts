// AetherSeed Experiment Ledger · 模型血统线
import {
  BLOODLINE_ORDER,
  EXPERIMENT_TARGET_LABEL,
  type AetherSeedExperiment,
  type ExperimentTargetModel,
  type ModelBloodlineRecord,
  nextExperimentId,
} from "./experimentLedgerTypes";
import {
  listBloodlines,
  listCheckpointsByExperiment,
  listExperiments,
  saveBloodline,
} from "./experimentLedgerStore";

function findGeneration(target: ExperimentTargetModel): string {
  const idx = BLOODLINE_ORDER.indexOf(target);
  if (idx < 0) return "TINY";
  return `G${idx + 1}`;
}

function defaultCapability(target: ExperimentTargetModel): string[] {
  switch (target) {
    case "AETHERSEED_10M":
      return ["脚本管线验证", "tokenizer 验证"];
    case "AETHERSEED_50M":
      return ["Aetherworld 术语", "MSL 基础帧", "Lovable Prompt 风格"];
    case "AETHERSEED_100M":
      return ["小型结构输出", "JSON / ChatML 格式稳定"];
    case "AETHERSEED_300M":
    case "AETHERSEED_700M":
      return ["多轮对话稳定", "结构化输出可靠"];
    case "AETHERSEED_1_5B":
    case "AETHERSEED_3B":
    case "AETHERSEED_7B":
      return ["可独立完成 Aetherworld 主线推理"];
    case "ROUTER_TINY":
      return ["路由判定（计算法 / Agent / 工具）"];
    case "MSL_TINY":
      return ["事件 → MSL 状态帧"];
    case "FORMAT_TINY":
      return ["稳定 JSON / ChatML / Tool Call 输出"];
  }
}

function defaultWeaknesses(target: ExperimentTargetModel): string[] {
  switch (target) {
    case "AETHERSEED_10M":
      return ["几乎无语义能力", "仅用于打通管线"];
    case "AETHERSEED_50M":
      return ["复杂推理弱", "长上下文不稳"];
    case "AETHERSEED_100M":
      return ["长文生成质量有限"];
    default:
      return ["待评测后补充"];
  }
}

function defaultNextTargets(target: ExperimentTargetModel): string[] {
  const idx = BLOODLINE_ORDER.indexOf(target);
  if (idx >= 0 && idx + 1 < BLOODLINE_ORDER.length) {
    return [`进入 ${EXPERIMENT_TARGET_LABEL[BLOODLINE_ORDER[idx + 1]]} 阶段`];
  }
  return ["维护当前模型并补强 Tiny Model"];
}

export function upsertBloodlineFromExperiment(exp: AetherSeedExperiment): ModelBloodlineRecord {
  const modelName = EXPERIMENT_TARGET_LABEL[exp.targetModel];
  const existing = listBloodlines().find((b) => b.modelName === modelName);
  const checkpoints = listCheckpointsByExperiment(exp.id);
  const checkpointIds = checkpoints.map((c) => c.id);
  const datasetIds = exp.datasetVersionId ? [exp.datasetVersionId] : [];
  const now = new Date().toISOString();
  if (existing) {
    const next: ModelBloodlineRecord = {
      ...existing,
      parentExperimentIds: Array.from(new Set([...existing.parentExperimentIds, exp.id])),
      datasetVersionIds: Array.from(new Set([...existing.datasetVersionIds, ...datasetIds])),
      checkpointIds: Array.from(new Set([...existing.checkpointIds, ...checkpointIds])),
      updatedAt: now,
    };
    return saveBloodline(next);
  }
  const record: ModelBloodlineRecord = {
    id: nextExperimentId("MBR"),
    modelName,
    generation: findGeneration(exp.targetModel),
    parentExperimentIds: [exp.id],
    datasetVersionIds: datasetIds,
    checkpointIds,
    capabilitySummary: defaultCapability(exp.targetModel),
    knownWeaknesses: defaultWeaknesses(exp.targetModel),
    nextTargets: defaultNextTargets(exp.targetModel),
    createdAt: now,
    updatedAt: now,
  };
  return saveBloodline(record);
}

export function rebuildAllBloodlines(): ModelBloodlineRecord[] {
  const exps = listExperiments();
  for (const e of exps) {
    if (e.status === "COMPLETED_MANUAL" || e.status === "EVALUATED" || e.status === "ARCHIVED") {
      upsertBloodlineFromExperiment(e);
    }
  }
  return listBloodlines();
}

export function listBloodlineOrdered(): ModelBloodlineRecord[] {
  const items = listBloodlines();
  return items.sort((a, b) => a.generation.localeCompare(b.generation));
}
