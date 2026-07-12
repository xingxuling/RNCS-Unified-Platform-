import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/world-factions")({
  head: () => ({ meta: [
    { title: "World Factions · 世界阵营" },
    { name: "description", content: "数列驱动世界的阵营、目标、资源与敌友关系。" },
  ]}),
  component: () => (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold">World Factions · 世界阵营</h1>
      <p className="text-sm text-muted-foreground">
        阵营详情请在 <Link to="/world-society" className="underline">世界社会</Link> 页面 Faction 面板查看。
      </p>
    </div>
  ),
});
