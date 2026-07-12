export const MODEL_COMPLEXITY_LEVELS = [
  { id: "MINIMAL",  label: "最小化",   maxFields: 5  },
  { id: "STANDARD", label: "标准",     maxFields: 12 },
  { id: "RICH",     label: "丰富",     maxFields: 24 },
  { id: "FOUNDER",  label: "Founder", maxFields: 60 },
] as const;

export type ModelComplexityLevel = typeof MODEL_COMPLEXITY_LEVELS[number]["id"];
