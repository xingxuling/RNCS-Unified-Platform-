export type VersionImpactScopeId =
  | "UI" | "ROUTES" | "QUICK_START" | "TEXT" | "DOCS" | "ENGINE"
  | "WORLD_ENGINE" | "CONSTANTS" | "CONSTITUTION" | "SUBJECT_MODE"
  | "SAFETY" | "PERMISSIONS" | "EXPORTS" | "QA" | "RECALCULATION"
  | "DATA_MODEL" | "POSITIONING";

export interface ImpactScope {
  scopeId: VersionImpactScopeId;
  name: string;
  weight: number;
  description: string;
}

export const VERSION_IMPACT_SCOPES: ImpactScope[] = [
  { scopeId: "UI", name: "UI 界面", weight: 0.1, description: "用户界面层。" },
  { scopeId: "ROUTES", name: "路由", weight: 0.12, description: "路由系统与子路由。" },
  { scopeId: "QUICK_START", name: "Quick Start", weight: 0.1, description: "Quick Start 模板。" },
  { scopeId: "TEXT", name: "应用文案", weight: 0.1, description: "应用文本与文案。" },
  { scopeId: "DOCS", name: "教程与文档", weight: 0.1, description: "教程文档系统。" },
  { scopeId: "ENGINE", name: "引擎", weight: 0.18, description: "核心引擎与子模块。" },
  { scopeId: "WORLD_ENGINE", name: "世界引擎", weight: 0.2, description: "Sequence World Engine。" },
  { scopeId: "CONSTANTS", name: "常数宇宙", weight: 0.18, description: "常数与定数体系。" },
  { scopeId: "CONSTITUTION", name: "系统宪法", weight: 0.22, description: "系统宪法条款。" },
  { scopeId: "SUBJECT_MODE", name: "主体模式", weight: 0.18, description: "Demo / Real / Founder 主体。" },
  { scopeId: "SAFETY", name: "安全边界", weight: 0.25, description: "安全规则与边界。" },
  { scopeId: "PERMISSIONS", name: "权限规则", weight: 0.2, description: "权限与可见性。" },
  { scopeId: "EXPORTS", name: "导出格式", weight: 0.12, description: "导出与外部接口。" },
  { scopeId: "QA", name: "Software QA", weight: 0.15, description: "测试与质量保证。" },
  { scopeId: "RECALCULATION", name: "回验/重算", weight: 0.15, description: "Recalculation stale 状态。" },
  { scopeId: "DATA_MODEL", name: "数据模型", weight: 0.18, description: "数据结构与持久化。" },
  { scopeId: "POSITIONING", name: "产品定位", weight: 0.2, description: "产品定位与代际。" },
];

export function getScope(id: string): ImpactScope | undefined {
  return VERSION_IMPACT_SCOPES.find((s) => s.scopeId === id);
}
