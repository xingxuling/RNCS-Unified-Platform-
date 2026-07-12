import type { SimulatedNpc } from "@/lib/sequence-world/simulation/worldSimulationCore";
import type { NpcMemory } from "@/lib/sequence-world/simulation/npcMemoryEngine";

export function NpcMemoryPanel({ npcs, memory }: { npcs: SimulatedNpc[]; memory: Record<string, NpcMemory> }) {
  return (
    <div className="aether-card p-4">
      <h3 className="font-display gold-text mb-2">NPC 记忆</h3>
      <div className="space-y-3 text-xs">
        {npcs.map(n => {
          const m = memory[n.npcId];
          const recent = m?.memories.slice(-3) ?? [];
          return (
            <div key={n.npcId} className="aether-card p-3">
              <div className="flex justify-between">
                <span className="font-medium text-foreground">{n.name} · {n.archetype}</span>
                <span className="text-muted-foreground">信任 {n.trust.toFixed(2)} · 记忆 {n.memoryCount}</span>
              </div>
              <div className="text-muted-foreground mt-1">目标：{n.currentGoal}　·　下一步：{n.likelyNextAction}</div>
              {recent.length > 0 && (
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  {recent.map(e => <li key={e.id}>· [{e.memoryType}] {e.summary} (w={e.emotionalWeight.toFixed(2)})</li>)}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
