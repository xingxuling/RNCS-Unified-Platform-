export type VersionChangeType =
  | "BUG_FIX" | "UI_FIX" | "TEXT_UPDATE" | "DOCS_UPDATE" | "ROUTE_UPDATE"
  | "QUICK_START_UPDATE" | "EMPTY_STATE_UPDATE" | "USAGE_EXAMPLE_UPDATE"
  | "MODULE_ADDED" | "ENGINE_ADDED" | "ENGINE_UPGRADED" | "WORLD_ENGINE_LEAP"
  | "CONSTANT_UPDATE" | "CONSTITUTION_UPDATE" | "SUBJECT_MODE_UPDATE"
  | "SAFETY_RULE_UPDATE" | "PERMISSION_UPDATE" | "EXPORT_FORMAT_UPDATE"
  | "DATA_STRUCTURE_UPDATE" | "ARCHITECTURE_CHANGE"
  | "PRODUCT_POSITIONING_CHANGE" | "RELEASE_GOVERNANCE_UPDATE";

export interface VersionChangeTypeMeta {
  id: VersionChangeType;
  label: string;
  weight: number;
  baseScope: string[];
}

export const VERSION_CHANGE_TYPES: VersionChangeTypeMeta[] = [
  { id: "BUG_FIX", label: "Bug 修复", weight: 0.05, baseScope: ["QA"] },
  { id: "UI_FIX", label: "界面修复", weight: 0.06, baseScope: ["UI"] },
  { id: "TEXT_UPDATE", label: "文案更新", weight: 0.08, baseScope: ["TEXT"] },
  { id: "DOCS_UPDATE", label: "文档更新", weight: 0.08, baseScope: ["DOCS"] },
  { id: "ROUTE_UPDATE", label: "路由更新", weight: 0.12, baseScope: ["ROUTES"] },
  { id: "QUICK_START_UPDATE", label: "Quick Start 更新", weight: 0.1, baseScope: ["QUICK_START"] },
  { id: "EMPTY_STATE_UPDATE", label: "空状态更新", weight: 0.08, baseScope: ["UI"] },
  { id: "USAGE_EXAMPLE_UPDATE", label: "示例更新", weight: 0.08, baseScope: ["DOCS"] },
  { id: "MODULE_ADDED", label: "新增模块", weight: 0.18, baseScope: ["ENGINE", "UI"] },
  { id: "ENGINE_ADDED", label: "新增引擎", weight: 0.3, baseScope: ["ENGINE", "DOCS", "TEXT", "UI"] },
  { id: "ENGINE_UPGRADED", label: "引擎升级", weight: 0.22, baseScope: ["ENGINE"] },
  { id: "WORLD_ENGINE_LEAP", label: "世界引擎跃迁", weight: 0.35, baseScope: ["WORLD_ENGINE", "ENGINE"] },
  { id: "CONSTANT_UPDATE", label: "常数宇宙更新", weight: 0.3, baseScope: ["CONSTANTS"] },
  { id: "CONSTITUTION_UPDATE", label: "系统宪法更新", weight: 0.34, baseScope: ["CONSTITUTION"] },
  { id: "SUBJECT_MODE_UPDATE", label: "主体模式更新", weight: 0.22, baseScope: ["SUBJECT_MODE"] },
  { id: "SAFETY_RULE_UPDATE", label: "安全规则更新", weight: 0.3, baseScope: ["SAFETY"] },
  { id: "PERMISSION_UPDATE", label: "权限更新", weight: 0.24, baseScope: ["PERMISSIONS"] },
  { id: "EXPORT_FORMAT_UPDATE", label: "导出格式更新", weight: 0.14, baseScope: ["EXPORTS"] },
  { id: "DATA_STRUCTURE_UPDATE", label: "数据结构更新", weight: 0.22, baseScope: ["DATA_MODEL"] },
  { id: "ARCHITECTURE_CHANGE", label: "架构变化", weight: 0.38, baseScope: ["ENGINE", "DATA_MODEL"] },
  { id: "PRODUCT_POSITIONING_CHANGE", label: "产品定位变化", weight: 0.45, baseScope: ["POSITIONING"] },
  { id: "RELEASE_GOVERNANCE_UPDATE", label: "发布治理更新", weight: 0.2, baseScope: ["QA", "RECALCULATION"] },
];

export function getChangeTypeMeta(id: VersionChangeType): VersionChangeTypeMeta | undefined {
  return VERSION_CHANGE_TYPES.find((c) => c.id === id);
}
