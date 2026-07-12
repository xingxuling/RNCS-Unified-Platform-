import type { DigitalRoleOutput } from "@/lib/digital-roles/digitalRoleOutputAdapter";

export function DigitalRoleOutputPanel({ outputs }: { outputs: DigitalRoleOutput[] }) {
  return (
    <div className="aether-card p-3 space-y-2">
      <div className="text-xs text-muted-foreground">角色输出 ({outputs.length})</div>
      <div className="space-y-2 max-h-64 overflow-auto">
        {outputs.map((o) => (
          <div key={o.outputId} className="border border-border/40 rounded p-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium">{o.roleId}</div>
              <div className="flex gap-1">
                {o.qaRequired && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600">QA</span>}
                {o.governanceRequired && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-600">治理</span>}
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground">{o.summary}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
