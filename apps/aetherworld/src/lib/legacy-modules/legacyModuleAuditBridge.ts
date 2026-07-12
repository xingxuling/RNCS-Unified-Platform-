// Legacy Module → Bug Audit 摘要桥接。
// 不直接写入 bugAuditReport（保持单一数据源），仅生成结构化摘要供 audit 页引用。
import { scanLegacyModules } from "./legacyModuleScanner";

export interface LegacyAuditSummary {
  total: number;
  active: number;
  partial: number;
  readOnly: number;
  placeholder: number;
  recommendActivate: number;
  duplicates: number;
}

export function buildLegacyAuditSummary(): LegacyAuditSummary {
  const s = scanLegacyModules();
  return {
    total: s.total,
    active: s.byStatus.ACTIVE || 0,
    partial: s.byStatus.PARTIAL || 0,
    readOnly: s.byStatus.READ_ONLY || 0,
    placeholder: s.byStatus.PLACEHOLDER || 0,
    recommendActivate: s.activateNow.length,
    duplicates: s.duplicates.length,
  };
}
