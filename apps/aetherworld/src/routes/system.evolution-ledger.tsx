// 进化账本 - 模型 / 数据 / 产品 / 失败 / 反馈 血统
import { createFileRoute, Link } from "@tanstack/react-router";
import { buildEvolutionRows, buildGrowthScore } from "@/lib/founder-cockpit/cockpitAggregator";
import type { EvolutionRow } from "@/lib/founder-cockpit/cockpitTypes";

export const Route = createFileRoute("/system/evolution-ledger")({
  head: () => ({
    meta: [
      { title: "进化账本 · Aetherworld" },
      { name: "description", content: "模型血统、数据血统、产品版本、失败恢复、用户反馈" },
    ],
  }),
  component: EvolutionLedgerPage,
});

const CATEGORY_LABEL: Record<EvolutionRow["category"], string> = {
  MODEL: "模型血统",
  DATA: "数据血统",
  PRODUCT: "产品版本",
  FAILURE: "失败恢复",
  FEEDBACK: "用户反馈",
};

const CATEGORY_STYLE: Record<EvolutionRow["category"], string> = {
  MODEL: "text-purple-200 border-purple-500/40 bg-purple-500/10",
  DATA: "text-cyan-200 border-cyan-500/40 bg-cyan-500/10",
  PRODUCT: "text-emerald-200 border-emerald-500/40 bg-emerald-500/10",
  FAILURE: "text-rose-200 border-rose-500/40 bg-rose-500/10",
  FEEDBACK: "text-amber-200 border-amber-500/40 bg-amber-500/10",
};

function EvolutionLedgerPage() {
  const rows = buildEvolutionRows();
  const growth = buildGrowthScore();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-[#0a0f1f] to-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-6">
          <p className="text-xs uppercase tracking-widest text-cyan-300/80">Evolution Ledger</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-50">进化账本</h1>
          <p className="mt-1 text-sm text-slate-400">
            核心问题：Aetherworld 今天比昨天强在哪里？
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
            <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-cyan-200">
              今日增长分数：{growth.score}
            </span>
          </div>
        </header>

        <section className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-100">今日增长贡献</h2>
          <ul className="grid gap-1 text-xs text-slate-300 md:grid-cols-2">
            {growth.reasons.map((r, i) => (
              <li key={i}>· {r}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-100">血统时间线</h2>
          <ul className="space-y-2">
            {rows.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 rounded-md border border-slate-800/60 bg-slate-900/40 p-3 text-sm"
              >
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] ${CATEGORY_STYLE[r.category]}`}
                >
                  {CATEGORY_LABEL[r.category]}
                </span>
                <div className="flex-1">
                  <p className="text-slate-100">{r.title}</p>
                  <p className="text-xs text-slate-400">{r.delta}</p>
                </div>
                <span className="text-[11px] text-slate-500">
                  {new Date(r.at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-3 md:grid-cols-3 text-xs">
          <Link
            to="/system/experiment-ledger"
            className="rounded-md border border-slate-700 bg-slate-900/40 p-3 hover:border-slate-500"
          >
            打开实验账本（模型血统器官） →
          </Link>
          <Link
            to="/system/datasets"
            className="rounded-md border border-slate-700 bg-slate-900/40 p-3 hover:border-slate-500"
          >
            打开数据血池 →
          </Link>
          <Link
            to="/system/autonomous-factory"
            className="rounded-md border border-slate-700 bg-slate-900/40 p-3 hover:border-slate-500"
          >
            失败恢复中心 → 工厂总控
          </Link>
        </section>
      </div>
    </main>
  );
}
