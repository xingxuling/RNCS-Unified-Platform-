export type VocalRangeId =
  | "LOW_MALE" | "MID_MALE" | "HIGH_MALE"
  | "LOW_FEMALE" | "MID_FEMALE" | "HIGH_FEMALE" | "UNKNOWN";

export interface VocalRangeDef {
  id: VocalRangeId;
  name: string;
  en: string;
  comfortRange: string;
  riskyRange: string;
  defaultKey: string;
}

export const VOCAL_RANGES: VocalRangeDef[] = [
  { id: "LOW_MALE", name: "男低", en: "Low Male", comfortRange: "E2 – C4", riskyRange: "F4 及以上", defaultKey: "C / D" },
  { id: "MID_MALE", name: "男中", en: "Mid Male", comfortRange: "G2 – E4", riskyRange: "A4 及以上", defaultKey: "D / E" },
  { id: "HIGH_MALE", name: "男高", en: "High Male", comfortRange: "B2 – G4", riskyRange: "C5 及以上", defaultKey: "E / F" },
  { id: "LOW_FEMALE", name: "女低", en: "Low Female", comfortRange: "E3 – C5", riskyRange: "F5 及以上", defaultKey: "F / G" },
  { id: "MID_FEMALE", name: "女中", en: "Mid Female", comfortRange: "G3 – E5", riskyRange: "A5 及以上", defaultKey: "G / A" },
  { id: "HIGH_FEMALE", name: "女高", en: "High Female", comfortRange: "B3 – G5", riskyRange: "C6 及以上", defaultKey: "A / B" },
  { id: "UNKNOWN", name: "未知", en: "Unknown", comfortRange: "—", riskyRange: "—", defaultKey: "C" },
];

export function getRange(id: VocalRangeId): VocalRangeDef {
  return VOCAL_RANGES.find(v => v.id === id) ?? VOCAL_RANGES[6];
}
