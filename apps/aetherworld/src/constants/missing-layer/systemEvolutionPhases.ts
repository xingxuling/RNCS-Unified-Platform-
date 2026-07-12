export const SYSTEM_EVOLUTION_PHASES = [
  "BOOTSTRAP",
  "EXPANSION",
  "INTEGRATION",
  "GOVERNANCE",
  "COMMERCIALIZATION",
  "CONSOLIDATION",
  "ARCHIVE",
] as const;
export type SystemEvolutionPhase = (typeof SYSTEM_EVOLUTION_PHASES)[number];

export const SYSTEM_EVOLUTION_PHASE_LABELS: Record<SystemEvolutionPhase, string> = {
  BOOTSTRAP: "起步",
  EXPANSION: "扩张",
  INTEGRATION: "整合",
  GOVERNANCE: "治理",
  COMMERCIALIZATION: "商业化",
  CONSOLIDATION: "收束",
  ARCHIVE: "归档",
};
