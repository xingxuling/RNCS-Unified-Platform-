import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/world-economy")({
  head: () => ({ meta: [
    { title: "World Economy · 世界经济" },
    { name: "description", content: "虚拟世界内部经济：资源、稀缺、贸易路径与经济张力。" },
  ]}),
  component: () => (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold">World Economy · 世界经济</h1>
      <p className="text-sm text-muted-foreground">
        世界经济属于虚拟世界内部系统，不可提现、不可投资、不可承诺升值。详情请在 <Link to="/world-society" className="underline">世界社会</Link> 页面查看。
      </p>
    </div>
  ),
});
