import { createFileRoute, Link } from "@tanstack/react-router";

function Page() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-4">
      <h1 className="text-2xl font-semibold">战争与和平</h1>
      <p className="text-sm text-muted-foreground">
        所有战争记录仅用于虚拟文明叙事和游戏设定。系统不会输出针对现实群体的暴力指导或仇恨内容。
      </p>
      <Link to="/civilization-evolution" className="inline-block underline text-primary">前往文明演化主控台 →</Link>
    </div>
  );
}

export const Route = createFileRoute("/war-peace")({
  head: () => ({ meta: [{ title: "战争与和平 · War & Peace" }] }),
  component: Page,
});
