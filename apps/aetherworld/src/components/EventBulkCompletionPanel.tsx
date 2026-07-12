import { useMemo } from "react";
import { runBulkCompletion, generateBulkChangeReport } from "@/lib/eventLibraryBulkCompletion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

const STATUS_TONE: Record<string, string> = {
  OK: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  PARTIAL: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  MISSING: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  WEAK: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  OVERFLOW: "bg-sky-500/10 text-sky-600 border-sky-500/20",
};

function StatusIcon({ status }: { status: string }) {
  if (status === "OK") return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
  if (status === "PARTIAL" || status === "WEAK") return <AlertCircle className="w-4 h-4 text-amber-600" />;
  return <XCircle className="w-4 h-4 text-rose-600" />;
}

export function EventBulkCompletionPanel() {
  const report = useMemo(() => runBulkCompletion(), []);
  const markdown = useMemo(() => generateBulkChangeReport(report), [report]);

  const copyReport = () => {
    navigator.clipboard.writeText(markdown);
    toast.success("变更报告已复制到剪贴板");
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Event Library Bulk Completion · 批量事件库补全施工</div>
            <h2 className="text-xl font-semibold">批量补全结果</h2>
          </div>
          <div className="flex gap-2 items-center">
            {report.v1Ready ? (
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">v1.0 内测就绪</Badge>
            ) : (
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">尚未达到 v1 基线</Badge>
            )}
            <Button size="sm" variant="outline" onClick={copyReport}>
              <Copy className="w-3.5 h-3.5 mr-1.5" /> 复制变更报告
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricBlock label="原有事件数" value={report.baselineEventCount} />
          <MetricBlock label="当前事件数" value={report.currentEventCount} highlight />
          <MetricBlock label="新增事件数" value={`+${report.addedEventCount}`} highlight />
          <MetricBlock label="平均字段完整度" value={`${report.completion.averageCompleteness}%`} />
          <MetricBlock label="完整度≥80% 事件" value={report.filledEventCount} />
          <MetricBlock label="已补齐字段总量" value={report.filledFieldTotal} />
          <MetricBlock label="父子链路" value={report.parentChildLinks} />
          <MetricBlock label="alias 事件" value={report.aliasedCount} />
        </div>

        <div className="mt-4 p-3 rounded-lg bg-muted/40 border border-border/60 text-xs space-y-1">
          {report.readinessNotes.map((n, i) => (
            <div key={i} className="text-muted-foreground">{n}</div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-base font-semibold mb-3">15 维度覆盖</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {report.coverage.coverage.map((c) => (
            <div key={c.targetId} className="flex items-center justify-between p-2.5 rounded-md border border-border/60 bg-card">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.en}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm tabular-nums font-medium">{c.currentCount}</span>
                <span className="text-xs text-muted-foreground">/ {c.minCount}–{c.maxCount}</span>
                <Badge variant="outline" className={`text-[10px] ${STATUS_TONE[c.status] ?? ""}`}>
                  {c.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-base font-semibold mb-3">接入状态</h3>
        <div className="space-y-2">
          {report.integration.map((i) => (
            <div key={i.module} className="flex items-start gap-3 p-3 rounded-md border border-border/60 bg-card">
              <StatusIcon status={i.status} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">{i.module}</div>
                  <Badge variant="outline" className={`text-[10px] ${STATUS_TONE[i.status] ?? ""}`}>
                    {i.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{i.description}</div>
                <div className="text-xs text-muted-foreground mt-1">{i.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-base font-semibold mb-2">变更报告（Markdown）</h3>
        <p className="text-xs text-muted-foreground mb-3">
          可粘贴到周报 / PR 描述 / 产品文档。仅含字段补全与接入摘要，不输出敏感数据。
        </p>
        <pre className="p-3 rounded-md bg-muted/40 border border-border/60 text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap">
{markdown}
        </pre>
      </Card>
    </div>
  );
}

function MetricBlock({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`p-3 rounded-lg border ${highlight ? "border-primary/30 bg-primary/5" : "border-border/60 bg-card"}`}>
      <div className="text-[11px] text-muted-foreground mb-1">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
