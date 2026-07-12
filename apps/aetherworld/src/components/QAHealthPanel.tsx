import { Activity, AlertOctagon, AlertTriangle, ShieldCheck } from "lucide-react";
import {
  QA_HEALTH_STATUS_META,
  type QAScanResult,
} from "@/lib/softwareQAFeedbackCalculus";

interface Props {
  result: QAScanResult;
}

const METRICS = [
  { key: "routeScore",                  label: "路由可达性",   en: "Route" },
  { key: "moduleIntegrationScore",      label: "模块接入度",   en: "Modules" },
  { key: "dataIntegrityScore",          label: "数据完整性",   en: "Data" },
  { key: "isolationScore",              label: "隔离审计",     en: "Isolation" },
  { key: "safetyCoverageScore",         label: "安全覆盖",     en: "Safety" },
  { key: "feedbackEntryCoverageScore",  label: "回验覆盖",     en: "Feedback" },
  { key: "documentationConsistencyScore",label: "文档一致性",  en: "Docs" },
  { key: "userJourneyScore",            label: "用户路径",     en: "Journey" },
] as const;

export function QAHealthPanel({ result }: Props) {
  const meta = QA_HEALTH_STATUS_META[result.status];
  const tone =
    meta.tone === "emerald" ? "text-emerald-300 border-emerald-500/30 bg-emerald-500/5"
    : meta.tone === "cyan" ? "text-cyan-300 border-cyan-500/30 bg-cyan-500/5"
    : meta.tone === "amber" ? "text-amber-300 border-amber-500/30 bg-amber-500/5"
    : meta.tone === "orange" ? "text-orange-300 border-orange-500/30 bg-orange-500/5"
    : "text-rose-300 border-rose-500/30 bg-rose-500/5";

  return (
    <div className="aether-card-elevated p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            QA Health Score · 软件测试反馈分
          </div>
          <div className="flex items-end gap-4 mt-1">
            <div className="font-display text-5xl gold-text leading-none">
              {result.qaHealthScore}
            </div>
            <div className={`border rounded px-2 py-1 text-[11px] ${tone}`}>
              {meta.cn} · {meta.en}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 max-w-xl">
            {meta.description}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat icon={AlertOctagon} tone="rose"    label="阻断 Blocker"   value={result.blockerCount} />
          <Stat icon={AlertTriangle} tone="orange" label="严重 Critical"  value={result.criticalCount} />
          <Stat icon={AlertTriangle} tone="amber"  label="高 High"        value={result.highCount} />
          <Stat icon={Activity} tone="cyan"        label="中/低 Med+Low"  value={result.mediumCount + result.lowCount} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
        {METRICS.map((m) => {
          const v = result[m.key as keyof QAScanResult] as number;
          return (
            <div key={m.key} className="p-3 rounded-md border border-border/60 bg-secondary/20">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{m.en}</div>
              <div className="text-sm mt-1">{m.label}</div>
              <div className="flex items-end justify-between mt-2">
                <div className="font-display text-xl">{v}</div>
                <div className="w-16 h-1.5 bg-secondary/40 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${v}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 rounded-md border border-border/60 bg-background/40 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
        <ShieldCheck className="w-3.5 h-3.5 mt-0.5 text-primary" />
        QA Health Score 由路由可达性、模块接入、数据完整性、Demo/Real 隔离、安全覆盖、回验覆盖、文档一致性、用户路径连续性共同决定，并按 BLOCKER/CRITICAL/HIGH 的数量进行惩罚。该分数可作为 Version Iteration 与 Beta Launch 的参考。
      </div>
    </div>
  );
}

function Stat({
  icon: Icon, tone, label, value,
}: { icon: typeof Activity; tone: string; label: string; value: number }) {
  const toneCls =
    tone === "rose" ? "text-rose-300"
    : tone === "orange" ? "text-orange-300"
    : tone === "amber" ? "text-amber-300"
    : "text-cyan-300";
  return (
    <div className="p-3 rounded-md border border-border/60 bg-secondary/20">
      <div className="flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 ${toneCls}`} />
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      </div>
      <div className={`font-display text-2xl mt-1 ${toneCls}`}>{value}</div>
    </div>
  );
}
