import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/world-institutions")({
  head: () => ({ meta: [
    { title: "World Institutions · 世界制度组织" },
    { name: "description", content: "世界的议会、公会、神殿、学院、市场、审判庭等制度组织。" },
  ]}),
  component: () => (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold">World Institutions · 世界制度组织</h1>
      <p className="text-sm text-muted-foreground">
        制度详情请在 <Link to="/world-society" className="underline">世界社会</Link> 页面 Institutions 面板查看。
      </p>
    </div>
  ),
});
