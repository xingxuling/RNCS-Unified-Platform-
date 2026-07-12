import { MessageSquarePlus } from "lucide-react";
import type { QAScanResult } from "@/lib/softwareQAFeedbackCalculus";

export function QAFeedbackEntryAudit({ result }: { result: QAScanResult }) {
  const required = result.knownRoutes.filter((r) => r.requiresFeedbackEntry);
  const missing = new Set(
    result.issues
      .filter((i) => i.category === "FEEDBACK_ENTRY_MISSING")
      .map((i) => i.route),
  );

  return (
    <div className="aether-card-elevated p-5">
      <div className="flex items-center gap-2">
        <MessageSquarePlus className="w-4 h-4 text-primary" />
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Feedback Entry Audit · 回验入口审计
        </div>
      </div>
      <div className="flex items-baseline justify-between mt-1">
        <h2 className="font-display text-lg gold-text">回验入口覆盖率</h2>
        <span className="text-[11px] text-muted-foreground">
          覆盖 {result.feedbackEntryCoverageScore}%
        </span>
      </div>

      <div className="w-full h-2 bg-secondary/40 rounded-full overflow-hidden mt-3">
        <div className="h-full bg-cyan-400/70" style={{ width: `${result.feedbackEntryCoverageScore}%` }} />
      </div>

      <div className="mt-4 grid sm:grid-cols-2 gap-2">
        {required.map((r) => {
          const ok = !missing.has(r.path);
          return (
            <div key={r.path} className="p-2.5 rounded-md border border-border/60 bg-secondary/15 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[11px] truncate">{r.title}</div>
                <div className="text-[10px] text-muted-foreground font-mono truncate">{r.path}</div>
              </div>
              <span className={`text-[10px] shrink-0 ${ok ? "text-emerald-300" : "text-rose-300"}`}>
                {ok ? "已接入" : "缺失"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
