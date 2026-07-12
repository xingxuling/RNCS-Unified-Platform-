import { createFileRoute, Link } from "@tanstack/react-router";

function Page() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-4">
      <h1 className="text-2xl font-semibold">历史人物</h1>
      <p className="text-sm text-muted-foreground">
        历史人物是虚拟世界角色。即便源自真实用户，也仅作为虚构世界身份，不代表现实身份断言。
      </p>
      <Link to="/civilization-evolution" className="inline-block underline text-primary">前往文明演化主控台 →</Link>
    </div>
  );
}

export const Route = createFileRoute("/historical-figures")({
  head: () => ({ meta: [{ title: "历史人物 · Historical Figures" }] }),
  component: Page,
});
