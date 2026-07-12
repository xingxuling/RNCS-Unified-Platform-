import { ArrowRight } from "lucide-react";
import type { QAScanResult } from "@/lib/softwareQAFeedbackCalculus";

export function QARouteScanner({ result }: { result: QAScanResult }) {
  return (
    <div className="aether-card-elevated p-5">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        Route Scanner · 路由扫描表
      </div>
      <div className="flex items-baseline justify-between mt-1">
        <h2 className="font-display text-lg gold-text">路由可达性</h2>
        <span className="text-[11px] text-muted-foreground">
          {result.knownRoutes.length} 条路由 · 可达 {result.routeScore}%
        </span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr className="border-b border-border/60">
              <th className="text-left py-2 px-2">路由</th>
              <th className="text-left py-2 px-2">名称</th>
              <th className="text-left py-2 px-2">分组</th>
              <th className="text-left py-2 px-2">风险</th>
              <th className="text-left py-2 px-2">需要</th>
            </tr>
          </thead>
          <tbody>
            {result.knownRoutes.map((r) => (
              <tr key={r.path} className="border-b border-border/40">
                <td className="py-2 px-2 font-mono text-[11px]">{r.path}</td>
                <td className="py-2 px-2">
                  <div>{r.title}</div>
                  <div className="text-[10px] text-muted-foreground">{r.en}</div>
                </td>
                <td className="py-2 px-2 text-muted-foreground">{r.group}</td>
                <td className={`py-2 px-2 ${
                  r.risk === "HIGH" ? "text-rose-300"
                  : r.risk === "MEDIUM" ? "text-amber-300"
                  : "text-emerald-300"
                }`}>{r.risk}</td>
                <td className="py-2 px-2">
                  <div className="flex flex-wrap gap-1">
                    {r.requiresFeedbackEntry && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground">回验</span>
                    )}
                    {r.requiresSafetyBoundary && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground">安全</span>
                    )}
                    {r.requiresPrivacyWarning && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground">隐私</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1.5">
        <ArrowRight className="w-3 h-3" />
        如检测到 ROUTE_MISSING 类问题，将在修复优先级板中标记。
      </div>
    </div>
  );
}
