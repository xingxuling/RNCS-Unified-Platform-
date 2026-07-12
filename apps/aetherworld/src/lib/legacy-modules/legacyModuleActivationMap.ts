// Legacy Module Activation Map：按分类 / 优先级 / 层级聚合，供页面与 Prediction 使用。
import { LEGACY_MODULE_REGISTRY } from "./legacyModuleRegistry";
import type { LegacyModule, LegacyModuleCategory, ActivationPriority, LegacyModuleLayer } from "./legacyModuleTypes";

export interface ActivationGroup<K extends string> {
  key: K;
  modules: LegacyModule[];
}

export function groupByCategory(): ActivationGroup<LegacyModuleCategory>[] {
  const map = new Map<LegacyModuleCategory, LegacyModule[]>();
  for (const m of LEGACY_MODULE_REGISTRY) {
    const list = map.get(m.category) ?? [];
    list.push(m);
    map.set(m.category, list);
  }
  return Array.from(map.entries()).map(([key, modules]) => ({ key, modules }));
}

export function groupByPriority(): ActivationGroup<ActivationPriority>[] {
  return (["P0", "P1", "P2", "P3"] as ActivationPriority[]).map((p) => ({
    key: p,
    modules: LEGACY_MODULE_REGISTRY.filter((m) => m.activationPriority === p),
  }));
}

export function groupByLayer(): ActivationGroup<LegacyModuleLayer>[] {
  const map = new Map<LegacyModuleLayer, LegacyModule[]>();
  for (const m of LEGACY_MODULE_REGISTRY) {
    const list = map.get(m.layer) ?? [];
    list.push(m);
    map.set(m.layer, list);
  }
  return Array.from(map.entries()).map(([key, modules]) => ({ key, modules }));
}
