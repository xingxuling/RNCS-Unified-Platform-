import { useMemo, useState } from "react";
import { RefreshCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAetherData } from "@/lib/useAetherData";
import {
  getSnapshot, recalculate,
} from "@/lib/globalRecalculationEngine";
import {
  RECALCULATION_TRIGGERS, type RecalculationTriggerId,
} from "@/constants/recalculationTriggers";
import {
  SCOPE_META, SCOPE_MODULES, RECALC_MODULES,
  type RecalculationScopeId,
} from "@/constants/recalculationScopes";
import { toast } from "sonner";

interface Props {
  scope?: RecalculationScopeId;
  trigger?: RecalculationTriggerId;
  label?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "secondary" | "outline" | "ghost";
  /** 是否显示 stale 徽标（小红点 + 数量） */
  showStaleBadge?: boolean;
}

export function GlobalRecalculateButton({
  scope = "FULL_SYSTEM",
  trigger = "MANUAL",
  label,
  size = "sm",
  variant = "outline",
  showStaleBadge = true,
}: Props) {
  const { active, feedback } = useAetherData();
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const snap = useMemo(() => getSnapshot(), [active, feedback, open, running]);

  const triggerMeta = RECALCULATION_TRIGGERS[trigger];
  const scopeMeta = SCOPE_META[scope];
  const willAffect = SCOPE_MODULES[scope];
  const needsConfirm = triggerMeta.requiresConfirmation || scope === "FULL_SYSTEM";

  async function run() {
    setRunning(true);
    try {
      const log = await recalculate(trigger, scope, {
        beforeSummary: `范围：${scopeMeta.cn}（${scopeMeta.en}）`,
        afterSummary: `刷新完成。受影响模块：${willAffect.length} 个。`,
      });
      toast.success(
        log.status === "COMPLETED"
          ? "重算完成"
          : log.status === "NEEDS_REVIEW"
            ? "重算完成，需复核"
            : "重算失败",
      );
      setOpen(false);
    } finally {
      setRunning(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={size} variant={variant} className="gap-2 relative">
          <RefreshCcw className={`w-3.5 h-3.5 ${running ? "animate-spin" : ""}`} />
          {label ?? `重算 · ${scopeMeta.cn}`}
          {showStaleBadge && snap.staleCount > 0 && (
            <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">
              {snap.staleCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">确认重算</DialogTitle>
          <DialogDescription>
            范围：<span className="text-foreground">{scopeMeta.cn} · {scopeMeta.en}</span>
            <br />
            {scopeMeta.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-xs">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
              将刷新模块（{willAffect.length}）
            </div>
            <div className="flex flex-wrap gap-1">
              {willAffect.map((m) => (
                <span key={m} className="text-[10px] px-2 py-0.5 rounded border border-border bg-secondary/20">
                  {RECALC_MODULES[m].cn}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-border bg-secondary/10 p-3 space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-1.5 text-foreground">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span className="font-display">安全规则</span>
            </div>
            <ul className="text-muted-foreground list-disc list-inside space-y-0.5">
              <li>不删除原始数列与回验记录</li>
              <li>Demo 与真实主体严格隔离，不互相污染</li>
              <li>不重置 Prompt 历史与产品文档</li>
              <li>失败时保留旧状态并记录日志</li>
            </ul>
          </div>

          {needsConfirm && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-amber-300 text-[11px]">
              此操作影响范围较大{scope === "FULL_SYSTEM" ? "（完整全系统）" : ""}，请确认后执行。
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={running}>
            取消
          </Button>
          <Button onClick={run} disabled={running} className="gap-2">
            <RefreshCcw className={`w-3.5 h-3.5 ${running ? "animate-spin" : ""}`} />
            {running ? "正在重算…" : "立即重算"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
