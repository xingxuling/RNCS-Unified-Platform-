import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RiskOperation } from "@/constants/founderRiskOperations";
import { RISK_LABELS } from "@/constants/founderPermissionLevels";
import { appendAuditLog } from "@/lib/founderAuditLog";

interface Props {
  operation: RiskOperation | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm?: (op: RiskOperation) => void | Promise<void>;
}

export function FounderRiskConfirmDialog({ operation, open, onOpenChange, onConfirm }: Props) {
  const [phrase, setPhrase] = useState("");
  const [busy, setBusy] = useState(false);

  if (!operation) return null;
  const match = phrase.trim() === operation.requireConfirmPhrase;

  const handleConfirm = async () => {
    if (!match) return;
    setBusy(true);
    try {
      await onConfirm?.(operation);
      appendAuditLog({
        action: operation.title,
        moduleId: operation.id,
        riskLevel: operation.riskLevel,
        details: `${operation.scope} · ${operation.reversible ? "可撤销" : "不可撤销"}`,
        success: true,
      });
      onOpenChange(false);
      setPhrase("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            高风险操作二次确认
          </DialogTitle>
          <DialogDescription>{operation.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3 p-3 rounded border border-border bg-muted/30">
            <Info label="操作名称" value={operation.title} />
            <Info label="风险等级" value={RISK_LABELS[operation.riskLevel]} />
            <Info label="影响范围" value={operation.scope} />
            <Info label="是否可撤销" value={operation.reversible ? "可撤销" : "不可撤销"} />
          </div>
          <div>
            <Label className="text-xs">请输入确认短语 <span className="text-amber-400 font-mono">{operation.requireConfirmPhrase}</span> 以继续</Label>
            <Input value={phrase} onChange={(e) => setPhrase(e.target.value)} placeholder={operation.requireConfirmPhrase} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button variant="destructive" disabled={!match || busy} onClick={handleConfirm}>
            确认执行
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-muted-foreground tracking-wider uppercase">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}
