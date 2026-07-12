import { RISK_CONSTANTS } from "@/constants/constant-universe/riskConstants";

const SEV_COLOR: Record<string, string> = {
  LOW: "text-emerald-600",
  MEDIUM: "text-amber-600",
  HIGH: "text-orange-600",
  CRITICAL: "text-red-600",
};

export function RiskConstantsPanel() {
  return (
    <div className="space-y-2">
      {RISK_CONSTANTS.map((r) => (
        <div key={r.riskId} className="border rounded-md p-3">
          <div className="flex justify-between items-baseline">
            <h4 className="font-semibold text-sm">{r.chineseName} <span className="text-xs font-mono text-muted-foreground">{r.riskId}</span></h4>
            <span className={`text-xs font-semibold ${SEV_COLOR[r.severityDefault]}`}>{r.severityDefault}</span>
          </div>
          <p className="text-xs mt-1 text-muted-foreground">触发：{r.triggerPatterns.join("｜")}</p>
          <p className="text-xs mt-0.5 text-muted-foreground">缓解：{r.requiredMitigation.join("｜")}</p>
        </div>
      ))}
    </div>
  );
}
