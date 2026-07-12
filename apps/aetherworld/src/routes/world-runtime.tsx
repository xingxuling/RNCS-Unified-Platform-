import { createFileRoute } from "@tanstack/react-router";
import { WorldSimulationPanel } from "@/components/sequence-world/simulation/WorldSimulationPanel";
import { RNCSWorldCockpit } from "@/components/rncs/RNCSWorldCockpit";

export const Route = createFileRoute("/world-runtime")({
  head: () => ({
    meta: [
      { title: "世界运行时 · World Runtime" },
      { name: "description", content: "导出 Godot / Unity / JSON / Narrative / Prompt 运行时数据包。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <h1 className="font-display text-2xl gold-text mb-3">世界运行时 · Runtime Export</h1>
      <p className="text-xs text-muted-foreground mb-4">在「世界模拟」中先创建世界，再回到本页或在同一面板内导出 Godot / Unity / JSON / Narrative 包。</p>
      <RNCSWorldCockpit />
      <div className="mt-8"><WorldSimulationPanel /></div>
    </div>
  ),
});
