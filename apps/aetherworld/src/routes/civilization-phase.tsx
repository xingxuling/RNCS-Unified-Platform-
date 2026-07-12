import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/civilization-phase")({
  head: () => ({ meta: [
    { title: "Civilization Phase · 文明阶段" },
    { name: "description", content: "查看虚拟世界当前所处的文明阶段与下一阶段提示。" },
  ]}),
  component: () => (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold">Civilization Phase · 文明阶段</h1>
      <p className="text-sm text-muted-foreground">
        文明阶段由 World Agent Society 计算。详情请在 <Link to="/world-society" className="underline">世界社会</Link> 页面查看。
      </p>
    </div>
  ),
});
