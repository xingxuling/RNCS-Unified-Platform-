// Founder Audit Log — local audit trail for founder-mode actions.

import { FOUNDER_MODE_RULES } from "@/constants/founderModeRules";
import type { RiskLevel } from "@/constants/founderPermissionLevels";

export interface FounderAuditLog {
  id: string;
  action: string;
  moduleId: string;
  riskLevel: RiskLevel | "INFO";
  timestamp: string;
  details: string;
  success: boolean;
}

const MAX_ENTRIES = 200;

export function readAuditLog(): FounderAuditLog[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(FOUNDER_MODE_RULES.STORAGE_KEY_AUDIT);
    if (!raw) return [];
    return JSON.parse(raw) as FounderAuditLog[];
  } catch {
    return [];
  }
}

export function appendAuditLog(entry: Omit<FounderAuditLog, "id" | "timestamp"> & { timestamp?: string }) {
  if (typeof localStorage === "undefined") return;
  const list = readAuditLog();
  const log: FounderAuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: entry.timestamp ?? new Date().toISOString(),
    action: entry.action,
    moduleId: entry.moduleId,
    riskLevel: entry.riskLevel,
    details: entry.details,
    success: entry.success,
  };
  list.unshift(log);
  if (list.length > MAX_ENTRIES) list.length = MAX_ENTRIES;
  localStorage.setItem(FOUNDER_MODE_RULES.STORAGE_KEY_AUDIT, JSON.stringify(list));
}

export function clearAuditLog() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(FOUNDER_MODE_RULES.STORAGE_KEY_AUDIT);
}
