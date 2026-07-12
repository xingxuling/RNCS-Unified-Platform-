// /system/lovable-pass · Lovable 开发期同账号项目融合报告（只读）
import { createFileRoute } from "@tanstack/react-router";
import { LOVABLE_PASS_SCAN_REPORT } from "@/lib/project-fusion/lovablePassScanReport";

export const Route = createFileRoute("/system/lovable-pass")({
  head: () => ({
    meta: [
      { title: "Lovable 开发期融合报告 · Aetherworld" },
      { name: "description", content: "由 Lovable 开发环境真实读取同账号项目后生成的融合报告。Aetherworld 运行时不直接读取你的账号。" },
    ],
  }),
  component: LovablePassPage,
});

function riskBadge(level: "LOW" | "MEDIUM" | "HIGH") {
  const cls =
    level === "HIGH"
      ? "border-red-500/50 text-red-500"
      : level === "MEDIUM"
        ? "border-amber-500/50 text-amber-500"
        : "border-emerald-500/50 text-emerald-500";
  return <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${cls}`}>{level}</span>;
}

function recBadge(rec: string) {
  const map: Record<string, string> = {
    FUSE_NOW: "border-emerald-500/50 text-emerald-500",
    BRIDGE_PLAN: "border-sky-500/50 text-sky-500",
    REFERENCE_ONLY: "border-border/60 text-muted-foreground",
    BLOCKED: "border-red-500/50 text-red-500",
    SKIP: "border-border/60 text-muted-foreground",
  };
  return <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${map[rec] ?? "border-border/60 text-muted-foreground"}`}>{rec}</span>;
}

function LovablePassPage() {
  const r = LOVABLE_PASS_SCAN_REPORT;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <header className="space-y-2">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          System / Lovable Pass · Same-Account Fusion
        </div>
        <h1 className="text-2xl font-semibold">Lovable 开发期同账号项目融合报告</h1>
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200/90 leading-relaxed">
          本报告由 <b>Lovable 开发环境</b> 通过 cross_project 工具，在开发期真实读取同账号项目清单与少量目录采样后生成。
          <br />
          <b>Aetherworld 运行时不会、也不应直接读取你的 Lovable 账号项目</b>；运行时仅能消费本文件这份"已保存的开发期报告"。
        </div>
      </header>

      <section className="rounded-xl border border-border/50 bg-card/60 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div><div className="text-xs text-muted-foreground">可访问项目</div><div className="text-lg font-semibold">{r.totalAccessibleProjects}</div></div>
        <div><div className="text-xs text-muted-foreground">深度采样</div><div className="text-lg font-semibold">{r.deepReadSampleCount}</div></div>
        <div><div className="text-xs text-muted-foreground">高价值候选</div><div className="text-lg font-semibold">{r.highValueProjects.length}</div></div>
        <div><div className="text-xs text-muted-foreground">融合计划</div><div className="text-lg font-semibold">{r.fusionPlans.length}</div></div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">高价值候选项目（按真实扫描分类）</h2>
        {r.highValueProjects.map((p) => (
          <div key={p.projectId} className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-sm font-medium">
                {p.projectName}
                {!p.deepRead && <span className="ml-2 text-[10px] text-muted-foreground">（未深读，仅元数据）</span>}
              </div>
              <div className="flex gap-1.5">
                {riskBadge(p.riskLevel)}
                {recBadge(p.recommendation)}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              目标系统：{p.targetAetherSystems.join(" / ") || "—"}
            </div>
            {p.reusableParts.length > 0 && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground">可参考片段 {p.reusableParts.length} 项</summary>
                <ul className="mt-1 space-y-0.5 text-muted-foreground">
                  {p.reusableParts.map((x, i) => <li key={i}>· {x}</li>)}
                </ul>
              </details>
            )}
            <div className="text-xs text-muted-foreground/80 leading-relaxed">{p.notes}</div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">融合计划（Bridge Plan）</h2>
        {r.fusionPlans.map((plan, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-sm font-medium">{plan.sourceProjectName} → {plan.targetAetherSystem}</div>
              <div className="flex gap-1.5">
                {riskBadge(plan.riskLevel)}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${plan.shouldApplyNow ? "border-emerald-500/50 text-emerald-500" : "border-border/60 text-muted-foreground"}`}>
                  {plan.shouldApplyNow ? "本轮应用" : "待 Founder 确认"}
                </span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">复用部分：{plan.reusablePart}</div>
            {plan.conflicts.length > 0 && (
              <div className="text-xs text-amber-500">冲突：{plan.conflicts.join("；")}</div>
            )}
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">所需变更 / 推荐步骤</summary>
              <div className="mt-1 space-y-0.5 text-muted-foreground">
                {plan.requiredChanges.map((c, j) => <div key={`c${j}`}>· 变更：{c}</div>)}
                {plan.recommendedSteps.map((s, j) => <div key={`s${j}`}>· 步骤：{s}</div>)}
              </div>
            </details>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">本轮直接融合内容</h2>
        {r.appliedNow.length === 0 ? (
          <div className="text-xs text-muted-foreground">
            本轮未直接融合任何源代码。所有候选都保留为计划，等待 Founder 确认皮肤 / 接入策略。
          </div>
        ) : (
          <ul className="text-xs text-muted-foreground space-y-1">
            {r.appliedNow.map((a, i) => <li key={i}>· {a.sourceProjectName} → {a.targetAetherSystem}：{a.what}</li>)}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-2">
        <h2 className="text-sm font-medium text-red-300">被阻断 / 跳过的项目</h2>
        <ul className="text-xs text-red-200/80 space-y-1">
          {r.blockedOrSkippedItems.map((x, i) => <li key={i}>· {x}</li>)}
        </ul>
      </section>

      <section className="rounded-xl border border-border/40 bg-muted/10 p-4 space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">低相关 / 未深读项目</h2>
        <ul className="text-xs text-muted-foreground space-y-1">
          {r.lowValueOrUnrelated.map((x, i) => <li key={i}>· <b>{x.projectName}</b>：{x.reason}</li>)}
        </ul>
      </section>

      <section className="rounded-xl border border-border/40 bg-muted/10 p-4 space-y-1 text-xs text-muted-foreground">
        <div className="font-medium text-foreground/80">报告备注</div>
        {r.notes.map((n, i) => <div key={i}>· {n}</div>)}
        <div className="pt-1 opacity-70">生成时间：{r.generatedAt}（{r.generatedBy}）</div>
      </section>
    </div>
  );
}
