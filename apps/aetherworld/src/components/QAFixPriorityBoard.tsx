import { Badge } from "@/components/ui/badge";
import { Flag } from "lucide-react";
import {
  bucketByPriority,
  type QAScanResult,
  type QAIssue,
} from "@/lib/softwareQAFeedbackCalculus";
import { QA_SEVERITY_META } from "@/constants/qaSeverityLevels";
import { QA_CATEGORY_META } from "@/constants/qaTestCategories";

const PRIORITY_TONE: Record<string, string> = {
  P0: "border-rose-500/40 bg-rose-500/5",
  P1: "border-orange-500/40 bg-orange-500/5",
  P2: "border-amber-500/40 bg-amber-500/5",
  P3: "border-slate-400/30 bg-slate-400/5",
};

interface Props {
  result: QAScanResult;
  onPickIssue?: (issue: QAIssue) => void;
}

export function QAFixPriorityBoard({ result, onPickIssue }: Props) {
  const buckets = bucketByPriority(result.issues);
  return (
    <div className="aether-card-elevated p-5">
      <div className="flex items-center gap-2">
        <Flag className="w-4 h-4 text-primary" />
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Fix Priority Board · 修复优先级
        </div>
      </div>
      <h2 className="font-display text-lg gold-text mt-1">应该先修什么？</h2>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3 mt-4">
        {buckets.map((b) => (
          <div key={b.priority} className={`rounded-md border ${PRIORITY_TONE[b.priority]} p-3`}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{b.priority} · {b.label}</div>
              <Badge variant="outline" className="text-[10px]">{b.issues.length}</Badge>
            </div>
            <div className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{b.description}</div>

            <div className="mt-3 space-y-1.5">
              {b.issues.length === 0 && (
                <div className="text-[10px] text-emerald-300/80">本组当前无问题。</div>
              )}
              {b.issues.map((it) => {
                const sev = QA_SEVERITY_META[it.severity];
                const cat = QA_CATEGORY_META[it.category];
                return (
                  <button
                    key={it.id}
                    onClick={() => onPickIssue?.(it)}
                    className="w-full text-left p-2 rounded border border-border/60 bg-secondary/15 hover:border-primary/40 transition"
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className={`${sev.badgeClass} text-[10px]`}>
                        {sev.cn}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{cat.cn}</span>
                    </div>
                    <div className="text-[11px] mt-1 line-clamp-2">{it.title}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
