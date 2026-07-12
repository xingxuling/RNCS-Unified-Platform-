import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/npc-agents")({
  head: () => ({ meta: [
    { title: "NPC Agents · NPC 智能体" },
    { name: "description", content: "查看与管理世界中的 NPC 智能体。" },
  ]}),
  component: () => (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold">NPC Agents · NPC 智能体</h1>
      <p className="text-sm text-muted-foreground">
        NPC Agent 数据由 World Agent Society Engine 生成。请前往 <Link to="/world-society" className="underline">世界社会</Link> 页面查看完整 agent 列表、社会关系与阵营归属。
      </p>
    </div>
  ),
});
