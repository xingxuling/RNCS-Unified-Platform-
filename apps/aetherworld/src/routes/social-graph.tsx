import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/social-graph")({
  head: () => ({ meta: [
    { title: "Social Graph · 社会关系图" },
    { name: "description", content: "数列驱动世界的 NPC / 阵营 / 制度社会关系网络。" },
  ]}),
  component: () => (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold">Social Graph · 社会关系图</h1>
      <p className="text-sm text-muted-foreground">
        关系图由 World Agent Society 生成。请前往 <Link to="/world-society" className="underline">世界社会</Link> 页面查看图谱、核心节点与不稳定关系。
      </p>
    </div>
  ),
});
