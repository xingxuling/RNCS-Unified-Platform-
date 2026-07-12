import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FOUNDER_PROTECTED_MODULES } from "@/constants/founderProtectedModules";
import { getAllPermissions, roleSummary } from "@/lib/founderPermissionCalculus";
import { RISK_COLORS, RISK_LABELS } from "@/constants/founderPermissionLevels";
import { Check, X } from "lucide-react";
import { useFounderState } from "@/hooks/useFounderState";

export function FounderPermissionMatrix() {
  const { role } = useFounderState();
  const perms = getAllPermissions(role);
  const summary = roleSummary(role);

  return (
    <div className="space-y-4">
      <Card className="aether-card-elevated p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">当前角色</div>
            <div className="font-display text-xl">{summary.roleSpec.title} · {summary.roleSpec.en}</div>
            <div className="text-xs text-muted-foreground mt-1">{summary.roleSpec.description}</div>
          </div>
          <div className="flex gap-4 text-sm">
            <Stat label="可见" value={summary.visible} total={summary.total} />
            <Stat label="可编辑" value={summary.editable} total={summary.total} />
            <Stat label="可执行" value={summary.runnable} total={summary.total} />
          </div>
        </div>
      </Card>

      <Card className="aether-card-elevated p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-3">模块</th>
                <th className="text-center p-3">查看</th>
                <th className="text-center p-3">编辑</th>
                <th className="text-center p-3">执行</th>
                <th className="text-center p-3">导出</th>
                <th className="text-center p-3">需确认</th>
                <th className="text-left p-3">风险</th>
              </tr>
            </thead>
            <tbody>
              {perms.map((p, i) => {
                const m = FOUNDER_PROTECTED_MODULES[i];
                return (
                  <tr key={p.moduleId} className="border-t border-border/40">
                    <td className="p-3">
                      <div>{m.title}</div>
                      <div className="text-[10px] text-muted-foreground">{m.en}</div>
                    </td>
                    <Tick on={p.canView} />
                    <Tick on={p.canEdit} />
                    <Tick on={p.canRun} />
                    <Tick on={p.canExport} />
                    <Tick on={p.requiresConfirm} amber />
                    <td className="p-3">
                      <Badge variant="outline" className={RISK_COLORS[p.riskLevel]}>
                        {RISK_LABELS[p.riskLevel]}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Tick({ on, amber }: { on: boolean; amber?: boolean }) {
  return (
    <td className="text-center p-3">
      {on ? (
        <Check className={`w-4 h-4 inline ${amber ? "text-amber-400" : "text-emerald-400"}`} />
      ) : (
        <X className="w-4 h-4 inline text-muted-foreground/40" />
      )}
    </td>
  );
}

function Stat({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <div className="text-center">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="font-mono">{value}<span className="text-muted-foreground">/{total}</span></div>
    </div>
  );
}
