import { VALUE_UNITS, type ValueUnitId, type ValueUnit } from "@/constants/currency/valueUnitTypes";

export function listValueUnits(includeFounder = false): ValueUnit[] {
  return VALUE_UNITS.filter((u) => includeFounder || !u.founderOnly);
}

export function unitById(id: ValueUnitId): ValueUnit | undefined {
  return VALUE_UNITS.find((u) => u.id === id);
}

export function isFounderUnit(id: ValueUnitId): boolean {
  return !!VALUE_UNITS.find((u) => u.id === id)?.founderOnly;
}

/** 把积分数量做温和归一化，防止异常膨胀。*/
export function normalizeAmount(raw: number): number {
  if (!Number.isFinite(raw) || raw < 0) return 0;
  return Math.round(Math.min(raw, 9999) * 100) / 100;
}
