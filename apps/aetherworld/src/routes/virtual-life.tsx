import { createFileRoute } from "@tanstack/react-router";
import { VirtualLifeDashboard } from "@/components/VirtualLifeDashboard";

export const Route = createFileRoute("/virtual-life")({
  head: () => ({
    meta: [
      { title: "虚拟生活 · Virtual Life Calculus" },
      { name: "description", content: "基于你的世界、角色、任务和回验，生成今天的虚拟生活与现实行动锚点。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-8">
      <VirtualLifeDashboard />
    </div>
  ),
});
