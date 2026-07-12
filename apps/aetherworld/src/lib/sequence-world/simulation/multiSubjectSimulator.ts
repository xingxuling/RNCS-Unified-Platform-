// Multi-Subject Simulator
import type { SequenceCoreProfile } from "../sequenceCoreEngine";

export interface SimulatedSubject {
  id: string;
  name: string;
  subjectType: "USER" | "NPC" | "FACTION" | "SYSTEM_AGENT" | "FOUNDER_ECHO";
  sequenceProfile?: SequenceCoreProfile;
  role: string;
  currentGoal: string;
  trust: number;
  conflict: number;
  agency: number;
}

export type RelationMatrix = Record<string, Record<string, { trust: number; conflict: number }>>;

export interface MultiSubjectSimulationResult {
  relationMatrix: RelationMatrix;
  alliances: string[];
  conflicts: string[];
  likelyEncounters: string[];
  nextInteractionSuggestion: string;
}

export function simulateRelations(subjects: SimulatedSubject[], dominantDigits: string[] = []): MultiSubjectSimulationResult {
  const m: RelationMatrix = {};
  for (const a of subjects) {
    m[a.id] = {};
    for (const b of subjects) {
      if (a.id === b.id) continue;
      let trust = (a.trust + b.trust) / 2;
      let conflict = (a.conflict + b.conflict) / 2;
      if (dominantDigits.includes("2")) trust += 0.1;
      if (dominantDigits.includes("5")) conflict += 0.15;
      if (dominantDigits.includes("4")) trust += 0.05;
      m[a.id][b.id] = { trust: clamp(trust), conflict: clamp(conflict) };
    }
  }
  const alliances: string[] = [];
  const conflicts: string[] = [];
  const encounters: string[] = [];
  for (const a of subjects) for (const b of subjects) {
    if (a.id >= b.id) continue;
    const r = m[a.id]?.[b.id];
    if (!r) continue;
    if (r.trust > 0.6 && r.conflict < 0.3) alliances.push(`${a.name} ↔ ${b.name}`);
    if (r.conflict > 0.6) conflicts.push(`${a.name} ⚔ ${b.name}`);
    if (r.trust + r.conflict > 0.7) encounters.push(`${a.name} 与 ${b.name} 可能很快互动`);
  }
  return {
    relationMatrix: m, alliances, conflicts, likelyEncounters: encounters,
    nextInteractionSuggestion: alliances[0] ? `推动 ${alliances[0]} 的联盟事件` : conflicts[0] ? `处理 ${conflicts[0]} 的冲突` : "观察一轮",
  };
}

function clamp(n: number) { return Math.max(0, Math.min(1, n)); }
