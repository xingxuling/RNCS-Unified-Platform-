// Belief System Engine
import { BELIEF_TYPES, BELIEF_LABELS, BELIEF_FICTION_NOTE, type BeliefType } from "@/constants/sequence-world/society/beliefTypes";

export interface WorldBeliefSystem {
  beliefId: string;
  name: string;
  beliefType: BeliefType;
  coreMyth: string;
  values: string[];
  taboos: string[];
  rituals: string[];
  followers: string[];
  opposedBeliefs: string[];
  influenceLevel: number;
  fictionDisclaimer: string;
}

const MYTH: Record<BeliefType, string> = {
  VOID_BELIEF: "万物终归虚空，方有再起之机。",
  WIND_CHANGE_BELIEF: "风过之处，旧形溶解，新形生发。",
  FOUNDER_SOVEREIGNTY: "创始者立根，世界由此显形。",
  ARCHIVE_MEMORY: "凡被记载者，方得长存。",
  LIFE_CARRYING: "承载生命者，承载世界。",
  STAR_ENDSTATE: "群星之终，是新文明的开始。",
  RULE_ORDER: "唯有规则，方能让混沌成器。",
};

export function generateBeliefSystems(input: {
  worldId: string;
  sourceDigits?: string[];
  maxBeliefs?: number;
}): WorldBeliefSystem[] {
  const digits = input.sourceDigits ?? [];
  const pref: BeliefType[] = [];
  if (digits.includes("0")) pref.push("VOID_BELIEF","ARCHIVE_MEMORY");
  if (digits.includes("5")) pref.push("WIND_CHANGE_BELIEF");
  if (digits.includes("1")) pref.push("FOUNDER_SOVEREIGNTY");
  if (digits.includes("6")) pref.push("LIFE_CARRYING");
  if (digits.includes("9")) pref.push("STAR_ENDSTATE");
  if (digits.includes("4")) pref.push("RULE_ORDER");
  const list: BeliefType[] = [];
  const max = input.maxBeliefs ?? 4;
  for (const b of [...pref, ...BELIEF_TYPES]) {
    if (list.length >= max) break;
    if (!list.includes(b)) list.push(b);
  }
  return list.map((b, i) => ({
    beliefId: `${input.worldId}-belief-${i}`,
    name: BELIEF_LABELS[b],
    beliefType: b,
    coreMyth: MYTH[b],
    values: ["守护","传承"],
    taboos: ["破坏正典","违背誓约"],
    rituals: ["每月一次集体仪式"],
    followers: [],
    opposedBeliefs: [],
    influenceLevel: 0.5,
    fictionDisclaimer: BELIEF_FICTION_NOTE,
  }));
}
