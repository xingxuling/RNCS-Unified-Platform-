import { VERSION_CHANGE_TYPES, type VersionChangeType, getChangeTypeMeta } from "@/constants/version-leap/versionChangeTypes";
import { VERSION_IMPACT_SCOPES, type VersionImpactScopeId } from "@/constants/version-leap/versionImpactScopes";

export interface VersionChangeRecord {
  id: string;
  timestamp: number;
  changeType: VersionChangeType;
  modules: string[];
  scopes: VersionImpactScopeId[];
  description: string;
  source: "ui" | "text" | "docs" | "constant" | "constitution" | "subject" | "world" | "qa" | "recalc" | "manual";
}

const RECENT: VersionChangeRecord[] = [
  { id: "vc_text_engine", timestamp: Date.now() - 86400000 * 3, changeType: "ENGINE_ADDED", modules: ["text-dynamic-update"], scopes: ["ENGINE", "TEXT", "UI", "DOCS", "QA"], description: "新增 Text Dynamic Update Engine。", source: "manual" },
  { id: "vc_ui_engine_upd", timestamp: Date.now() - 86400000 * 5, changeType: "ENGINE_UPGRADED", modules: ["ui-update-engine"], scopes: ["UI", "QUICK_START"], description: "UI Update Engine 模板覆盖升级。", source: "ui" },
  { id: "vc_docs_engine", timestamp: Date.now() - 86400000 * 7, changeType: "ENGINE_ADDED", modules: ["learn"], scopes: ["DOCS", "ENGINE", "UI"], description: "新增 Learning & Documentation Engine。", source: "docs" },
  { id: "vc_subroute", timestamp: Date.now() - 86400000 * 9, changeType: "ROUTE_UPDATE", modules: ["sidebar"], scopes: ["ROUTES", "UI"], description: "Collapsible Sub-Router System。", source: "ui" },
  { id: "vc_qa_fix", timestamp: Date.now() - 86400000 * 1, changeType: "BUG_FIX", modules: ["software-qa"], scopes: ["QA", "UI"], description: "修复 10 项软件测试反馈。", source: "qa" },
];

export function detectRecentChanges(): VersionChangeRecord[] {
  return [...RECENT].sort((a, b) => b.timestamp - a.timestamp);
}

export function aggregateChangeTypes(records: VersionChangeRecord[]): VersionChangeType[] {
  return Array.from(new Set(records.map((r) => r.changeType)));
}

export function aggregateScopes(records: VersionChangeRecord[]): VersionImpactScopeId[] {
  const all = new Set<VersionImpactScopeId>();
  records.forEach((r) => r.scopes.forEach((s) => all.add(s)));
  return Array.from(all);
}

export function aggregateModules(records: VersionChangeRecord[]): string[] {
  return Array.from(new Set(records.flatMap((r) => r.modules)));
}

export function pushChangeRecord(rec: Omit<VersionChangeRecord, "id" | "timestamp"> & { id?: string }): VersionChangeRecord {
  const r: VersionChangeRecord = {
    id: rec.id ?? `vc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    ...rec,
  };
  RECENT.unshift(r);
  if (RECENT.length > 200) RECENT.pop();
  return r;
}

export const CHANGE_TYPE_CATALOG = VERSION_CHANGE_TYPES;
export const SCOPE_CATALOG = VERSION_IMPACT_SCOPES;
export { getChangeTypeMeta };
