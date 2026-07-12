import { createFileRoute, Link } from "@tanstack/react-router";

function Page() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-4">
      <h1 className="text-2xl font-semibold">技术树</h1>
      <p className="text-sm text-muted-foreground">
        技术树由源数列驱动生成，包含农耕、文字、归档、市场、世界工程、数列编译等节点。完整面板位于 Civilization Evolution 主控台。
      </p>
      <Link to="/civilization-evolution" className="inline-block underline text-primary">前往文明演化主控台 →</Link>
    </div>
  );
}

export const Route = createFileRoute("/technology-tree")({
  head: () => ({ meta: [{ title: "技术树 · Technology Tree" }] }),
  component: Page,
});
