// 个人世界计算法 — 主输入/输出合约
import type { WorldRule } from "./worldRuleGenerator";
import type { WorldZone, WorldEventMap } from "./worldEventMapGenerator";
import type { UserRole } from "./worldArchetypeResolver";
import type { WorldArchetype } from "@/constants/worldArchetypes";

export interface PersonalWorldInput {
  subjectMode: "DEMO" | "LIGHT_20" | "FULL_60" | "IMPORTED";
  activeSubjectId?: string;
  selectedMode: string;
  languageLevel?: string;
  narrativeStyle?: string;
}

export interface PersonalWorldResult {
  worldName: string;
  worldSubtitle: string;
  worldArchetype: WorldArchetype;
  worldSeedSignature: string;
  dominantDomain: string;
  weakestDomain: string;
  dominantNumber: number;
  missingNumbers: number[];
  worldRules: WorldRule[];
  worldZones: WorldZone[];
  eventMap: WorldEventMap;
  userRole: UserRole;
  actionStyle: string;
  riskPattern: string;
  growthPath: string;
  unopenedZones: string[];
  narrativeSummary: string;
  safetyNote: string;
  generatedAt: string;
}
