// World Zone Engine
import type { SequenceCoreProfile } from "./sequenceCoreEngine";
import { DIGIT_ZONE_AFFINITY, ZONE_TYPE_LABEL, type SeqWorldZoneType } from "@/constants/sequence-world/worldZoneTypes";
import { generateRenderProfile, type RenderProfile } from "./renderProfileEngine";
import { generateSemanticPhysics, type SemanticPhysicsProfile } from "./semanticPhysicsEngine";

export interface WorldZoneProfile {
  zoneName: string;
  zoneType: SeqWorldZoneType;
  zoneLabel: string;
  atmosphere: string;
  dominantDigits: string[];
  visualStyle: RenderProfile;
  physicsStyle: SemanticPhysicsProfile;
  availableQuests: string[];
  residentNpcTypes: string[];
  risks: string[];
}

const ATMOSPHERE: Record<SeqWorldZoneType, string> = {
  VOID_GATE: "深黑、静默、归档之门",
  WIND_FIELD: "高速风场，事件频发",
  ARCHIVE_LIBRARY: "尘封纸页与潜意识符号",
  FOUNDER_CONSOLE: "高位控制塔，规则与主权交汇",
  RELATION_HARBOR: "灯火与对话，关系节点聚集",
  SYMBOL_CITY: "符号霓虹与信息流",
  RECOVERY_GARDEN: "柔光、绿意、缓慢呼吸",
  RESOURCE_FORGE: "高温熔炉与重力金属",
  CIVILIZATION_RUIN: "古老遗迹与星辉残响",
  EVENT_STORM: "雷鸣闪光，剧烈相变",
};

const ZONE_NPC: Record<SeqWorldZoneType, string[]> = {
  VOID_GATE: ["Archivist","Observer"],
  WIND_FIELD: ["Trickster","Messenger"],
  ARCHIVE_LIBRARY: ["Archivist","Observer"],
  FOUNDER_CONSOLE: ["Founder Echo","Judge"],
  RELATION_HARBOR: ["Lover","Ally","Messenger"],
  SYMBOL_CITY: ["Messenger","Trickster"],
  RECOVERY_GARDEN: ["Ally","Lover"],
  RESOURCE_FORGE: ["Merchant","Gatekeeper"],
  CIVILIZATION_RUIN: ["Judge","Founder Echo"],
  EVENT_STORM: ["Trickster","Messenger"],
};

export function generateWorldZones(core: SequenceCoreProfile, max = 4): WorldZoneProfile[] {
  const seen = new Set<SeqWorldZoneType>();
  const zones: WorldZoneProfile[] = [];

  for (const d of core.dominantDigits) {
    for (const z of DIGIT_ZONE_AFFINITY[d] ?? []) {
      if (seen.has(z)) continue;
      seen.add(z);
      zones.push(buildZone(z, d, core));
      if (zones.length >= max) return zones;
    }
  }
  if (zones.length === 0) zones.push(buildZone("WIND_FIELD", "5", core));
  return zones;
}

function buildZone(z: SeqWorldZoneType, digit: string, core: SequenceCoreProfile): WorldZoneProfile {
  // 子核心：把该数字作为新主导
  const subCore = { ...core, dominantDigits: [digit, ...core.dominantDigits.filter(x => x !== digit)].slice(0, 3) };
  return {
    zoneName: `${ZONE_TYPE_LABEL[z]} · ${core.name}`,
    zoneType: z,
    zoneLabel: ZONE_TYPE_LABEL[z],
    atmosphere: ATMOSPHERE[z],
    dominantDigits: subCore.dominantDigits,
    visualStyle: generateRenderProfile(subCore),
    physicsStyle: generateSemanticPhysics(subCore),
    availableQuests: ["主线推进", "支线探索", "现实锚点小任务"],
    residentNpcTypes: ZONE_NPC[z],
    risks: z === "EVENT_STORM" ? ["噪声偏高","伪信号风险"] : z === "VOID_GATE" ? ["陷入停滞","信息归零"] : ["小规模冲突"],
  };
}
