// 旧模块扫描器：对登记表做汇总统计，并给出推荐处理摘要。
import { LEGACY_MODULE_REGISTRY } from "./legacyModuleRegistry";
import type { LegacyModule, LegacyModuleCategory, LegacyModuleStatus, ActivationPriority } from "./legacyModuleTypes";

export interface LegacyScanSummary {
  total: number;
  byStatus: Record<LegacyModuleStatus, number>;
  byPriority: Record<ActivationPriority, number>;
  byCategory: Record<LegacyModuleCategory, number>;
  activateNow: LegacyModule[];
  bridgeOnly: LegacyModule[];
  readOnly: LegacyModule[];
  duplicates: LegacyModule[];
}

export function scanLegacyModules(): LegacyScanSummary {
  const modules = LEGACY_MODULE_REGISTRY;
  const byStatus = {} as Record<LegacyModuleStatus, number>;
  const byPriority: Record<ActivationPriority, number> = { P0: 0, P1: 0, P2: 0, P3: 0 };
  const byCategory = {} as Record<LegacyModuleCategory, number>;

  for (const m of modules) {
    byStatus[m.currentStatus] = (byStatus[m.currentStatus] || 0) + 1;
    byPriority[m.activationPriority] += 1;
    byCategory[m.category] = (byCategory[m.category] || 0) + 1;
  }

  return {
    total: modules.length,
    byStatus,
    byPriority,
    byCategory,
    activateNow: modules.filter((m) => m.recommendedAction === "ACTIVATE_NOW"),
    bridgeOnly: modules.filter((m) => m.recommendedAction === "BRIDGE_ONLY"),
    readOnly: modules.filter((m) => m.recommendedAction === "KEEP_READ_ONLY"),
    duplicates: modules.filter((m) => m.currentStatus === "DUPLICATE"),
  };
}
