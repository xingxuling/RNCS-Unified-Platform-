import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { readAuditLog, clearAuditLog } from "@/lib/founderAuditLog";
import { RISK_COLORS } from "@/constants/founderPermissionLevels";
import { Button } from "@/components/ui/button";
import { useFounderState } from "@/hooks/useFounderState";
import { Trash2 } from "lucide-react";

export function FounderAuditLogPanel() {
  const { refresh } = useFounderState();
  const logs = readAuditLog();

  return (
    <Card className="aether-card-elevated p-0 overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg">创始人操作日志</h3>
          <p className="text-xs text-muted-foreground">本地记录 · 仅本设备可见 · 最多保留 200 条</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { clearAuditLog(); refresh(); }} className="gap-1">
          <Trash2 className="w-3 h-3" /> 清空
        </Button>
      </div>
      {logs.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">暂无操作记录</div>
      ) : (
        <div className="max-h-[480px] overflow-y-auto divide-y divide-border/40">
          {logs.map((l) => (
            <div key={l.id} className="p-3 flex items-start gap-3 text-sm">
              <Badge variant="outline" className={l.riskLevel === "INFO" ? "" : RISK_COLORS[l.riskLevel as keyof typeof RISK_COLORS]}>
                {l.riskLevel}
              </Badge>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={l.success ? "" : "text-destructive"}>{l.action}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{l.moduleId}</span>
                </div>
                <div className="text-xs text-muted-foreground">{l.details}</div>
                <div className="text-[10px] text-muted-foreground/70 mt-0.5">
                  {new Date(l.timestamp).toLocaleString("zh-CN")}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
