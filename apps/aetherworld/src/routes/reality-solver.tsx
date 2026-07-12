import { createFileRoute } from "@tanstack/react-router";
import { UniversalBreakthroughPanel } from "@/components/UniversalBreakthroughPanel";

export const Route = createFileRoute("/reality-solver")({
  head: () => ({
    meta: [
      { title: "问题拆解器 · Reality Solver" },
      { name: "description", content: "把你卡住的问题拆成：卡在哪里、缺什么、先做哪一步、怎么验证。" },
    ],
  }),
  component: RealitySolverRoute,
});

function RealitySolverRoute() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-4">
      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Reality Solver · 现实解法生成器</div>
        <h1 className="font-display text-2xl gold-text">问题拆解器</h1>
        <p className="text-sm text-muted-foreground">
          这是一个问题拆解工具，不是保证成功的机器。请把它当成帮你理清下一步的方法。
        </p>
      </header>
      <UniversalBreakthroughPanel forceBeginner />
    </div>
  );
}
