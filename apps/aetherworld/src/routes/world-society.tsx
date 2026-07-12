import { createFileRoute } from "@tanstack/react-router";
import { WorldAgentSocietyPanel } from "@/components/sequence-world/society/WorldAgentSocietyPanel";

export const Route = createFileRoute("/world-society")({
  head: () => ({
    meta: [
      { title: "世界社会 · World Agent Society Core v0.4" },
      { name: "description", content: "数列驱动世界社会智能体系统 — NPC 智能体、社会关系、阵营、制度、经济、信仰、集体记忆、自治事件与文明阶段。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <WorldAgentSocietyPanel />
    </div>
  ),
});
