import { createFileRoute, Link } from "@tanstack/react-router";
import { loadAllWorldStates } from "@/lib/worldMemoryEngine";
import { NPCRelationshipMap } from "@/components/NPCRelationshipMap";

export const Route = createFileRoute("/world-npcs")({
  head: () => ({ meta: [{ title: "虚拟世界NPC关系网｜Virtual World" }] }),
  component: () => {
    const state = loadAllWorldStates()[0];
    return (
      <div className="space-y-4 max-w-6xl mx-auto p-4 lg:p-6">
        <h1 className="font-display text-2xl gold-text">NPC 关系网 · NPC Network</h1>
        {state ? <NPCRelationshipMap npcs={state.npcs} /> : (
          <div className="aether-card p-6 text-sm text-muted-foreground">
            尚未生成。<Link to="/virtual-world" className="text-primary underline ml-1">前往生成</Link>
          </div>
        )}
      </div>
    );
  },
});
