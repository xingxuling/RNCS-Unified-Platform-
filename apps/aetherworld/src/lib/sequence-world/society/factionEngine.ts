// Faction Engine
import { FACTION_TYPES, FACTION_LABELS, type FactionType } from "@/constants/sequence-world/society/factionTypes";

export interface WorldFaction {
  factionId: string;
  name: string;
  factionType: FactionType;
  ideology: string;
  primaryGoal: string;
  resources: string[];
  controlledZones: string[];
  members: string[];
  allies: string[];
  enemies: string[];
  stability: number;
  aggression: number;
  diplomacy: number;
  secrecy: number;
}

const IDEOLOGY: Record<FactionType, string> = {
  FOUNDER_ORDER: "守护创始秩序与主权根源",
  ARCHIVE_GUILD: "保存与归档世界全部知识",
  WIND_WANDERERS: "追逐变化与流动的边界",
  RESOURCE_FORGE: "锻造与积累物质能量",
  SYMBOL_CITY_COUNCIL: "以符号与文本治理城邦",
  LIFE_GARDEN_KEEPERS: "守护生命循环与照护",
  VOID_SECT: "回到归零的虚空之道",
  STAR_CIVILIZATION_RELIC: "重启古代星海文明",
  MARKET_LEAGUE: "构建公平贸易网络",
  REBEL_CLUSTER: "挑战既有规则与权力结构",
};

export function generateFactions(input: {
  worldId: string;
  sourceDigits?: string[];
  maxFactions: number;
  zones: { id?: string; name?: string }[];
}): WorldFaction[] {
  const max = Math.max(0, Math.min(input.maxFactions, FACTION_TYPES.length));
  const types: FactionType[] = [];
  const digits = input.sourceDigits ?? [];
  // pick types influenced by digits
  const prefer: FactionType[] = [];
  if (digits.includes("1")) prefer.push("FOUNDER_ORDER");
  if (digits.includes("0")) prefer.push("ARCHIVE_GUILD","VOID_SECT");
  if (digits.includes("5")) prefer.push("WIND_WANDERERS","REBEL_CLUSTER");
  if (digits.includes("8")) prefer.push("RESOURCE_FORGE","MARKET_LEAGUE");
  if (digits.includes("4")) prefer.push("SYMBOL_CITY_COUNCIL");
  if (digits.includes("6")) prefer.push("LIFE_GARDEN_KEEPERS");
  if (digits.includes("9")) prefer.push("STAR_CIVILIZATION_RELIC");
  for (const t of [...prefer, ...FACTION_TYPES]) {
    if (types.length >= max) break;
    if (!types.includes(t)) types.push(t);
  }
  const factions: WorldFaction[] = types.map((t, i) => ({
    factionId: `${input.worldId}-faction-${i}`,
    name: FACTION_LABELS[t],
    factionType: t,
    ideology: IDEOLOGY[t],
    primaryGoal: `${IDEOLOGY[t]}（中长期目标）`,
    resources: [],
    controlledZones: input.zones[i] ? [input.zones[i].id ?? input.zones[i].name ?? "zone"] : [],
    members: [],
    allies: [],
    enemies: [],
    stability: 0.6, aggression: 0.3, diplomacy: 0.5, secrecy: 0.3,
  }));
  // simple ally/enemy wiring
  for (let i = 0; i < factions.length; i++) {
    const next = factions[(i + 1) % factions.length];
    factions[i].allies.push(next.factionId);
    const opp = factions[(i + 2) % factions.length];
    if (opp.factionId !== factions[i].factionId) factions[i].enemies.push(opp.factionId);
  }
  return factions;
}
