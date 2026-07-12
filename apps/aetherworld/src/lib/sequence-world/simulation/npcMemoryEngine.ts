// NPC Memory Engine — NPC 记忆
import { DEFAULT_DECAY_RATE, NPC_MEMORY_TYPES, type NpcMemoryTypeId } from "@/constants/sequence-world/simulation/npcMemoryTypes";

export interface NpcMemoryEntry {
  id: string;
  tick: number;
  memoryType: NpcMemoryTypeId;
  summary: string;
  emotionalWeight: number;
  decayRate: number;
}

export interface NpcMemory {
  npcId: string;
  memories: NpcMemoryEntry[];
  trustHistory: number[];
  conflictHistory: number[];
  lastInteractionTick: number;
  rememberedUserActions: string[];
  hiddenKnowledge: string[];
}

const STORE_KEY = "aether.world.sim.npcMemory.v1";

export function createMemory(npcId: string): NpcMemory {
  return { npcId, memories: [], trustHistory: [], conflictHistory: [],
    lastInteractionTick: 0, rememberedUserActions: [], hiddenKnowledge: [] };
}

export function appendMemory(mem: NpcMemory, tick: number, type: NpcMemoryTypeId, summary: string, dominantDigits: string[] = []): NpcMemory {
  const base = NPC_MEMORY_TYPES.find(m => m.id === type)?.baseEmotion ?? 0;
  // 7 高隐藏知识增加；2 高更看重关系；4 高更看重规则违背
  const hidden = dominantDigits.includes("7") && (type === "SECRET" || type === "BETRAYAL");
  const entry: NpcMemoryEntry = {
    id: `mem-${tick}-${Math.random().toString(36).slice(2, 7)}`,
    tick, memoryType: type, summary,
    emotionalWeight: base,
    decayRate: DEFAULT_DECAY_RATE,
  };
  const next: NpcMemory = {
    ...mem,
    memories: [...mem.memories, entry],
    lastInteractionTick: tick,
    trustHistory: [...mem.trustHistory, Math.max(-1, Math.min(1, (mem.trustHistory.at(-1) ?? 0) + base * 0.4))],
    conflictHistory: [...mem.conflictHistory, base < 0 ? 1 : 0],
    hiddenKnowledge: hidden ? [...mem.hiddenKnowledge, summary] : mem.hiddenKnowledge,
  };
  return next;
}

export function decayMemory(mem: NpcMemory): NpcMemory {
  return {
    ...mem,
    memories: mem.memories.map(e => ({
      ...e,
      emotionalWeight: Math.sign(e.emotionalWeight) * Math.max(0, Math.abs(e.emotionalWeight) - e.decayRate),
    })).filter(e => Math.abs(e.emotionalWeight) > 0.02),
  };
}

export function saveMemory(all: Record<string, NpcMemory>) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(all)); } catch {}
}
export function loadMemory(): Record<string, NpcMemory> {
  try { const v = localStorage.getItem(STORE_KEY); return v ? JSON.parse(v) : {}; } catch { return {}; }
}
