import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useAetherData } from "@/lib/useAetherData";
import { generateTimeline, topTriggers } from "@/lib/predictionEngine";
import { getEventType } from "@/constants/eventTypes";
import { TriggerBadge } from "@/components/TriggerBadge";
import {
  Tabs, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { FeedbackEntryCard } from "@/components/FeedbackEntryCard";

export const Route = createFileRoute("/timeline")({ component: TimelinePage });

const RANGES: Record<string, { days: number; topN: number }> = {
  "30D":  { days: 30,   topN: 8 },
  "90D":  { days: 90,   topN: 12 },
  "1Y":   { days: 365,  topN: 20 },
  "3Y":   { days: 1095, topN: 30 },
  "5Y":   { days: 1825, topN: 20 },
};

function TimelinePage() {
  const { active, feedback } = useAetherData();
  const [range, setRange] = useState<keyof typeof RANGES>("90D");

  const data = useMemo(() => {
    if (!active) return null;
    const cfg = RANGES[range];
    const hints = feedback.map((f) => ({ date: f.date, hitScore: f.hitScore }));
    const all = generateTimeline(active, cfg.days, { feedbackHints: hints });
    const tops = topTriggers(all, cfg.topN).sort((a, b) => a.date.localeCompare(b.date));
    return { all, tops, cfg };
  }, [active, feedback, range]);

  if (!active || !data) return null;

  return (
    <>
      <PageHeader
        caption="Time-Field Engine · 时间场引擎"
        title="未来时间线"
        subtitle="扫描未来强触发点，标出高峰段和风险段。所有结果都基于你当前的个人模型。"
        actions={
          <Tabs value={range} onValueChange={(v) => setRange(v as keyof typeof RANGES)}>
            <TabsList>
              {Object.keys(RANGES).map((k) => (
                <TabsTrigger key={k} value={k}>{k}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
      />

      <div className="p-6 md:p-10 space-y-8">
        {/* Strip 时间条 */}
        <div className="aether-card p-6">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            Trigger Strip · {data.cfg.days} days
          </div>
          <div className="relative h-24 w-full rounded-md border border-border/60 bg-background/40 overflow-hidden">
            {data.all.map((d, i) => {
              const x = (i / data.all.length) * 100;
              const w = (1 / data.all.length) * 100;
              const color =
                d.score >= 80 ? "var(--trigger-peak)" :
                d.score >= 60 ? "var(--trigger-high)" :
                d.score >= 40 ? "var(--trigger-mid)" : "var(--trigger-low)";
              return (
                <div
                  key={d.date}
                  className="absolute bottom-0"
                  style={{
                    left: `${x}%`,
                    width: `${w}%`,
                    height: `${d.score}%`,
                    background: color,
                    opacity: 0.85,
                  }}
                  title={`${d.date} · ${d.score}`}
                />
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-muted-foreground font-mono">
            <span>{data.all[0].date}</span>
            <span>{data.all[data.all.length - 1].date}</span>
          </div>
        </div>

        {/* Top 触发点 */}
        <div>
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Top High-Trigger Events
            </div>
            <h2 className="font-display text-xl">未来 {data.cfg.days} 天 · Top {data.cfg.topN}</h2>
          </div>

          <div className="relative pl-6">
            <div className="absolute left-1.5 top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-border to-transparent" />
            <div className="space-y-3">
              {data.tops.map((r) => {
                const ev = getEventType(r.eventTypeId);
                return (
                  <Link
                    key={r.date}
                    to="/prediction/$date"
                    params={{ date: r.date }}
                    className="relative block aether-card p-4 hover:border-primary/50 transition"
                  >
                    <span
                      className="absolute -left-[22px] top-5 w-3 h-3 rounded-full border-2 border-background"
                      style={{
                        background: r.score >= 80 ? "var(--trigger-peak)"
                                  : r.score >= 60 ? "var(--trigger-high)"
                                  : "var(--trigger-mid)",
                        boxShadow: `0 0 12px ${r.score >= 80 ? "var(--trigger-peak)" : "transparent"}`,
                      }}
                    />
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <div className="font-display text-lg gold-text">{r.date}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          T+{r.dayOffset} · {r.phase.name}相 · {ev.name}
                        </div>
                      </div>
                      <TriggerBadge level={r.level} score={r.score} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      {ev.explanation}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <FeedbackEntryCard title="快速回验 · 未来时间线" detailLink="/feedback" />
      </div>
    </>
  );
}
