import { useEffect, useMemo, useState } from "react";

import { BookOpen, Info, AlertTriangle, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  computeManualGuidance,
  hasAcknowledged,
  setAcknowledged,
  type ManualCalculusInput,
} from "@/lib/manualCalculus";

interface Props extends ManualCalculusInput {
  className?: string;
  /** 隐藏 tooltip / inline 级别的提示 */
  silentLowLevels?: boolean;
}

export function ContextualManualHint(props: Props) {
  const { className, silentLowLevels, ...input } = props;

  const acknowledged = useMemo(
    () => hasAcknowledged(input.currentPage, input.subjectMode),
    [input.currentPage, input.subjectMode],
  );

  const result = useMemo(
    () => computeManualGuidance({ ...input, isFirstEnter: !acknowledged }),
    [input, acknowledged],
  );

  const [dismissed, setDismissed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [ackOpen, setAckOpen] = useState(false);

  useEffect(() => {
    if (result.guidanceType === "MODAL" && !acknowledged) setModalOpen(true);
    if (result.guidanceType === "BLOCKING_CONFIRMATION" && !acknowledged) setAckOpen(true);
  }, [result.guidanceType, acknowledged]);

  if (dismissed || result.guidanceType === "NONE") return null;

  const handleAck = () => {
    setAcknowledged(input.currentPage, input.subjectMode);
    setAckOpen(false);
    setModalOpen(false);
  };

  // 阻塞确认
  if (result.guidanceType === "BLOCKING_CONFIRMATION") {
    return (
      <Dialog open={ackOpen} onOpenChange={() => { /* 阻塞，不可关闭 */ }}>
        <DialogContent className="aether-card-elevated max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-300">
              <ShieldAlert className="w-4 h-4" />
              <DialogTitle>{result.title}</DialogTitle>
            </div>
            <DialogDescription className="text-xs leading-relaxed pt-2">
              {result.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            {result.linkToDocs && (
              <Button asChild variant="ghost" size="sm">
                <a href={result.linkToDocs}>
                  <BookOpen className="w-3.5 h-3.5 mr-1" />
                  查看使用手册
                </a>
              </Button>
            )}
            <Button size="sm" onClick={handleAck}>
              {result.actionLabel ?? "我已理解，继续使用"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Modal
  if (result.guidanceType === "MODAL") {
    return (
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="aether-card-elevated max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              {result.title}
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed pt-2">
              {result.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {result.linkToDocs && (
              <Button asChild variant="ghost" size="sm">
                <a href={result.linkToDocs}>查看使用手册</a>
              </Button>
            )}
            <Button size="sm" onClick={handleAck}>我已了解</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Banner
  if (result.guidanceType === "BANNER") {
    return (
      <div className={`aether-card border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-3 ${className ?? ""}`}>
        <AlertTriangle className="w-4 h-4 text-amber-300 mt-0.5 shrink-0" />
        <div className="flex-1 text-xs leading-relaxed">
          <div className="text-amber-200 font-medium">{result.title}</div>
          <div className="text-muted-foreground mt-0.5">{result.message}</div>
        </div>
        {result.linkToDocs && (
          <Button asChild size="sm" variant="ghost" className="h-7 text-[11px]">
            <a href={result.linkToDocs}>使用手册</a>
          </Button>
        )}
        <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Inline hint
  if (result.guidanceType === "INLINE_HINT") {
    if (silentLowLevels) return null;
    return (
      <div className={`flex items-start gap-2 text-[11px] text-muted-foreground bg-secondary/30 border border-border/60 rounded-md px-3 py-2 ${className ?? ""}`}>
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary/70" />
        <div className="flex-1">
          <span className="text-foreground/80">{result.title}：</span>
          {result.message}
        </div>
        {result.linkToDocs && (
          <a href={result.linkToDocs} className="text-primary hover:underline shrink-0">
            手册
          </a>
        )}
      </div>
    );
  }

  // Tooltip
  if (silentLowLevels) return null;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className={`inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground ${className ?? ""}`}>
            <Info className="w-3 h-3" />
            使用提示
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-[260px] text-xs leading-relaxed">
          <div className="font-medium">{result.title}</div>
          <div className="text-muted-foreground mt-1">{result.message}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
