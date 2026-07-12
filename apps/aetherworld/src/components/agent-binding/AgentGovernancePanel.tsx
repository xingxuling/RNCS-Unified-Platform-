import type { GovernanceCheckResult } from "@/lib/agent-binding/agentGovernanceGuard";

export function AgentGovernancePanel({ result }: { result: GovernanceCheckResult }) {
  return (
    <div className="aether-card p-3 text-xs space-y-1">
      <div className="text-[11px] text-muted-foreground">治理检查</div>
      <div>状态：<span className={result.ok ? "text-emerald-400" : "text-red-400"}>{result.ok ? "PASS" : "BLOCKED"}</span></div>
      {result.blocked.length > 0 && <div>阻断：{result.blocked.join("、")}</div>}
      {result.warnings.length > 0 && <div className="text-amber-300">警告：{result.warnings.join("；")}</div>}
    </div>
  );
}
