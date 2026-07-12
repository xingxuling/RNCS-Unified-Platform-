import type { WebCmRunResult } from "@/lib/web-knowledge-trinity/webcm/webCmRuntime";

export function WebCalculusRoutePanel({ result }: { result?: WebCmRunResult }) {
  if (!result) return <div className="text-xs text-muted-foreground">尚未生成计算法路线。</div>;
  return (
    <div className="space-y-2 text-xs">
      <div className="rounded border border-border/40 p-2">
        <div className="font-semibold mb-1">路线 {result.route.routeId.slice(-8)}</div>
        <div className="text-muted-foreground mb-1">意图：{result.route.userIntent}</div>
        <div className="text-muted-foreground mb-1">原因：{result.route.routeReason}</div>
        <div>合约：{result.route.outputContract.join(", ")}</div>
        <div>QA 必需：{result.route.qaRequired ? "是" : "否"}</div>
      </div>
      <div className="rounded border border-border/40 p-2">
        <div className="font-semibold mb-1">执行计划</div>
        <ol className="space-y-1 list-decimal list-inside">
          {result.route.executionSteps.map((s) => (
            <li key={s.stepId}>
              <span className="font-medium">{s.action}</span>
              <span className="text-[10px] text-amber-400 ml-1">[{s.calculusId}]</span>
              <span className="text-[10px] text-muted-foreground ml-1">{s.status}</span>
            </li>
          ))}
        </ol>
        <div className="text-[10px] text-muted-foreground mt-2">
          总步数 {result.plan.totalSteps} · 预计 {result.plan.estimatedMillis}ms
        </div>
      </div>
    </div>
  );
}
