import type { CrossFunctionalQaResult } from "@/lib/cross-functional/crossFunctionalQaBridge";
import type { MeaningDriftCheck } from "@/lib/cross-functional/crossFunctionalMeaningDriftDetector";
import type { CrossFunctionalSafetyFinding } from "@/lib/cross-functional/crossFunctionalSafetyGuard";

export function CrossFunctionalQaPanel({
  qa,
  drift,
  safety,
}: {
  qa: CrossFunctionalQaResult;
  drift: MeaningDriftCheck;
  safety: { findings: CrossFunctionalSafetyFinding[]; blocked: boolean };
}) {
  const tone =
    qa.status === "FAIL" || safety.blocked
      ? "border-red-500/40 text-red-400"
      : qa.status === "WARN" || drift.driftLevel === "HIGH"
      ? "border-amber-500/40 text-amber-400"
      : "border-emerald-500/40 text-emerald-400";
  return (
    <div className={`aether-card p-4 space-y-3 border ${tone}`}>
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">跨功能 QA</div>
        <div className="flex items-center gap-2 text-[11px]">
          <span>QA：{qa.status}</span>
          <span>漂移：{drift.driftLevel}</span>
          {safety.blocked && <span className="text-red-400">SAFETY: BLOCK</span>}
        </div>
      </div>

      {qa.issues.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">问题</div>
          <ul className="space-y-1 text-xs">
            {qa.issues.map((i, n) => (
              <li key={n}>
                <span className="text-foreground">[{i.severity}]</span> {i.code} · {i.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {drift.driftReasons.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">意义漂移</div>
          <ul className="space-y-1 text-xs">
            {drift.driftReasons.map((r, i) => <li key={i}>· {r}</li>)}
          </ul>
        </div>
      )}

      {safety.findings.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">安全检查</div>
          <ul className="space-y-1 text-xs">
            {safety.findings.map((f, i) => (
              <li key={i}>
                <span className="text-foreground">[{f.severity}]</span> {f.code} · {f.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {qa.recommendedFixes.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">建议修复</div>
          <ul className="space-y-1 text-xs">
            {qa.recommendedFixes.map((f, i) => <li key={i}>· {f}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
