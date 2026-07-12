import { createFileRoute, Link } from "@tanstack/react-router";
import { loadAllWorldStates } from "@/lib/worldMemoryEngine";
import { CharacterGenesisCard } from "@/components/CharacterGenesisCard";
import { WorldSeedCard } from "@/components/WorldSeedCard";

export const Route = createFileRoute("/world-character")({
  head: () => ({ meta: [{ title: "虚拟世界角色｜Virtual World" }] }),
  component: () => {
    const state = loadAllWorldStates()[0];
    return (
      <div className="space-y-4 max-w-5xl mx-auto p-4 lg:p-6">
        <h1 className="font-display text-2xl gold-text">虚拟世界角色 · Character</h1>
        {state ? (
          <>
            <CharacterGenesisCard character={state.character} />
            <WorldSeedCard seed={state.seed} />
          </>
        ) : (
          <div className="aether-card p-6 text-sm text-muted-foreground">
            尚未生成。<Link to="/virtual-world" className="text-primary underline ml-1">前往生成</Link>
          </div>
        )}
      </div>
    );
  },
});
