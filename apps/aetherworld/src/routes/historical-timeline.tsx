import { createFileRoute, Link } from "@tanstack/react-router";

function Page() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-4">
      <h1 className="text-2xl font-semibold">历史时间线</h1>
      <p className="text-sm text-muted-foreground">
        历史时间线由 Civilization Evolution 内核统一生成。请前往主控台运行后查看完整时间线、争议、分支。
      </p>
      <Link to="/civilization-evolution" className="inline-block underline text-primary">前往文明演化主控台 →</Link>
    </div>
  );
}

export const Route = createFileRoute("/historical-timeline")({
  head: () => ({ meta: [{ title: "历史时间线 · Historical Timeline" }] }),
  component: Page,
});
