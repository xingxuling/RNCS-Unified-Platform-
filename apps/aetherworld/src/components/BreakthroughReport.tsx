import type { UniversalBreakthroughResult } from "@/lib/universalBreakthroughCalculus";

export function BreakthroughReport({ data }: { data: UniversalBreakthroughResult }) {
  return (
    <section className="aether-card-elevated p-5 space-y-3">
      <header className="flex items-center justify-between">
        <h3 className="font-display text-base gold-text">破解报告</h3>
        <div className="text-xs text-muted-foreground">破解度 {Math.round(data.score * 100)}%</div>
      </header>
      <div className="text-sm space-y-1">
        <div><span className="text-muted-foreground text-xs mr-1">对象：</span>{data.recognition.objectType.userFriendlyName}（置信度 {Math.round(data.recognition.confidence * 100)}%）</div>
        <div><span className="text-muted-foreground text-xs mr-1">关键缺口：</span>{data.gaps.keyGap}</div>
        <div><span className="text-muted-foreground text-xs mr-1">主动作：</span>{data.permission.primaryAction} · 风险 {data.permission.riskLevel}</div>
      </div>
      <button
        onClick={() => {
          const json = JSON.stringify(data, null, 2);
          const blob = new Blob([json], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = "breakthrough-report.json"; a.click();
          URL.revokeObjectURL(url);
        }}
        className="text-xs px-3 py-1 rounded border border-border hover:border-primary/40"
      >
        导出 JSON 报告
      </button>
    </section>
  );
}
