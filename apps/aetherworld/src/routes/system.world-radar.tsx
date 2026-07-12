// 世界雷达页 - 外界数据、趋势、竞品、机会
import { createFileRoute, Link } from "@tanstack/react-router";
import { buildWorldRadarSignals } from "@/lib/founder-cockpit/cockpitAggregator";
import { SEED_OUTCOME_LABEL } from "@/lib/founder-cockpit/cockpitTypes";

export const Route = createFileRoute("/system/world-radar")({
  head: () => ({
    meta: [
      { title: "世界雷达 · Aetherworld" },
      { name: "description", content: "外界机会、技术趋势、竞品信号、用户需求" },
    ],
  }),
  component: WorldRadarPage,
});

const CATEGORY_LABEL: Record<string, string> = {
  OPPORTUNITY: "机会",
  COMPETITOR: "竞品",
  MODEL: "开源模型",
  TECH: "技术 / Agent 框架",
  USER_SIGNAL: "用户信号",
};

function WorldRadarPage() {
  const signals = buildWorldRadarSignals();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-[#0a0f1f] to-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6">
          <p className="text-xs uppercase tracking-widest text-cyan-300/80">天 · World Radar</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-50">世界雷达</h1>
          <p className="mt-1 text-sm text-slate-400">
            外界机会、技术周期、市场机会、竞品信号、开源模型、自动化工具、Agent 框架、用户需求
          </p>
        </header>

        <section className="grid gap-3 md:grid-cols-2">
          {signals.map((s) => (
            <article
              key={s.id}
              className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4"
            >
              <header className="flex items-center justify-between text-xs">
                <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-cyan-200">
                  {CATEGORY_LABEL[s.category] ?? s.category}
                </span>
              </header>
              <h2 className="mt-2 text-base font-semibold text-slate-100">{s.title}</h2>
              <p className="mt-1 text-sm text-slate-400">{s.detail}</p>
              <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                {s.potentialOutcomes.map((o) => (
                  <span
                    key={o}
                    className="rounded-md border border-slate-700 bg-slate-900/60 px-2 py-0.5 text-slate-300"
                  >
                    可转化为：{SEED_OUTCOME_LABEL[o]}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex gap-2 text-xs">
                <Link
                  to="/system/founder-cockpit"
                  className="rounded-md border border-cyan-500/60 bg-cyan-500/10 px-3 py-1 text-cyan-200 hover:bg-cyan-500/20"
                >
                  作为种子丢进去
                </Link>
                <Link
                  to="/system/intake-forge"
                  className="rounded-md border border-slate-700 px-3 py-1 text-slate-300 hover:border-slate-500"
                >
                  进入投喂炉
                </Link>
              </div>
            </article>
          ))}
        </section>

        <footer className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4 text-xs text-slate-500">
          <p>每条信号都可以变成材料投喂、产品假设、开发任务、训练样本、商业机会或风险提醒。</p>
        </footer>
      </div>
    </main>
  );
}
