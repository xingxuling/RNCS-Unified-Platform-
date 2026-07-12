import { useState } from "react";

import { CheckCircle2, MessageSquarePlus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  QUICK_FEEDBACK_OPTIONS,
  type QuickFeedbackId,
} from "@/constants/feedbackEntryRules";
import { toast } from "sonner";

interface Props {
  date?: string;
  /** 是否已经回验过 */
  alreadyLogged?: boolean;
  /** 跳转到详细回验页面的链接 */
  detailLink?: string;
  /** 快速提交回调（可选）；不传则只 toast 提示 */
  onQuickSubmit?: (id: QuickFeedbackId) => void;
  compact?: boolean;
  title?: string;
  className?: string;
}

export function FeedbackEntryCard({
  date,
  alreadyLogged,
  detailLink,
  onQuickSubmit,
  compact,
  title,
  className,
}: Props) {
  const [picked, setPicked] = useState<QuickFeedbackId | null>(null);

  const handlePick = (id: QuickFeedbackId) => {
    setPicked(id);
    if (onQuickSubmit) {
      onQuickSubmit(id);
      toast.success("快速回验已记录，可继续在详情页补充细节");
    } else {
      toast.success("已暂存快速回验，请前往回验中心补充细节");
    }
  };

  return (
    <div className={`aether-card border-primary/20 bg-primary/[0.03] ${compact ? "p-3" : "p-4"} ${className ?? ""}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MessageSquarePlus className={`text-primary ${compact ? "w-3.5 h-3.5" : "w-4 h-4"}`} />
          <div>
            <div className={`font-medium ${compact ? "text-[11px]" : "text-xs"}`}>
              {title ?? (alreadyLogged ? "已回验 · 可补充" : "顺手回验 · 让系统更贴近你")}
            </div>
            {date && (
              <div className="text-[10px] text-muted-foreground mt-0.5">日期 · {date}</div>
            )}
          </div>
        </div>
        {alreadyLogged && (
          <span className="text-[10px] inline-flex items-center gap-1 text-emerald-300">
            <CheckCircle2 className="w-3 h-3" /> 已回验
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {QUICK_FEEDBACK_OPTIONS.map((opt) => {
          const on = picked === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => handlePick(opt.id as QuickFeedbackId)}
              className={`text-[11px] px-2.5 py-1 rounded border transition ${
                on
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {detailLink && (
        <div className="mt-3">
          <Button asChild variant="ghost" size="sm" className="h-7 text-[11px] w-full justify-between">
            <a href={detailLink}>
              详细回验（补充时间、强度、噪声）
              <ExternalLink className="w-3 h-3" />
            </a>
          </Button>
        </div>
      )}

      <div className="text-[10px] text-muted-foreground/80 mt-2 leading-relaxed">
        回验是系统进化的核心。每次回验都会修正未来预测的权重。
      </div>
    </div>
  );
}
