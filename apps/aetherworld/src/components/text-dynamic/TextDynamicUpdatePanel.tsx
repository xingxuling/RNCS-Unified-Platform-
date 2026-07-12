import { useState } from "react";
import {
  getTextDynamicSummary, runDetectAndGenerate, runFullStaleSweep, runFullTextAudit,
} from "@/lib/text-dynamic/textDynamicUpdateEngine";
import { TEXT_TRIGGER_TYPES, TEXT_TRIGGER_LABELS, type TextTriggerType } from "@/constants/text-dynamic/textTriggerTypes";

export function TextDynamicUpdatePanel() {
  const [summary, setSummary] = useState(() => getTextDynamicSummary());
  const [trigger, setTrigger] = useState<TextTriggerType>("UI_LAYOUT_CHANGED");
  const [log, setLog] = useState<string>("");

  function refresh() { setSummary(getTextDynamicSummary()); }

  function doDetect() {
    const r = runDetectAndGenerate(trigger);
    setLog(`检测 ${trigger}：affected=${r.detection.impact.affectedTextIds.length} · 候选=${r.candidates.length} · 影响级别=${r.detection.impact.impactLevel}`);
    refresh();
  }

  function doStale() {
    const r = runFullStaleSweep();
    setLog(`Stale Sweep：${r.staleCount} 条 stale，CRITICAL ${r.criticalStaleItems.length}。`);
    refresh();
  }

  function doAudit() {
    const r = runFullTextAudit();
    setLog(`Audit：${r.status}，issues=${r.issues.length}（critical ${r.summary.critical} / high ${r.summary.high} / warn ${r.summary.warn}）。`);
    refresh();
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 space-y-4">
      <header>
        <h2 className="font-display text-lg">总览 · Overview</h2>
        <p className="text-xs text-muted-foreground">应用文本随系统模块、权重、常数、宪法、主体模式、教程和 UI 自动演化。</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        <Metric label="文本总数" value={summary.totalTextEntries} />
        <Metric label="stale 文本" value={summary.staleTextCount} />
        <Metric label="CRITICAL 问题" value={summary.criticalTextIssues} />
        <Metric label="本地化 stale" value={summary.localizationStaleCount} />
        <Metric label="待审核" value={summary.pendingReviewCount} />
        <Metric label="当前版本" value={summary.currentTextVersion} />
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-xs text-muted-foreground">触发器</div>
          <select value={trigger} onChange={(e) => setTrigger(e.target.value as TextTriggerType)}
            className="bg-background border border-border rounded px-2 py-1 text-xs">
            {TEXT_TRIGGER_TYPES.map((t) => <option key={t} value={t}>{t}（{TEXT_TRIGGER_LABELS[t]}）</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={doDetect} className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground">检测文本影响</button>
          <button onClick={doStale} className="text-xs px-3 py-1.5 rounded border border-border">Stale Sweep</button>
          <button onClick={doAudit} className="text-xs px-3 py-1.5 rounded border border-border">运行 Audit</button>
        </div>
        {log && <pre className="text-xs whitespace-pre-wrap text-muted-foreground">{log}</pre>}
      </div>

      <div className="text-xs text-muted-foreground">
        受众分布：PUBLIC {summary.byAudience.PUBLIC} · ADVANCED {summary.byAudience.ADVANCED} · FOUNDER {summary.byAudience.FOUNDER}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-display">{value}</div>
    </div>
  );
}
