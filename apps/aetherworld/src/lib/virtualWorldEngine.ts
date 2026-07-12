// 虚拟世界引擎 — 主编排器
import type { SubjectModel } from "./types";
import { compileVirtualWorldSeed, type VirtualWorldSeedResult, type VirtualWorldSeedInput } from "./virtualWorldSeedCompiler";
import { generateCharacter, type GeneratedCharacter } from "./characterGenesisEngine";
import { generateWorldMap, type WorldZone } from "./worldMapGenerationEngine";
import { generateQuests, type GeneratedQuest } from "./questGenerationEngine";
import { generateNPCs, type GeneratedNPC } from "./npcRelationshipEngine";
import { generateCausalityChains, type CausalityChain } from "./causalityChainEngine";
import { saveWorldState } from "./worldMemoryEngine";

export interface WorldLaw {
  id: string;
  name: string;
  userFriendlyName: string;
  explanation: string;
  technicalBasis: string[];
  gameplayMeaning: string;
  relatedConstants: string[];
}

export interface VirtualWorldState {
  worldId: string;
  subjectId: string;
  worldName: string;
  worldMode: string;
  generatedAt: string;
  lastRecalculatedAt: string;
  stale?: boolean;
  seed: VirtualWorldSeedResult;
  worldLaws: WorldLaw[];
  character: GeneratedCharacter;
  zones: WorldZone[];
  quests: GeneratedQuest[];
  npcs: GeneratedNPC[];
  causalityChains: CausalityChain[];
  worldLevel: number;
  stabilityScore: number;
  chaosScore: number;
}

export interface GenerateVirtualWorldInput extends VirtualWorldSeedInput {
  worldName?: string;
}

const LAW_TEMPLATES: Omit<WorldLaw, "id">[] = [
  { name: "Time Law", userFriendlyName: "时间法则",
    explanation: "世界中的周期、窗口、节奏。",
    technicalBasis: ["天域常数", "十二长生时间相位"],
    gameplayMeaning: "决定任务触发节奏。", relatedConstants: ["TimePhase", "TianDomain"] },
  { name: "Field Law", userFriendlyName: "场域法则",
    explanation: "资源、环境、承载力。",
    technicalBasis: ["地域常数"],
    gameplayMeaning: "决定资源与区域承载。", relatedConstants: ["DiDomain"] },
  { name: "Human Law", userFriendlyName: "人域法则",
    explanation: "人际、关系、阵营。",
    technicalBasis: ["人域常数"],
    gameplayMeaning: "决定 NPC 与关系线。", relatedConstants: ["RenDomain"] },
  { name: "Mainline Law", userFriendlyName: "主线法则",
    explanation: "使命、长期方向、象征。",
    technicalBasis: ["神域常数"],
    gameplayMeaning: "决定主线任务与世界长期方向。", relatedConstants: ["ShenDomain"] },
  { name: "Change Law", userFriendlyName: "变化法则",
    explanation: "突发事件、转向、分支。",
    technicalBasis: ["风域常数"],
    gameplayMeaning: "决定突发事件与分支变化。", relatedConstants: ["FengDomain"] },
  { name: "Feedback Law", userFriendlyName: "反馈法则",
    explanation: "世界如何根据玩家行动演化。",
    technicalBasis: ["回验权重"],
    gameplayMeaning: "回验越多，世界越精准。", relatedConstants: ["FeedbackWeights"] },
  { name: "Risk Law", userFriendlyName: "风险法则",
    explanation: "陷阱、噪声、误读、过载。",
    technicalBasis: ["噪声常数", "风险事件"],
    gameplayMeaning: "决定危险区与伪信号。", relatedConstants: ["NoiseConstants"] },
  { name: "Action Law", userFriendlyName: "行动法则",
    explanation: "玩家适合的行动方式。",
    technicalBasis: ["动作许可矩阵"],
    gameplayMeaning: "决定进/守/转/断/恢复/小步测试。", relatedConstants: ["ActionPermissions"] },
];

function buildLaws(seed: VirtualWorldSeedResult): WorldLaw[] {
  return LAW_TEMPLATES.map((t, i) => ({ ...t, id: `law-${i}-${seed.seedSignature}` }));
}

function score(zones: WorldZone[]): { stability: number; chaos: number; level: number } {
  const open = zones.filter(z => z.state === "OPEN").length;
  const danger = zones.filter(z => z.state === "DANGEROUS").length;
  const locked = zones.filter(z => z.state === "LOCKED").length;
  const stability = Math.max(0, Math.min(100, 40 + open * 6 - danger * 8 - locked * 2));
  const chaos = Math.max(0, Math.min(100, 30 + danger * 15));
  const level = Math.max(1, Math.round(open / 2));
  return { stability, chaos, level };
}

export function generateVirtualWorld(input: GenerateVirtualWorldInput, subject?: SubjectModel | null): VirtualWorldState {
  const subj = input.subject ?? subject ?? null;
  const seed = compileVirtualWorldSeed({ ...input, subject: subj });
  const character = generateCharacter(seed, subj?.name);
  const zones = generateWorldMap(seed);
  const quests = generateQuests(zones, seed);
  const npcs = generateNPCs(seed, zones);
  const causality = generateCausalityChains(zones, quests, npcs);
  const laws = buildLaws(seed);
  const sc = score(zones);
  const now = new Date().toISOString();
  const worldId = `world-${seed.seedSignature}-${input.selectedWorldMode}`;
  const worldName = input.worldName ?? `${character.className}的${seed.seedName}世界`;

  const state: VirtualWorldState = {
    worldId,
    subjectId: subj?.id ?? "anonymous",
    worldName,
    worldMode: input.selectedWorldMode,
    generatedAt: now,
    lastRecalculatedAt: now,
    seed,
    worldLaws: laws,
    character,
    zones,
    quests,
    npcs,
    causalityChains: causality,
    worldLevel: sc.level,
    stabilityScore: sc.stability,
    chaosScore: sc.chaos,
  };
  saveWorldState(state);
  return state;
}

export function recalculateWorld(prev: VirtualWorldState): VirtualWorldState {
  return generateVirtualWorld({
    subjectMode: (prev.seed.base.signature ? "LIGHT_20" : "DEMO") as any,
    subject: null,
    selectedWorldMode: prev.worldMode,
    worldName: prev.worldName,
  });
}
