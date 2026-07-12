import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/world-beliefs")({
  head: () => ({ meta: [
    { title: "World Beliefs · 世界信仰" },
    { name: "description", content: "虚构世界的信仰体系、神话、价值与禁忌。" },
  ]}),
  component: () => (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold">World Beliefs · 世界信仰</h1>
      <p className="text-sm text-muted-foreground">
        信仰体系均为虚构世界观元素，不构成现实宗教、招募或意识形态推广。详情请在 <Link to="/world-society" className="underline">世界社会</Link> 页面查看。
      </p>
    </div>
  ),
});
