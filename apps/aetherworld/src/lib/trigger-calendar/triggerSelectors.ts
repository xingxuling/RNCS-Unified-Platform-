import type { TriggerItem } from "./triggerTypes";

function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function addDays(date: string, days: number): string {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function selectToday(items: TriggerItem[]): TriggerItem[] {
  const t = today();
  return items.filter((i) => i.date === t && i.status !== "DONE");
}

/** 未来 N 天（不含今天） */
export function selectUpcoming(items: TriggerItem[], days = 7): TriggerItem[] {
  const start = addDays(today(), 1);
  const end = addDays(today(), days);
  return items.filter(
    (i) => i.date >= start && i.date <= end && i.status !== "DONE",
  );
}

/** 待处理：错过的、PENDING 且过期、或显式 PENDING/MISSED */
export function selectPending(items: TriggerItem[]): TriggerItem[] {
  const t = today();
  return items.filter((i) => {
    if (i.status === "MISSED" || i.status === "FAILED") return true;
    if (i.status === "DONE") return false;
    if (i.date < t) return true;
    return false;
  });
}

export function todayString(): string {
  return today();
}

export function shiftDate(date: string, days: number): string {
  return addDays(date, days);
}
