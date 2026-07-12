// 重算状态 · Recalculation Status

export type RecalculationStatusId =
  | "CLEAN"
  | "STALE"
  | "PARTIALLY_STALE"
  | "RECALCULATING"
  | "FAILED"
  | "COMPLETED"
  | "NEEDS_REVIEW";

export interface RecalculationStatusMeta {
  id: RecalculationStatusId;
  cn: string;
  en: string;
  tone: "ok" | "warn" | "danger" | "info";
  description: string;
}

export const RECALC_STATUS_META: Record<RecalculationStatusId, RecalculationStatusMeta> = {
  CLEAN:            { id: "CLEAN",            cn: "已最新",       en: "Clean",            tone: "ok",     description: "当前所有派生状态与底层数据一致。" },
  STALE:            { id: "STALE",            cn: "已过期",       en: "Stale",            tone: "warn",   description: "底层数据已变化，派生结果需要重算。" },
  PARTIALLY_STALE:  { id: "PARTIALLY_STALE",  cn: "部分过期",     en: "Partially Stale",  tone: "warn",   description: "部分模块需要重算，其余仍可信。" },
  RECALCULATING:    { id: "RECALCULATING",    cn: "重算中",       en: "Recalculating",    tone: "info",   description: "正在重算，请勿关闭页面。" },
  FAILED:           { id: "FAILED",           cn: "重算失败",     en: "Failed",           tone: "danger", description: "重算未完成，保留旧状态并显示错误。" },
  COMPLETED:        { id: "COMPLETED",        cn: "重算完成",     en: "Completed",        tone: "ok",     description: "重算成功，已展示影响摘要。" },
  NEEDS_REVIEW:     { id: "NEEDS_REVIEW",     cn: "需要复核",     en: "Needs Review",     tone: "warn",   description: "重算完成但存在数据冲突或高风险变化。" },
};
