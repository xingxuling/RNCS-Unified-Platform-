import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/creation-simulator")({
  head: () => ({
    meta: [
      { title: "创造模拟器 · Creation Simulator" },
      { name: "description", content: "面向新手的创造物快速模拟入口。" },
    ],
  }),
  component: CreationSimulatorRoute,
});

function CreationSimulatorRoute() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <header className="space-y-2">
        <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Creation Simulator · 新手入口</div>
        <h1 className="text-2xl md:text-3xl font-display gold-text">创造模拟器</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          用一句话描述你想创造的东西，让系统帮你评估可行度，并给出第一原型路径。
        </p>
      </header>

      <div className="aether-card p-6 space-y-3">
        <div className="text-sm">三步使用：</div>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal pl-5">
          <li>进入「虚拟创造物计算法」</li>
          <li>填写名称、类型与描述（越具体越好）</li>
          <li>点击「生成可行度报告」查看常数评估、风险与路线图</li>
        </ol>
        <div className="flex gap-2 pt-2">
          <Link to="/virtual-creation" className="text-sm px-4 py-2 rounded bg-primary/80 hover:bg-primary text-primary-foreground">
            进入虚拟创造物计算法
          </Link>
          <Link to="/reality-science-universe" className="text-sm px-4 py-2 rounded bg-background/60 border border-border/40">
            查看常数宇宙
          </Link>
        </div>
      </div>

      <div className="aether-card p-5 text-xs text-muted-foreground leading-relaxed">
        说明：本模拟器只在数字层评估「能不能造、阻力在哪里、应该先验证什么」。
        它不替代真实工程验证、医疗/法律/金融/安全审查，也不保证商业成功。
      </div>
    </div>
  );
}
