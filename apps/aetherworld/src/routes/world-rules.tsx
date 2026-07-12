import { createFileRoute } from "@tanstack/react-router";
import { WorldRuleEvolutionPanel } from "@/components/sequence-world/growth/WorldRuleEvolutionPanel";

export const Route = createFileRoute("/world-rules")({
  head: () => ({
    meta: [
      { title: "World Rules · 世界规则" },
      { name: "description", content: "世界规则演化：创建、升级、废弃、归档、冲突修复、Founder 锁定。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-8">
      <WorldRuleEvolutionPanel />
    </div>
  ),
});
