import { createFileRoute, Link } from "@tanstack/react-router";

function Page() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-4">
      <h1 className="text-2xl font-semibold">文明神话</h1>
      <p className="text-sm text-muted-foreground">
        文明神话是虚拟世界设定，不作为现实宗教宣传，不构成现实信仰建议。
      </p>
      <Link to="/civilization-evolution" className="inline-block underline text-primary">前往文明演化主控台 →</Link>
    </div>
  );
}

export const Route = createFileRoute("/civilization-myth")({
  head: () => ({ meta: [{ title: "文明神话 · Civilization Myth" }] }),
  component: Page,
});
