import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FOUNDER_RISK_OPERATIONS, type RiskOperation } from "@/constants/founderRiskOperations";
import { RISK_COLORS, RISK_LABELS } from "@/constants/founderPermissionLevels";
import { FounderRiskConfirmDialog } from "./FounderRiskConfirmDialog";
import { FounderSystemMap } from "./FounderSystemMap";
import { FounderAuditLogPanel } from "./FounderAuditLogPanel";
import { FounderModeBadge } from "./FounderModeBadge";
import { useFounderState } from "@/hooks/useFounderState";
import { LogOut, ShieldCheck, AlertTriangle } from "lucide-react";

export function FounderConsolePanel() {
  const { remainingMinutes, exitFounder } = useFounderState();
  const [op, setOp] = useState<RiskOperation | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <Card className="aether-card-elevated p-5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-amber-400" />
          <div>
            <h2 className="font-display text-2xl gold-text">创始人控制台</h2>
            <p className="text-xs text-muted-foreground">Founder Mode Active · 高阶功能已解锁 · 剩余 {remainingMinutes} 分钟</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FounderModeBadge />
          <Button variant="outline" size="sm" onClick={exitFounder} className="gap-1">
            <LogOut className="w-3 h-3" /> 退出创始人模式
          </Button>
        </div>
      </Card>

      <SystemOverview />
      <FounderSystemMap />

      <Card className="aether-card-elevated p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="font-display text-lg">高风险操作</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">所有操作都需要输入确认短语后才会执行。</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {FOUNDER_RISK_OPERATIONS.map((o) => (
            <button
              key={o.id}
              onClick={() => { setOp(o); setOpen(true); }}
              className="text-left p-3 rounded border border-border hover:border-amber-500/50 hover:bg-amber-500/5 transition"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm">{o.title}</span>
                <Badge variant="outline" className={`text-[10px] ${RISK_COLORS[o.riskLevel]}`}>
                  {RISK_LABELS[o.riskLevel]}
                </Badge>
              </div>
              <div className="text-[10px] text-muted-foreground">{o.scope} · {o.reversible ? "可撤销" : "不可撤销"}</div>
            </button>
          ))}
        </div>
      </Card>

      <FounderAuditLogPanel />

      <FounderRiskConfirmDialog operation={op} open={open} onOpenChange={setOpen} />
    </div>
  );
}

function SystemOverview() {
  const items = [
    { label: "版本", value: "v1.0 RC" },
    { label: "QA 健康度", value: "良好" },
    { label: "内测状态", value: "Private Alpha" },
    { label: "事件库", value: "116 / OK" },
    { label: "语言适配", value: "中文 · 良好" },
    { label: "UI 适配", value: "Mobile · OK" },
    { label: "新手引导", value: "已启用" },
    { label: "Demo/Real 隔离", value: "正常" },
  ];
  return (
    <Card className="aether-card-elevated p-4">
      <h3 className="font-display text-lg mb-3">系统状态总览</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((i) => (
          <div key={i.label} className="p-3 rounded border border-border/60 bg-muted/20">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{i.label}</div>
            <div className="text-sm mt-1">{i.value}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
