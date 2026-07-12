export type LedgerDirection = "EARN" | "SPEND" | "ADJUST" | "VOID";

export interface LedgerEntryType {
  id: LedgerDirection;
  label: string;
  description: string;
}

export const LEDGER_ENTRY_TYPES: LedgerEntryType[] = [
  { id: "EARN",   label: "获得", description: "积分新增。" },
  { id: "SPEND",  label: "消费", description: "积分用于内部解锁 / 标记 / 升级。" },
  { id: "ADJUST", label: "调整", description: "审计 / 手动修正。" },
  { id: "VOID",   label: "作废", description: "由于安全或重复被作废。" },
];
