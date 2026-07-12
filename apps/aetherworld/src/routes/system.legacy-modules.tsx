// 旧模块激活图谱
// 路径：/system/legacy-modules
// 仅作为系统/治理子页面，不进入一级导航。
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { scanLegacyModules } from "@/lib/legacy-modules/legacyModuleScanner";
import { groupByCategory } from "@/lib/legacy-modules/legacyModuleActivationMap";
import { scoreLegacyModules } from "@/lib/legacy-modules/legacyModulePriorityScorer";
import { getOrBuildBridgePlan } from "@/lib/legacy-modules/legacyModuleBridgePlanner";
import {
  LEGACY_CATEGORY_LABEL,
  LEGACY_LAYER_LABEL,
  LEGACY_STATUS_LABEL,
  RECOMMENDED_ACTION_LABEL,
  type LegacyModuleCategory,
} from "@/lib/legacy-modules/legacyModuleTypes";

export const Route = createFileRoute("/system/legacy-modules")({
  head: () => ({
    meta: [
      { title: "旧模块激活图谱 — Aetherworld" },
      { name: "description", content: "Aetherworld 旧模块总登记 + 优先激活图谱 + 桥接计划。" },
      { property: "og:title", content: "旧模块激活图谱 — Aetherworld" },
      { property: "og:description", content: "对历史模块统一登记、评分与接入规划。" },
    ],
  }),
  component: LegacyModulesPage,
});

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "border-emerald-500/30 text-emerald-500",
  PARTIAL: "border-amber-500/30 text-amber-500",
  READ_ONLY: "border-sky-500/30 text-sky-500",
  PLACEHOLDER: "border-zinc-500/30 text-zinc-400",
  DEMO: "border-violet-500/30 text-violet-400",
  LEGACY: "border-stone-500/30 text-stone-400",
  DUPLICATE: "border-rose-500/30 text-rose-500",
  DISABLED: "border-zinc-500/30 text-zinc-500",
};

const PRIORITY_COLOR: Record<string, string> = {
  P0: "border-red-500/40 text-red-500",
  P1: "border-orange-500/40 text-orange-500",
  P2: "border-amber-500/30 text-amber-500",
  P3: "border-zinc-500/30 text-zinc-400",
};

function LegacyModulesPage() {
  const scan = useMemo(() => scanLegacyModules(), []);
  const scored = useMemo(() => scoreLegacyModules(), []);
  const grouped = useMemo(() => groupByCategory(), []);
  const [filter, setFilter] = useState<LegacyModuleCategory | "ALL">("ALL");
  const [openId, setOpenId] = useState<string | null>(null);

  const filteredScored = filter === "ALL" ? scored : scored.filter((s) => s.module.category === filter);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/system-bug-audit" className="underline hover:text-foreground">系统审计</Link>
            <span>·</span>
            <span>旧模块激活图谱</span>
          </div>
          <h1 className="text-2xl font-display">旧模块激活图谱</h1>
          <p className="text-sm text-muted-foreground">
            对项目历史 / 老系统资产做统一登记、评分、桥接规划。仅供治理参考，不自动激活。
          </p>
        </header>

        {/* 总览 */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "模块总数", value: scan.total },
            { label: "已运行", value: scan.byStatus.ACTIVE || 0 },
            { label: "部分接入", value: scan.byStatus.PARTIAL || 0 },
            { label: "只读 / 演示", value: (scan.byStatus.READ_ONLY || 0) + (scan.byStatus.DEMO || 0) },
            { label: "占位", value: scan.byStatus.PLACEHOLDER || 0 },
            { label: "建议立即激活", value: scan.activateNow.length },
          ].map((x) => (
            <div key={x.label} className="rounded-lg border border-border bg-card p-3">
              <div className="text-[11px] text-muted-foreground">{x.label}</div>
              <div className="text-xl font-display mt-1">{x.value}</div>
            </div>
          ))}
        </section>

        {/* 分类筛选 */}
        <section className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("ALL")}
            className={`text-xs px-3 py-1 rounded border ${
              filter === "ALL" ? "border-foreground text-foreground" : "border-border text-muted-foreground"
            }`}
          >
            全部
          </button>
          {grouped.map((g) => (
            <button
              key={g.key}
              onClick={() => setFilter(g.key)}
              className={`text-xs px-3 py-1 rounded border ${
                filter === g.key ? "border-foreground text-foreground" : "border-border text-muted-foreground"
              }`}
            >
              {LEGACY_CATEGORY_LABEL[g.key]} · {g.modules.length}
            </button>
          ))}
        </section>

        {/* 模块列表（按评分排序） */}
        <section className="space-y-2">
          <h2 className="text-lg font-display">模块列表</h2>
          <p className="text-[11px] text-muted-foreground">按激活优先级评分排序；点击展开查看 Bridge Plan。</p>
          {filteredScored.length === 0 ? (
            <p className="text-xs text-muted-foreground">此分类下暂无模块。</p>
          ) : (
            <div className="space-y-2">
              {filteredScored.map(({ module: m, score, reason }) => {
                const open = openId === m.id;
                const plan = getOrBuildBridgePlan(m);
                return (
                  <div key={m.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono text-muted-foreground">{m.id}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${PRIORITY_COLOR[m.activationPriority]}`}>
                        {m.activationPriority}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${STATUS_COLOR[m.currentStatus]}`}>
                        {LEGACY_STATUS_LABEL[m.currentStatus]}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        · {LEGACY_CATEGORY_LABEL[m.category]} · {LEGACY_LAYER_LABEL[m.layer]}
                      </span>
                      <span className="ml-auto text-[11px] text-muted-foreground">评分 {score}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <div className="text-base font-medium">{m.cnName}</div>
                      <div className="text-[11px] text-muted-foreground">{m.name}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      推荐：{RECOMMENDED_ACTION_LABEL[m.recommendedAction]} · {reason}
                    </div>
                    {m.notes && <div className="text-xs">{m.notes}</div>}
                    {m.routes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {m.routes.map((r) => (
                          <Link
                            key={r}
                            to={r as never}
                            className="text-[11px] px-2 py-0.5 rounded border border-border text-muted-foreground hover:text-foreground"
                          >
                            {r}
                          </Link>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => setOpenId(open ? null : m.id)}
                      className="text-[11px] underline text-muted-foreground hover:text-foreground"
                    >
                      {open ? "收起 Bridge Plan" : "展开 Bridge Plan"}
                    </button>
                    {open && (
                      <div className="rounded border border-border/60 bg-background/40 p-3 space-y-2 text-xs">
                        <div><span className="text-muted-foreground">目标：</span>{plan.goal}</div>
                        <div>
                          <span className="text-muted-foreground">接入系统：</span>
                          {plan.targets.length > 0 ? plan.targets.join("、") : "—"}
                        </div>
                        {plan.reusableFiles.length > 0 && (
                          <div>
                            <span className="text-muted-foreground">可复用文件：</span>
                            <ul className="list-disc pl-5 mt-1 space-y-0.5">
                              {plan.reusableFiles.slice(0, 6).map((f) => <li key={f} className="font-mono">{f}</li>)}
                            </ul>
                          </div>
                        )}
                        {plan.newBridges.length > 0 && (
                          <div>
                            <span className="text-muted-foreground">需新增 Bridge：</span>
                            {plan.newBridges.join("、")}
                          </div>
                        )}
                        {plan.risks.length > 0 && (
                          <div>
                            <span className="text-muted-foreground">风险：</span>
                            <ul className="list-disc pl-5 mt-1 space-y-0.5">
                              {plan.risks.map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                          </div>
                        )}
                        <div className="pt-2 border-t border-border/40">
                          <div className="text-muted-foreground mb-1">Lovable 下一轮提示词草案：</div>
                          <div className="font-mono text-[11px] whitespace-pre-wrap">{plan.promptDraft}</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <p className="text-[11px] text-muted-foreground pt-4 border-t border-border">
          本图谱只读保留 / 桥接规划；实际激活需通过 Lovable Handoff 与 Scheduler 任务确认。
        </p>
      </div>
    </div>
  );
}
