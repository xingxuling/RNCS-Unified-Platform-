// Social Graph Engine
import type { NpcAgent } from "./npcAgentCore";
import type { SocialRelationType } from "@/constants/sequence-world/society/socialRelationTypes";
import { SOCIETY_HARD_LIMITS } from "@/constants/sequence-world/society/societySafetyRules";

export interface SocialNode {
  id: string;
  type: "USER" | "NPC" | "FACTION" | "INSTITUTION" | "ZONE" | "RESOURCE";
  label: string;
  influence: number;
}
export interface SocialEdge {
  from: string; to: string;
  relationType: SocialRelationType;
  strength: number; trust: number; conflict: number;
  history: string[];
}
export interface SocialCluster {
  clusterId: string; label: string; members: string[];
}
export interface SocialGraph {
  nodes: SocialNode[];
  edges: SocialEdge[];
  clusters: SocialCluster[];
  centralAgents: string[];
  isolatedAgents: string[];
  unstableRelations: string[];
}

function digitWeights(digits?: string[]) {
  const w: Record<string, number> = {};
  (digits ?? []).forEach(d => { w[d] = (w[d] ?? 0) + 1; });
  return w;
}

export function buildSocialGraph(input: {
  agents: NpcAgent[];
  factions?: { factionId: string; name: string }[];
  institutions?: { institutionId: string; name: string }[];
  sourceDigits?: string[];
  userId?: string;
}): SocialGraph {
  const w = digitWeights(input.sourceDigits);
  const nodes: SocialNode[] = input.agents.map(a => ({
    id: a.agentId, type: "NPC", label: a.name, influence: a.agencyLevel,
  }));
  (input.factions ?? []).forEach(f =>
    nodes.push({ id: f.factionId, type: "FACTION", label: f.name, influence: 0.7 }));
  (input.institutions ?? []).forEach(i =>
    nodes.push({ id: i.institutionId, type: "INSTITUTION", label: i.name, influence: 0.6 }));
  if (input.userId) nodes.push({ id: input.userId, type: "USER", label: "用户", influence: 0.8 });

  const edges: SocialEdge[] = [];
  const maxEdges = SOCIETY_HARD_LIMITS.maxSocialEdges;

  // simple pairwise edges based on digit weights
  for (let i = 0; i < input.agents.length && edges.length < maxEdges; i++) {
    for (let j = i + 1; j < input.agents.length && edges.length < maxEdges; j++) {
      const a = input.agents[i], b = input.agents[j];
      const score = (a.agencyLevel + b.agencyLevel) / 2;
      let rel: SocialRelationType = "ALLY";
      if ((w["2"] ?? 0) >= (w["5"] ?? 0)) rel = "ALLY";
      else if ((w["5"] ?? 0) > 0) rel = "RIVAL";
      if ((w["4"] ?? 0) >= 2 && j % 3 === 0) rel = "GOVERNANCE";
      if ((w["8"] ?? 0) >= 2 && j % 4 === 0) rel = "TRADE";
      if ((w["7"] ?? 0) >= 2 && j % 5 === 0) rel = "SECRET";
      if ((w["9"] ?? 0) >= 2 && j % 6 === 0) rel = "WORSHIP";
      if (score < 0.45) continue;
      const lowTrust: SocialRelationType[] = ["RIVAL","BETRAYAL"];
      const highConflict: SocialRelationType[] = ["RIVAL","COMPETITION"];
      edges.push({
        from: a.agentId, to: b.agentId, relationType: rel,
        strength: Math.min(1, score),
        trust: lowTrust.includes(rel) ? 0.2 : 0.6,
        conflict: highConflict.includes(rel) ? 0.6 : 0.1,
        history: [`基于数列权重生成的关系：${rel}`],
      });
    }
  }

  const degree: Record<string, number> = {};
  edges.forEach(e => { degree[e.from] = (degree[e.from] ?? 0) + 1; degree[e.to] = (degree[e.to] ?? 0) + 1; });
  const sorted = input.agents.map(a => ({ id: a.agentId, d: degree[a.agentId] ?? 0 }))
    .sort((x, y) => y.d - x.d);
  const central = sorted.slice(0, 3).map(s => s.id);
  const isolated = sorted.filter(s => s.d === 0).map(s => s.id);

  const clusters: SocialCluster[] = (input.factions ?? []).map(f => ({
    clusterId: f.factionId, label: f.name,
    members: input.agents.filter(a => a.factionId === f.factionId).map(a => a.agentId),
  }));

  const unstable = edges.filter(e => e.conflict > 0.5).map(e => `${e.from}↔${e.to}`).slice(0, 20);

  return { nodes, edges, clusters, centralAgents: central, isolatedAgents: isolated, unstableRelations: unstable };
}
