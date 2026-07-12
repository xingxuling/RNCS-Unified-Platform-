import { createFileRoute, Link } from "@tanstack/react-router";
import { loadAllWorldStates } from "@/lib/worldMemoryEngine";
import { QuestBoard } from "@/components/QuestBoard";

export const Route = createFileRoute("/world-quests")({
  head: () => ({ meta: [{ title: "虚拟世界任务板｜Virtual World" }] }),
  component: () => {
    const state = loadAllWorldStates()[0];
    return (
      <div className="space-y-4 max-w-5xl mx-auto p-4 lg:p-6">
        <h1 className="font-display text-2xl gold-text">任务板 · Quest Board</h1>
        {state ? <QuestBoard quests={state.quests} /> : (
          <div className="aether-card p-6 text-sm text-muted-foreground">
            尚未生成。<Link to="/virtual-world" className="text-primary underline ml-1">前往生成</Link>
          </div>
        )}
      </div>
    );
  },
});
