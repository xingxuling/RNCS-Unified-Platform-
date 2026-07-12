// Historical Dispute Engine
import type { HistoricalEvent } from "./historicalTimelineEngine";

export const DISPUTE_TYPES = [
  "BLAME","LEGITIMACY","ORIGIN","BETRAYAL","RESOURCE_RIGHT",
  "SACRED_MEANING","HISTORICAL_ERASURE","FOUNDER_INTERPRETATION",
] as const;
export type DisputeType = typeof DISPUTE_TYPES[number];

export interface HistoricalDispute {
  disputeId: string;
  eventId: string;
  disputeType: DisputeType;
  parties: string[];
  interpretations: { partyId: string; interpretation: string; bias: string }[];
  resolutionStatus: "UNRESOLVED" | "ARCHIVED" | "CANONIZED" | "SPLIT_TIMELINE";
}

export function buildHistoricalDisputes(input: {
  worldId: string; events: HistoricalEvent[];
  factions: { factionId: string; name: string }[];
  maxDisputes?: number;
}): HistoricalDispute[] {
  const max = input.maxDisputes ?? 6;
  const disputable = input.events.filter(e =>
    ["WAR","BELIEF_SPLIT","INSTITUTION_REFORM","CIVILIZATION_COLLAPSE","USER_INTERVENTION"].includes(e.eventType));
  const out: HistoricalDispute[] = [];
  for (let i = 0; i < Math.min(max, disputable.length); i++) {
    const e = disputable[i];
    const type = DISPUTE_TYPES[i % DISPUTE_TYPES.length];
    const parties = input.factions.slice(0, 2);
    out.push({
      disputeId: `${input.worldId}-dispute-${i}`,
      eventId: e.eventId,
      disputeType: type,
      parties: parties.map(p => p.factionId),
      interpretations: parties.map((p, j) => ({
        partyId: p.factionId,
        interpretation: `${p.name} 视角：将 ${e.title} 解读为${j === 0 ? "正当之举" : "不可接受的转折"}。`,
        bias: j === 0 ? "favorable" : "critical",
      })),
      resolutionStatus: "UNRESOLVED",
    });
  }
  return out;
}
