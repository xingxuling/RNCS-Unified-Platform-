// World Agent Society Engine — main orchestrator
import type { SimulatedWorldState, SimulatedNpc } from "../simulation/worldSimulationCore";
import type { SimulatedZone } from "../simulation/zoneEcologyEngine";
import { buildNpcAgents, type NpcAgent } from "./npcAgentCore";
import { generateFactions, type WorldFaction } from "./factionEngine";
import { generateInstitutions, type WorldInstitution } from "./institutionEngine";
import { buildSocialGraph, type SocialGraph } from "./socialGraphEngine";
import { buildEconomy, type WorldEconomyState } from "./worldEconomyEngine";
import { generateBeliefSystems, type WorldBeliefSystem } from "./beliefSystemEngine";
import { buildCollectiveMemory, type CollectiveMemoryState } from "./collectiveMemoryEngine";
import { runAutonomousEvents, type AutonomousWorldEvent } from "./autonomousEventEngine";
import { scanSocialConflicts, type SocialConflict } from "./socialConflictEngine";
import { computeCivilizationPhase, type CivilizationPhaseState } from "./civilizationPhaseEngine";
import { buildUserInfluence, type UserInfluenceState } from "./userInfluenceEngine";
import { compressSociety, type SocietyCompressionResult, type SocietyCompressionTarget } from "./societyCompressionEngine";
import { checkSocietySafety, SOCIETY_SAFETY_NOTE } from "./worldSocietySafetyGuard";
import { SOCIETY_HARD_LIMITS } from "@/constants/sequence-world/society/societySafetyRules";

export interface WorldAgentSocietyInput {
  worldId: string;
  currentWorldState: SimulatedWorldState;
  existingNpcs?: SimulatedNpc[];
  zones: SimulatedZone[];
  resources?: Record<string, number>;
  causalChain?: { id: string; title?: string }[];
  canonEntries?: { entryId: string; title: string }[];
  simulationMode?: "DEMO" | "PERSONAL_WORLD" | "CREATOR_WORLD" | "GAME_WORLD" | "FOUNDER_SIMULATION";
  societyMode: "SAFE" | "CREATIVE" | "CIVILIZATION" | "FOUNDER";
  userAction?: string;
  userId?: string;
  isFounder?: boolean;
  isFull60?: boolean;
  willPublic?: boolean;
  tickCount?: number;
  sourceDigits?: string[];
  maxAgents?: number;
  maxFactions?: number;
  maxInstitutions?: number;
  autonomousEventsEnabled?: boolean;
  compressionTarget?: SocietyCompressionTarget;
}

export interface WorldAgentSocietyResult {
  worldId: string;
  societyMode: string;
  npcAgents: NpcAgent[];
  socialGraph: SocialGraph;
  factions: WorldFaction[];
  institutions: WorldInstitution[];
  economy: WorldEconomyState;
  beliefSystems: WorldBeliefSystem[];
  collectiveMemory: CollectiveMemoryState;
  autonomousEvents: AutonomousWorldEvent[];
  socialConflicts: SocialConflict[];
  civilizationPhase: CivilizationPhaseState;
  userInfluence: UserInfluenceState;
  societyCompression?: SocietyCompressionResult;
  safetyNotes: string[];
  metadata: {
    version: "0.4.0";
    generatedAt: string;
    subjectMode: string;
  };
}

export function runWorldAgentSociety(input: WorldAgentSocietyInput): WorldAgentSocietyResult {
  const safety = checkSocietySafety({
    societyMode: input.societyMode,
    npcCount: input.maxAgents,
    factionCount: input.maxFactions,
    isFull60: input.isFull60,
    willPublic: input.willPublic,
  });

  const maxAgents = Math.min(input.maxAgents ?? 12, SOCIETY_HARD_LIMITS.maxNpcAgents);
  const maxFactions = Math.min(input.maxFactions ?? 5, SOCIETY_HARD_LIMITS.maxFactions);
  const maxInstitutions = Math.min(input.maxInstitutions ?? 5, SOCIETY_HARD_LIMITS.maxInstitutions);

  const agents = buildNpcAgents({
    worldId: input.worldId,
    sourceDigits: input.sourceDigits,
    zones: input.zones.map(z => ({ id: z.zoneId, name: z.name })),
    maxAgents,
    existingNames: (input.existingNpcs ?? []).map(n => n.name),
  });
  const factions = generateFactions({
    worldId: input.worldId, sourceDigits: input.sourceDigits,
    maxFactions, zones: input.zones.map(z => ({ id: z.zoneId, name: z.name })),
  });
  // assign agents to factions round-robin
  agents.forEach((a, i) => { if (factions.length) { a.factionId = factions[i % factions.length].factionId; factions[i % factions.length].members.push(a.agentId); } });

  const institutions = generateInstitutions({
    worldId: input.worldId, sourceDigits: input.sourceDigits,
    factions: factions.map(f => ({ factionId: f.factionId, name: f.name })),
    maxInstitutions,
  });
  // assign agents to institutions: top members
  institutions.forEach((inst, i) => {
    const member = agents[i % Math.max(1, agents.length)];
    if (member) { inst.members.push(member.agentId); member.institutionIds.push(inst.institutionId); }
  });

  const economy = buildEconomy({
    worldId: input.worldId, sourceDigits: input.sourceDigits,
    zones: input.zones.map(z => ({ id: z.zoneId, name: z.name })),
  });

  const beliefs = generateBeliefSystems({ worldId: input.worldId, sourceDigits: input.sourceDigits });
  const memory = buildCollectiveMemory({
    worldId: input.worldId,
    events: (input.causalChain ?? []).map(c => ({ eventId: c.id, title: c.title ?? c.id })),
    sourceDigits: input.sourceDigits,
  });

  const tick = input.tickCount ?? input.currentWorldState.tick ?? 0;
  const autonomousEvents = runAutonomousEvents({
    worldId: input.worldId, tick, agents, factions,
    sourceDigits: input.sourceDigits,
    enabled: input.autonomousEventsEnabled !== false,
  });

  const socialGraph = buildSocialGraph({
    agents, factions: factions.map(f => ({ factionId: f.factionId, name: f.name })),
    institutions: institutions.map(i => ({ institutionId: i.institutionId, name: i.name })),
    sourceDigits: input.sourceDigits, userId: input.userId,
  });

  const conflicts = scanSocialConflicts({
    worldId: input.worldId, agents, factions,
    economyTension: economy.economicTension, sourceDigits: input.sourceDigits,
  });

  const civilization = computeCivilizationPhase({
    agentsCount: agents.length, factions, institutions, sourceDigits: input.sourceDigits,
  });

  const userInfluence = buildUserInfluence({
    userId: input.userId, isFounder: input.isFounder,
    factionIds: factions.map(f => f.factionId),
  });

  let compression: SocietyCompressionResult | undefined;
  if (input.compressionTarget) {
    compression = compressSociety({
      target: input.compressionTarget,
      agents, factions, institutions, conflicts, civilization,
    });
  }

  const safetyNotes = [...safety.notes];
  if (!safety.ok) safetyNotes.push("已根据安全策略调整本次社会生成。");

  return {
    worldId: input.worldId,
    societyMode: input.societyMode,
    npcAgents: agents,
    socialGraph,
    factions, institutions, economy,
    beliefSystems: beliefs,
    collectiveMemory: memory,
    autonomousEvents,
    socialConflicts: conflicts,
    civilizationPhase: civilization,
    userInfluence,
    societyCompression: compression,
    safetyNotes,
    metadata: {
      version: "0.4.0",
      generatedAt: new Date().toISOString(),
      subjectMode: input.simulationMode ?? "DEMO",
    },
  };
}

export { SOCIETY_SAFETY_NOTE };
