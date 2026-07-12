import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { useAetherData } from "@/lib/useAetherData";
import { generateTimeline } from "@/lib/predictionEngine";
import { formatDate, addDays } from "@/lib/math";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getEventType } from "@/constants/eventTypes";

export const Route = createFileRoute("/calendar/heatmap")({ component: CalendarPage });

function CalendarPage() {
  const { active, feedback } = useAetherData();
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const data = useMemo(() => {
    if (!active) return null;
    // 计算未来 180 天以确保跨月覆盖
    const hints = feedback.map((f) => ({ date: f.date, hitScore: f.hitScore }));
    const range = generateTimeline(active, 180, { feedbackHints: hints });
    const map = new Map(range.map((r) => [r.date, r]));
    return map;
  }, [active, feedback]);

  if (!active || !data) return null;

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const start = first.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: ({ date: string; day: number } | null)[] = [];
  for (let i = 0; i < start; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: formatDate(new Date(year, month, d)), day: d });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <>
      <div className="px-6 md:px-10 pt-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Heatmap</div>
          <h2 className="font-display text-2xl">{`${year} 年 ${month + 1} 月`}</h2>
          <p className="text-xs text-muted-foreground mt-1">日历热力图显示触发强度；点击日期查看预测详情。</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setCursor(new Date(year, month - 1, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}>
            今月
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCursor(new Date(year, month + 1, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-6 md:p-10">
        <div className="aether-card p-4 md:p-6">
          <div className="grid grid-cols-7 gap-2 mb-2 text-[10px] uppercase tracking-widest text-muted-foreground text-center">
            {["日","一","二","三","四","五","六"].map((d) => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {cells.map((c, i) => {
              if (!c) return <div key={i} />;
              const r = data.get(c.date);
              const isToday = c.date === formatDate(today);
              const hasFeedback = feedback.some((f) => f.date === c.date);
              const score = r?.score ?? 0;
              const bgVar =
                score >= 80 ? "var(--trigger-peak)" :
                score >= 60 ? "var(--trigger-high)" :
                score >= 40 ? "var(--trigger-mid)" :
                              "var(--trigger-low)";
              return (
                <Link
                  key={i}
                  to="/prediction/$date"
                  params={{ date: c.date }}
                  className={`relative aspect-square rounded-md border p-2 flex flex-col justify-between hover:border-primary/50 transition ${isToday ? "border-primary" : "border-border/60"}`}
                  style={{
                    background: `linear-gradient(180deg, ${bgVar}22, ${bgVar}08)`,
                  }}
                >
                  <div className="flex items-start justify-between">
                    <span className={`text-xs ${isToday ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                      {c.day}
                    </span>
                    {hasFeedback && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </div>
                  <div>
                    <div className="font-mono text-lg leading-none" style={{ color: bgVar }}>
                      {score}
                    </div>
                    {r && score >= 60 && (
                      <div className="text-[9px] text-muted-foreground mt-0.5 truncate">
                        {getEventType(r.eventTypeId).name}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <Legend />
      </div>
    </>
  );
}

function Legend() {
  return (
    <div className="mt-6 flex flex-wrap gap-4 text-xs text-muted-foreground items-center">
      <span>触发强度：</span>
      {[
        { l: "低", v: "var(--trigger-low)" },
        { l: "中", v: "var(--trigger-mid)" },
        { l: "强", v: "var(--trigger-high)" },
        { l: "极强", v: "var(--trigger-peak)" },
      ].map((x) => (
        <span key={x.l} className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded" style={{ background: x.v }} /> {x.l}
        </span>
      ))}
      <span className="ml-4 inline-flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> 已记录
      </span>
    </div>
  );
}
