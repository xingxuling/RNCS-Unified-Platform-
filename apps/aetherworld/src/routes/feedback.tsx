import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useAetherData } from "@/lib/useAetherData";
import { generateTimeline, computeTrigger } from "@/lib/predictionEngine";
import { getEventType } from "@/constants/eventTypes";
import { TriggerBadge } from "@/components/TriggerBadge";
import { formatDate } from "@/lib/math";
import { calculateAccuracy } from "@/lib/predictionAccuracyCalculator";
import { AccuracyStatsPanel } from "@/components/AccuracyStatsPanel";
import { AccuracyDisclaimer } from "@/components/AccuracyDisclaimer";

export const Route = createFileRoute("/feedback")({ component: FeedbackCenter });

function FeedbackCenter() {
  const { active, feedback } = useAetherData();
  const accuracyReport = useMemo(() => calculateAccuracy(feedback), [feedback]);


  const data = useMemo(() => {
    if (!active) return null;
    const hints = feedback.map((f) => ({ date: f.date, hitScore: f.hitScore }));
    const past30 = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i);
      return computeTrigger(active, formatDate(d), { feedbackHints: hints });
    });
    const future30 = generateTimeline(active, 30, { feedbackHints: hints });

    const pending = past30
      .filter((r) => r.score >= 50)
      .filter((r) => !feedback.find((f) => f.date === r.date));

    const records = feedback
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date));

    const totalHits = records.filter((r) => r.hit).length;
    const overallRate = records.length ? Math.round((totalHits / records.length) * 100) : 0;
    const avgScore = records.length ? Math.round(records.reduce((a, b) => a + b.hitScore, 0) / records.length) : 0;

    // 事件类型命中
    const typeStats: Record<string, { total: number; hit: number }> = {};
    records.forEach((r) => {
      // 重算事件类型用于统计
      const ev = computeTrigger(active, r.date).eventTypeId;
      const k = ev;
      typeStats[k] ??= { total: 0, hit: 0 };
      typeStats[k].total++;
      if (r.typeMatched) typeStats[k].hit++;
    });
    const typeList = Object.entries(typeStats)
      .map(([id, s]) => ({ id, ...s, rate: Math.round((s.hit / s.total) * 100) }))
      .sort((a, b) => b.total - a.total);

    // 噪声统计
    const noiseStats: Record<string, number> = {};
    records.forEach((r) => r.noise.forEach((n) => { noiseStats[n] = (noiseStats[n] ?? 0) + 1; }));
    const noiseList = Object.entries(noiseStats).sort((a, b) => b[1] - a[1]);

    return { pending, records, overallRate, avgScore, typeList, noiseList, future30 };
  }, [active, feedback]);

  if (!active || !data) return null;

  return (
    <>
      <PageHeader
        caption="Review Center · 记录后来发生了什么"
        title="模型修正与命中分析"
        subtitle="每次记录都很重要：你点一下「是否命中」，系统就会用它来调整未来预测。"
      />

      <div className="p-6 md:p-10 space-y-6">
        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPI label="累计记录" value={data.records.length} />
          <KPI label="命中率" value={`${data.overallRate}%`} accent />
          <KPI label="平均命中度" value={data.avgScore} />
          <KPI label="待记录" value={data.pending.length} danger />
        </div>

        {/* Accuracy Stats · 预测有效率 */}
        <AccuracyStatsPanel report={accuracyReport} />
        <AccuracyDisclaimer compact hasEnoughSamples={accuracyReport.canClaimPublicly} />



        {/* 待记录 */}
        <section className="aether-card p-6">
          <SectionHead title="待记录" caption="Pending Reviews" />
          {data.pending.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-3">过去 30 天高触发日都已经记录过了，反馈完整。</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
              {data.pending.slice(0, 9).map((r) => (
                <Link key={r.date} to="/prediction/$date" params={{ date: r.date }} className="rounded-md border border-border bg-secondary/20 p-3 hover:border-primary/40 transition">
                  <div className="flex items-center justify-between">
                    <div className="font-display">{r.date}</div>
                    <TriggerBadge level={r.level} score={r.score} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {getEventType(r.eventTypeId).name}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 类型 + 噪声 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="aether-card p-6">
            <SectionHead title="事件类型命中" caption="Event Type Hit Rate" />
            {data.typeList.length === 0 ? (
              <Empty />
            ) : (
              <div className="space-y-2 mt-3">
                {data.typeList.map((t) => (
                  <div key={t.id}>
                    <div className="flex justify-between text-xs">
                      <span>{getEventType(t.id).name}</span>
                      <span className="font-mono text-muted-foreground">{t.hit}/{t.total} · {t.rate}%</span>
                    </div>
                    <div className="h-1.5 bg-muted/40 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-primary/70" style={{ width: `${t.rate}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="aether-card p-6">
            <SectionHead title="主要偏差来源" caption="Top Noise Sources" />
            {data.noiseList.length === 0 ? (
              <Empty />
            ) : (
              <div className="flex flex-wrap gap-2 mt-3">
                {data.noiseList.map(([n, c]) => (
                  <span key={n} className="text-xs px-2 py-1 rounded border border-destructive/30 bg-destructive/10 text-destructive">
                    {n} · {c}
                  </span>
                ))}
              </div>
            )}
            <div className="text-[11px] text-muted-foreground mt-4 leading-relaxed">
              系统会根据噪声分布微调未来权重：例如「时间提前」次数偏高时，会下调相邻日的相位补偿。
            </div>
          </section>
        </div>

        {/* 历史记录 */}
        <section className="aether-card p-6">
          <SectionHead title="历史记录" caption="History" />
          {data.records.length === 0 ? (
            <Empty />
          ) : (
            <div className="mt-3 divide-y divide-border/40">
              {data.records.map((r) => (
                <Link key={r.date} to="/prediction/$date" params={{ date: r.date }} className="flex items-center justify-between py-3 hover:bg-secondary/20 px-2 rounded">
                  <div>
                    <div className="font-mono text-sm">{r.date}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 max-w-md truncate">
                      {r.notes || "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className={`px-2 py-0.5 rounded border ${r.hit ? "border-emerald-500/40 text-emerald-400" : "border-destructive/40 text-destructive"}`}>
                      {r.hit ? "命中" : "未中"}
                    </span>
                    <span className="font-mono text-muted-foreground">{r.hitScore}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function KPI({ label, value, accent, danger }: { label: string; value: React.ReactNode; accent?: boolean; danger?: boolean }) {
  return (
    <div className={`aether-card p-4 ${accent ? "border-primary/40" : ""}`}>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`font-display text-3xl mt-1 ${accent ? "gold-text" : danger ? "text-destructive" : ""}`}>{value}</div>
    </div>
  );
}

function SectionHead({ title, caption }: { title: string; caption: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{caption}</div>
      <h2 className="font-display text-lg mt-0.5">{title}</h2>
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-muted-foreground mt-3">暂无数据。开始记录后会自动生成。</p>;
}
