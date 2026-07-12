import { Shield } from "lucide-react";
import type { QAScanResult } from "@/lib/softwareQAFeedbackCalculus";

export function QASafetyCoveragePanel({ result }: { result: QAScanResult }) {
  const required = result.knownRoutes.filter((r) => r.requiresSafetyBoundary);
  const issues = result.issues.filter((i) => i.category === "SAFETY_BOUNDARY_MISSING");
  const missing = new Set(issues.map((i) => i.route));

  return (
    <div className="aether-card-elevated p-5">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-primary" />
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Safety Coverage · 安全边界覆盖
        </div>
      </div>
      <div className="flex items-baseline justify-between mt-1">
        <h2 className="font-display text-lg gold-text">安全提示覆盖率</h2>
        <span className="text-[11px] text-muted-foreground">
          覆盖 {result.safetyCoverageScore}%
        </span>
      </div>

      <div className="w-full h-2 bg-secondary/40 rounded-full overflow-hidden mt-3">
        <div className="h-full bg-emerald-400/70" style={{ width: `${result.safetyCoverageScore}%` }} />
      </div>

      <div className="mt-4 space-y-1.5">
        {required.map((r) => {
          const ok = !missing.has(r.path);
          return (
            <div key={r.path} className="flex items-center justify-between gap-2 text-[11px] py-1 border-b border-border/40">
              <div>
                <span className="font-mono">{r.path}</span>
                <span className="ml-2 text-muted-foreground">{r.title}</span>
              </div>
              <span className={ok ? "text-emerald-300" : "text-rose-300"}>
                {ok ? "已接入 SafetyBoundaryBanner" : "缺失"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
