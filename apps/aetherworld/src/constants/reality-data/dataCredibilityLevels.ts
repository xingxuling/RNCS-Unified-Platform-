export type DataCredibilityLevel = "LOW" | "MEDIUM" | "HIGH" | "OFFICIAL" | "UNKNOWN";

export const DATA_CREDIBILITY_LEVELS: { id: DataCredibilityLevel; label: string; min: number; max: number }[] = [
  { id: "UNKNOWN",  label: "未知",   min: 0,    max: 0.24 },
  { id: "LOW",      label: "低",     min: 0.25, max: 0.5 },
  { id: "MEDIUM",   label: "中",     min: 0.51, max: 0.74 },
  { id: "HIGH",     label: "高",     min: 0.75, max: 0.89 },
  { id: "OFFICIAL", label: "官方",   min: 0.9,  max: 1 },
];

export function levelForScore(score: number): DataCredibilityLevel {
  for (const lv of DATA_CREDIBILITY_LEVELS) if (score >= lv.min && score <= lv.max) return lv.id;
  return "UNKNOWN";
}
