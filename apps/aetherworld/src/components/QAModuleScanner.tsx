import { Badge } from "@/components/ui/badge";
import type { QAScanResult } from "@/lib/softwareQAFeedbackCalculus";
import { QA_MODULE_REGISTRY } from "@/constants/qaModuleRegistry";

const STATUS_TONE: Record<string, string> = {
  STABLE: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  BETA: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  EXPERIMENTAL: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  PLACEHOLDER: "bg-slate-400/15 text-slate-200 border-slate-400/30",
  LOCKED: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

const RISK_TONE: Record<string, string> = {
  LOW: "text-emerald-300",
  MEDIUM: "text-amber-300",
  HIGH: "text-rose-300",
};

export function QAModuleScanner({ result }: { result: QAScanResult }) {
  const issueByModule = new Map<string, number>();
  for (const i of result.issues) {
    if (!i.module) continue;
    issueByModule.set(i.module, (issueByModule.get(i.module) ?? 0) + 1);
  }

  return (
    <div className="aether-card-elevated p-5">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        Module Scanner · 模块扫描矩阵
      </div>
      <div className="flex items-baseline justify-between mt-1">
        <h2 className="font-display text-lg gold-text">模块接入与稳定性</h2>
        <span className="text-[11px] text-muted-foreground">
          接入度 {result.moduleIntegrationScore}/100
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-2 mt-4">
        {QA_MODULE_REGISTRY.map((m) => {
          const issues = issueByModule.get(m.id) ?? 0;
          return (
            <div key={m.id} className="p-3 rounded-md border border-border/60 bg-secondary/15">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm truncate">{m.name}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{m.en}</div>
                </div>
                <Badge variant="outline" className={`${STATUS_TONE[m.status]} text-[10px] shrink-0`}>
                  {m.status}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-2 text-[10px]">
                <span className={`${RISK_TONE[m.riskLevel]}`}>● {m.riskLevel}</span>
                {m.expectedRoute && (
                  <span className="text-muted-foreground font-mono truncate">{m.expectedRoute}</span>
                )}
                {issues > 0 && (
                  <span className="ml-auto text-rose-300">{issues} issue{issues > 1 ? "s" : ""}</span>
                )}
              </div>
              {m.expectedIntegrations.length > 0 && (
                <div className="text-[10px] text-muted-foreground/80 mt-1.5 truncate">
                  → {m.expectedIntegrations.join(", ")}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
