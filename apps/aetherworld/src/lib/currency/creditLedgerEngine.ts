import type { ValueUnitId } from "@/constants/currency/valueUnitTypes";
import type { LedgerDirection } from "@/constants/currency/ledgerEntryTypes";
import type { SubjectMode, RewardResult } from "./rewardCalculationEngine";
import { normalizeAmount } from "./valueUnitEngine";

const LEDGER_KEY = (mode: SubjectMode) => `aether.currency.ledger.${mode.toLowerCase()}.v1`;
const MAX_ENTRIES = 500;

export interface LedgerEntry {
  id: string;
  createdAt: string;
  subjectMode: SubjectMode;
  unitType: ValueUnitId;
  amount: number;
  direction: LedgerDirection;
  contributionType: string;
  sourceEngine: string;
  sourceId?: string;
  description: string;
  safetyNotes: string[];
  realCurrency: false;
}

function safeRead(mode: SubjectMode): LedgerEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LEDGER_KEY(mode));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function safeWrite(mode: SubjectMode, entries: LedgerEntry[]) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(LEDGER_KEY(mode), JSON.stringify(entries.slice(-MAX_ENTRIES))); } catch { /* noop */ }
}

export function appendLedger(entry: Omit<LedgerEntry, "id" | "createdAt" | "realCurrency">): LedgerEntry {
  const full: LedgerEntry = {
    ...entry,
    id: `led_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    realCurrency: false,
    amount: normalizeAmount(entry.amount),
  };
  const arr = safeRead(entry.subjectMode);
  arr.push(full);
  safeWrite(entry.subjectMode, arr);
  return full;
}

export function appendRewardToLedger(reward: RewardResult, opts: { sourceEngine: string; sourceId?: string; description: string; safetyNotes?: string[] }): LedgerEntry[] {
  const entries: LedgerEntry[] = [];
  for (const u of reward.awardedUnits) {
    if (u.amount <= 0) continue;
    entries.push(appendLedger({
      subjectMode: reward.subjectMode,
      unitType: u.unitType,
      amount: u.amount,
      direction: "EARN",
      contributionType: reward.contributionType,
      sourceEngine: opts.sourceEngine,
      sourceId: opts.sourceId,
      description: opts.description,
      safetyNotes: [...(opts.safetyNotes ?? []), ...reward.riskNotes],
    }));
  }
  return entries;
}

export function getLedger(mode: SubjectMode): LedgerEntry[] {
  return safeRead(mode);
}

export function clearLedger(mode: SubjectMode): void {
  safeWrite(mode, []);
}

export interface BalanceSummary {
  byUnit: Record<string, number>;
  totalEntries: number;
}

export function computeBalance(mode: SubjectMode): BalanceSummary {
  const arr = safeRead(mode);
  const byUnit: Record<string, number> = {};
  for (const e of arr) {
    const sign = e.direction === "EARN" ? 1 : e.direction === "SPEND" ? -1 : e.direction === "VOID" ? 0 : 1;
    byUnit[e.unitType] = normalizeAmount((byUnit[e.unitType] ?? 0) + sign * e.amount);
  }
  return { byUnit, totalEntries: arr.length };
}

export function getTodaySummary(mode: SubjectMode): { earnedToday: Record<string, number>; entriesToday: number; byContribution: Record<string, number> } {
  const arr = safeRead(mode);
  const today = new Date().toISOString().slice(0, 10);
  const filtered = arr.filter((e) => e.createdAt.startsWith(today));
  const earnedToday: Record<string, number> = {};
  const byContribution: Record<string, number> = {};
  for (const e of filtered) {
    earnedToday[e.unitType] = normalizeAmount((earnedToday[e.unitType] ?? 0) + (e.direction === "EARN" ? e.amount : 0));
    byContribution[e.contributionType] = (byContribution[e.contributionType] ?? 0) + 1;
  }
  return { earnedToday, entriesToday: filtered.length, byContribution };
}
