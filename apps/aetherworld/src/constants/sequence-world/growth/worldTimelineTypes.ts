export const WORLD_TIMELINE_PHASES = ["BRANCHED","ACTIVE","DIVERGED","MERGED","ARCHIVED"] as const;
export type WorldTimelinePhase = typeof WORLD_TIMELINE_PHASES[number];
