// Legacy Module → Scheduler / Prediction Bridge：把高优先级旧模块输出为任务建议与预测参考。
import { LEGACY_MODULE_REGISTRY } from "./legacyModuleRegistry";
import { topActivationCandidates } from "./legacyModulePriorityScorer";
import { getOrBuildBridgePlan } from "./legacyModuleBridgePlanner";

export interface LegacyModuleTaskSuggestion {
  taskId: string;
  type: "LEGACY_MODULE_BRIDGE";
  moduleId: string;
  moduleName: string;
  title: string;
  summary: string;
  status: "WAITING_CONFIRMATION";
  risk: "LOW" | "MEDIUM" | "HIGH";
}

/**
 * 输出可供 Scheduler 直接展示的任务建议（仅建议，不自动执行）。
 */
export function buildLegacyModuleTaskSuggestions(limit = 5): LegacyModuleTaskSuggestion[] {
  const top = topActivationCandidates(limit);
  return top.map(({ module: m }) => {
    const plan = getOrBuildBridgePlan(m);
    const risk = m.activationPriority === "P0" ? "MEDIUM" : "LOW";
    return {
      taskId: `legacy-bridge-${m.id.toLowerCase()}`,
      type: "LEGACY_MODULE_BRIDGE",
      moduleId: m.id,
      moduleName: m.cnName,
      title: `桥接旧模块：${m.cnName}`,
      summary: plan.goal,
      status: "WAITING_CONFIRMATION",
      risk,
    };
  });
}

/**
 * 给 Prediction 用：返回当前系统「下一步最缺的层」与对应旧模块。
 */
export interface LegacyMissingLayer {
  layer: string;
  cnName: string;
  modules: { id: string; cnName: string; priority: string }[];
}

export function predictMissingLayers(): LegacyMissingLayer[] {
  const groups = new Map<string, LegacyMissingLayer>();
  for (const m of LEGACY_MODULE_REGISTRY) {
    if (m.currentStatus === "ACTIVE") continue;
    const key = m.layer;
    const exist = groups.get(key) ?? { layer: key, cnName: layerLabel(key), modules: [] };
    exist.modules.push({ id: m.id, cnName: m.cnName, priority: m.activationPriority });
    groups.set(key, exist);
  }
  return Array.from(groups.values()).sort((a, b) => b.modules.length - a.modules.length);
}

function layerLabel(layer: string): string {
  const map: Record<string, string> = {
    INTERFACE: "界面层", RUNTIME: "运行时", MEMORY: "记忆层", PREDICTION: "预测层",
    SCHEDULER: "调度层", STATE: "状态层", VALUE: "价值层", WORLD: "世界层",
    LIFE: "生活层", GOVERNANCE: "治理层",
  };
  return map[layer] || layer;
}
