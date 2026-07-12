import { createFileRoute, Link } from "@tanstack/react-router";

function Page() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-4">
      <h1 className="text-2xl font-semibold">文明编年史</h1>
      <p className="text-sm text-muted-foreground">
        文明编年史是将文明历史压缩为可读形式的输出。运行主控台后，可在「编年史」面板查看，并通过导出生成 Markdown / Narrative Bible。
      </p>
      <Link to="/civilization-evolution" className="inline-block underline text-primary">前往文明演化主控台 →</Link>
    </div>
  );
}

export const Route = createFileRoute("/civilization-chronicle")({
  head: () => ({ meta: [{ title: "文明编年史 · Civilization Chronicle" }] }),
  component: Page,
});
